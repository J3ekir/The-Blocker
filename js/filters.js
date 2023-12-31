/* Heavily inspired by Raymond Hill's uBlock Origin */

(async () => {
    var settings = await chrome.storage.local.get([
        "user",
        "avatar",
        "signature",
    ]);

    const cache = {
        user: "",
        avatar: "",
        signature: "",
    };

    const buttons = {
        save: qs("#applyButton"),
        import: qs("#importButton"),
        export: qs("#exportButton"),
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

    CodeMirror.defineMode("theBlocker-filters", function (config, parserConfig) {
        return {
            token: function (stream) {
                return stream.match(/\d+/) === null
                    ? "line-cm-error"
                    : "filter-keyword";
            }
        };
    });

    const editors = {
        user: new CodeMirror(qs("#user"), codeMirrorOptions),
        avatar: new CodeMirror(qs("#avatar"), codeMirrorOptions),
        signature: new CodeMirror(qs("#signature"), codeMirrorOptions),
    };

    /***************************************** MAIN START *****************************************/

    parent.postMessage({
        type: "title",
        title: document.title,
    }, "*");

    renderEditors();

    editors.user.on("beforeChange", beforeEditorChanged);
    editors.avatar.on("beforeChange", beforeEditorChanged);
    editors.signature.on("beforeChange", beforeEditorChanged);
    editors.user.on("changes", editorChanged);
    editors.avatar.on("changes", editorChanged);
    editors.signature.on("changes", editorChanged);

    editors.user.focus();

    chrome.storage.onChanged.addListener(changes => {
        Object.entries(changes).forEach(([key, { oldValue, newValue }]) => {
            switch (key) {
                case "user":
                case "avatar":
                case "signature":
                    settings[key] = newValue;
                    renderEditor(key);
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
        if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "s") {
            event.preventDefault();

            if (!buttons.save.disabled) {
                buttons.save.click();
            }
        }
    });

    document.addEventListener("mousedown", event => {
        if (dom.cl.has(event.target, "cm-filter-keyword") && (event.ctrlKey || event.metaKey)) {
            chrome.tabs.create({ url: `https://technopat.net/sosyal/uye/${ dom.text(event.target) }` });
        }
    });

    var tapped = null;
    document.addEventListener("touchstart", event => {
        if (dom.cl.has(event.target, "cm-filter-keyword")) {
            if (!tapped) {
                tapped = setTimeout(_ => tapped = null, 300);
            }
            else {
                clearTimeout(tapped);
                tapped = null;
                chrome.tabs.create({ url: `https://technopat.net/sosyal/uye/${ dom.text(event.target) }` });
            }

            event.preventDefault();
        }
    });

    buttons.save.addEventListener("click", event => {
        saveEditorText();
        editors.user.clearHistory();
        editors.avatar.clearHistory();
        editors.signature.clearHistory();
        buttons.save.disabled = true;
    });

    buttons.export.addEventListener("click", event => {
        const object = {};
        object["kullanıcı"] = settings["user"];
        object["avatar"] = settings["avatar"];
        object["imza"] = settings["signature"];
        const text = JSON.stringify(object, null, 4);

        const now = new Date(Date.now() - (new Date()).getTimezoneOffset() * 60000);
        const time = now.toISOString()
            .replace(/\.\d+Z$/, "")
            .replace(/:/g, ".")
            .replace("T", "_");
        const fileName = `the-blocker-filtreler_${ time }.txt`;

        const a = dom.ce("a");
        dom.attr(a, "href", `data:text/plain;charset=utf-8,${ encodeURIComponent(`${ text }\n`) }`);
        dom.attr(a, "download", fileName);
        dom.attr(a, "type", "text/plain");
        a.click();
    });

    /****************************************** MAIN END ******************************************/

    function renderEditors() {
        renderEditor("user");
        renderEditor("avatar");
        renderEditor("signature");
    }

    function renderEditor(editor) {
        cache[editor] = settings[editor].join("\n");
        editors[editor].setValue(cache[editor].length === 0 ? cache[editor] : `${ cache[editor] }\n`);
        editors[editor].clearHistory();
        editors[editor].setCursor(editors[editor].lineCount(), 0);
    }

    function beforeEditorChanged(editor, changeObj) {
        if (/[^\d]/g.test(changeObj.text.join(""))) {
            changeObj.cancel();
        }
    }

    function editorChanged(editor, changes) {
        buttons.save.disabled = cache[editor.getWrapperElement().parentElement.id] === getEditorText(editor);
    }

    async function saveEditorText() {
        var userText = getEditorText(editors.user);
        var avatarText = getEditorText(editors.avatar);
        var signatureText = getEditorText(editors.signature);

        cache.user = userText;
        cache.avatar = avatarText;
        cache.signature = signatureText;

        var user = userText === "" ? [] : userText.split("\n");
        var avatar = avatarText === "" ? [] : avatarText.split("\n");
        var signature = signatureText === "" ? [] : signatureText.split("\n");

        chrome.storage.local.set({
            user: user.map(id => parseInt(id, 10)),
            avatar: avatar.map(id => parseInt(id, 10)),
            signature: signature.map(id => parseInt(id, 10)),
            userCount: user.length,
            avatarCount: avatar.length,
            signatureCount: signature.length,
        });
    }

    function getEditorText(editor) {
        return editor.getValue()
            .replace(/\n{2,}/g, "\n")
            .trim();
    }
})();
