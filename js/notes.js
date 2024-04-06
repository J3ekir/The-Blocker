/* Heavily inspired by Raymond Hill's uBlock Origin */

(async () => {
    const isMac = window.navigator.userAgent.indexOf("Mac OS") !== -1;
    const forum = parent.document.documentElement.dataset.forum;
    const settings = await chrome.storage.local.get([
        `${ forum }Notes`,
        "hideDoubleTapHint",
    ]);

    var cache = "";

    const buttons = {
        save: qs("#applyButton"),
        import: qs("#importButton"),
        export: qs("#exportButton"),
        filePicker: qs("#filePicker"),
    };

    const codeMirrorOptions = {
        autofocus: true,
        extraKeys: { Enter: cm => cm.replaceSelection("\n") },
        foldGutter: true,
        gutters: ["CodeMirror-foldgutter", "CodeMirror-linenumbers"],
        lineNumbers: true,
        lineWiseCopyCut: true,
        scrollbarStyle: "overlay",
        styleActiveLine: { nonEmpty: true },
        configureMouse: _ => ({ addNew: false }),
    };

    CodeMirror.defineMode("theBlocker-notes", function () {
        let lastUserId = "";

        return {
            token(stream) {
                if (stream.sol()) {
                    if (!stream.match(/^[ ]*\d+[ ].+$/, false)) {
                        stream.skipToEnd();
                        return "line-cm-error";
                    }

                    if (stream.match(/[ ]+/, false)) {
                        stream.eatSpace();
                        return null;
                    }
                }

                if (stream.match(/\d+/, false)) {
                    lastUserId = stream.match(/\d+/)[0];
                    return "keyword";
                }

                const note = stream.match(/[ ].+/)[0];
                if (note.trim() !== settings[`${ forum }Notes`][lastUserId]) {
                    return "line-cm-strong";
                }

                return null;
            }
        };
    });

    const noteEditor = new CodeMirror(qs("#note"), codeMirrorOptions);

    /***************************************** MAIN START *****************************************/

    if (settings["hideDoubleTapHint"]) {
        qs("#doubleTapHint").style.display = "none";
    }
    else {
        qs("#doubleTapHint").style.display = "flex";
        qs("#doubleTapHint>b").addEventListener("click", event => {
            event.currentTarget.parentElement.style.display = "none";
            chrome.storage.local.set({ "hideDoubleTapHint": true });
        });
    }

    if (/\bMobile\b/.test(window.navigator.userAgent)) {
        dom.cl.add("html", "mobile");
    }

    renderNotes();

    noteEditor.on("changes", editorChanged);

    chrome.storage.onChanged.addListener(changes => {
        Object.entries(changes).forEach(([key, { oldValue, newValue }]) => {
            switch (key) {
                case `${ forum }Notes`:
                    settings[key] = newValue;
                    renderNotes();
            }
        });
    });

    window.addEventListener("beforeunload", event => {
        if (buttons.save.disabled) {
            return;
        }

        event.preventDefault();
        event.returnValue = "";
    });

    window.addEventListener("unload", event => {
        parent.postMessage({
            type: "tab",
        }, "*");
    });

    document.addEventListener("keydown", event => {
        if (isMac ? event.metaKey : event.ctrlKey && event.key.toLowerCase() === "s") {
            event.preventDefault();

            if (!buttons.save.disabled) {
                buttons.save.click();
            }
        }
    });

    document.addEventListener("keydown", event => {
        if (isMac ? event.metaKey : event.ctrlKey) {
            dom.cl.add(".cm-keyword", "cm-keyword-link");
        }
    });

    document.addEventListener("keyup", event => {
        if (!(isMac ? event.metaKey : event.ctrlKey)) {
            dom.cl.remove(".cm-keyword.cm-keyword-link", "cm-keyword-link");
        }
    });

    document.addEventListener("mousedown", event => {
        if (dom.cl.has(event.target, "cm-keyword-link")) {
            chrome.tabs.create({ url: `https://${ forum }.net/sosyal/uye/${ dom.text(event.target).trimStart() }` });
        }
    });

    var tapped = null;
    document.addEventListener("touchstart", event => {
        if (dom.cl.has(event.target, "cm-keyword")) {
            if (!tapped) {
                tapped = setTimeout(_ => tapped = null, 300);
            }
            else {
                clearTimeout(tapped);
                tapped = null;
                chrome.tabs.create({ url: `https://${ forum }.net/sosyal/uye/${ dom.text(event.target).trimStart() }` });
            }

            event.preventDefault();
        }
    });

    buttons.save.addEventListener("click", event => {
        saveEditorText();
        noteEditor.clearHistory();
        buttons.save.disabled = true;
    });

    buttons.import.addEventListener("click", event => {
        const filePicker = qs("#filePicker");
        filePicker.value = "";
        filePicker.click();
    });

    buttons.export.addEventListener("click", event => {
        if (Object.keys(settings[`${ forum }Notes`]).length === 0) {
            return;
        }

        const object = { notlar: settings[`${ forum }Notes`] };
        const text = JSON.stringify(object, null, 4);

        const now = new Date(Date.now() - (new Date()).getTimezoneOffset() * 60000);
        const time = now.toISOString()
            .replace(/\.\d+Z$/, "")
            .replace(/:/g, ".")
            .replace("T", "_");
        const fileName = `the-blocker-notlar-${ forum }_${ time }.txt`;

        const downloadLink = dom.ce("a");
        dom.attr(downloadLink, "href", `data:text/plain;charset=utf-8,${ encodeURIComponent(`${ text }\n`) }`);
        dom.attr(downloadLink, "download", fileName);
        dom.attr(downloadLink, "type", "text/plain");
        downloadLink.click();
    });

    buttons.filePicker.addEventListener("change", event => {
        const fileInput = event.target;

        if (fileInput.files.length === 0) {
            console.log("No file selected");
            return;
        }

        const selectedFile = fileInput.files[0];
        const reader = new FileReader();

        reader.onload = event => {
            const fileContent = event.target.result;

            try {
                const filters = JSON.parse(fileContent);

                chrome.storage.local.set({
                    [`${ forum }Notes`]: { ...settings[`${ forum }Notes`], ...filters["notlar"] },
                });
            }
            catch (error) {
                console.error("JSON error: ", error);
            }
        };

        reader.readAsText(selectedFile);
    });

    /****************************************** MAIN END ******************************************/

    function renderNotes() {
        const lines = [];
        const cacheLines = [];
        const notes = Object.entries(settings[`${ forum }Notes`]);
        const maxUserIdLength = notes.length && notes.reduce((prev, curr) => (prev && prev[0].length > curr[0].length ? prev : curr))[0].length;

        for (let i = 0; i < notes.length; ++i) {
            const [userId, note] = notes[i];
            lines.push(`${ " ".repeat(maxUserIdLength - userId.length) }${ userId } ${ note }`);
            cacheLines.push(`${ userId } ${ note }`);
        }

        lines.push("");
        cache = cacheLines.join("\n");
        noteEditor.setValue(lines.join("\n"));
        noteEditor.clearHistory();
    }

    function editorChanged(editor, changes) {
        buttons.save.disabled = cache === getEditorText();
    }

    function saveEditorText() {
        const text = getEditorText();
        const lines = text.split("\n");
        const notes = {};

        lines.forEach(elem => {
            const match = /^(\d+) (.+)$/gm.exec(elem);

            if (match !== null) {
                notes[parseInt(match[1], 10)] = match[2];
            }
        });

        chrome.storage.local.set({
            [`${ forum }Notes`]: notes,
        });
    }

    function getEditorText() {
        return noteEditor.getValue()
            .replace(/\s*\n\s*/g, "\n")
            .replace(/(\n\d+)\s+/g, "$1 ")
            .trim();
    }
})();
