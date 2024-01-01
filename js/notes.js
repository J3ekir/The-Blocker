/* Heavily inspired by Raymond Hill's uBlock Origin */

(async () => {
    var settings = await chrome.storage.local.get([
        "notes",
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
        foldGutter: true,
        gutters: ["CodeMirror-foldgutter", "CodeMirror-linenumbers"],
        lineNumbers: true,
        lineWiseCopyCut: true,
        scrollbarStyle: "overlay",
        styleActiveLine: { nonEmpty: true },
        configureMouse: _ => { return { addNew: false }; },
    };

    CodeMirror.defineMode("theBlocker-notes", function () {
        let lastUserId = "";

        return {
            token: function (stream) {
                if (stream.sol()) {
                    stream.eatSpace();
                    const match = stream.match(/\S+/);

                    if (
                        match !== null &&
                        stream.match(/\s+.*/, false) !== null &&
                        /^\d+$/.test(match[0])
                    ) {
                        lastUserId = match[0];
                        return "keyword";
                    }
                    else {
                        stream.skipToEnd();
                        return "line-cm-error";
                    }
                }

                stream.eatSpace();
                const match = stream.match(/.*$/);

                if (match !== null && match[0].trim() !== settings["notes"][lastUserId]) {
                    return "line-cm-strong";
                }

                stream.skipToEnd();
                return null;
            }
        };
    });

    const noteEditor = new CodeMirror(qs("#note"), codeMirrorOptions);

    /***************************************** MAIN START *****************************************/

    parent.postMessage({
        type: "title",
        title: document.title,
    }, "*");

    renderNotes();

    noteEditor.on("changes", editorChanged);

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
        if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "s") {
            event.preventDefault();

            if (!buttons.save.disabled) {
                buttons.save.click();
            }
        }
    });

    buttons.save.addEventListener("click", event => {
        saveEditorText();
        noteEditor.clearHistory();
        buttons.save.disabled = true;
    });

    /****************************************** MAIN END ******************************************/

    function renderNotes() {
        const lines = [];
        const cacheLines = [];
        const notes = Object.entries(settings["notes"]);
        const maxUserIdLength = notes.reduce((prev, curr) => (prev && prev[0].length > curr[0].length ? prev : curr))[0].length;

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
                notes[match[1]] = match[2];
            }
        });

        chrome.storage.local.set({
            notes: notes,
        });
    }

    function getEditorText() {
        return noteEditor.getValue()
            .replace(/\s*\n\s*/g, "\n")
            .replace(/(\n\d+)\s+/g, "$1 ")
            .trim();
    }
})();
