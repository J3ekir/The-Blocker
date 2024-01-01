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

    /****************************************** MAIN END ******************************************/
})();
