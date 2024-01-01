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
