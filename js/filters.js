/* Heavily inspired by Raymond Hill's uBlock Origin */

(async () => {
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

    /***************************************** MAIN START *****************************************/

    parent.postMessage({
        type: "title",
        title: document.title,
    }, "*");

    await setEditorText();
    setEditorEmptyLines();
    setEditorCursors();
    setEditorChanges();
    editors.user.focus();
    clearHistory();

    chrome.storage.onChanged.addListener(changes => {
        Object.entries(changes).forEach(([key, { oldValue, newValue }]) => {
            switch (key) {
                case "user":
                case "avatar":
                case "signature":
                    storageChangeHandler(key, newValue);
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

    buttons.save.addEventListener("click", async event => {
        await saveEditorText();
        clearHistory();
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

    async function setEditorText() {
        var settings = await chrome.storage.local.get([
            "user",
            "avatar",
            "signature",
        ]);

        cache.user = settings["user"].join("\n");
        cache.avatar = settings["avatar"].join("\n");
        cache.signature = settings["signature"].join("\n");

        editors.user.setValue(cache.user);
        editors.avatar.setValue(cache.avatar);
        editors.signature.setValue(cache.signature);
    }

    function setEditorEmptyLines() {
        if (editors.user.getLine(editors.user.lastLine()).length !== 0) {
            editors.user.replaceRange("\n", CodeMirror.Pos(editors.user.lastLine()));
        }
        if (editors.avatar.getLine(editors.avatar.lastLine()).length !== 0) {
            editors.avatar.replaceRange("\n", CodeMirror.Pos(editors.avatar.lastLine()));
        }
        if (editors.signature.getLine(editors.signature.lastLine()).length !== 0) {
            editors.signature.replaceRange("\n", CodeMirror.Pos(editors.signature.lastLine()));
        }
    }

    function setEditorCursors() {
        editors.user.setCursor(editors.user.lineCount(), 0);
        editors.avatar.setCursor(editors.avatar.lineCount(), 0);
        editors.signature.setCursor(editors.signature.lineCount(), 0);
    }

    function setEditorChanges() {
        editors.user.on("beforeChange", beforeFiltersChanged);
        editors.user.on("changes", filtersChanged);

        editors.avatar.on("beforeChange", beforeFiltersChanged);
        editors.avatar.on("changes", filtersChanged);

        editors.signature.on("beforeChange", beforeFiltersChanged);
        editors.signature.on("changes", filtersChanged);
    }

    function clearHistory() {
        editors.user.clearHistory();
        editors.avatar.clearHistory();
        editors.signature.clearHistory();
    }

    function beforeFiltersChanged(instance, changeObj) {
        if (/[^\d]/g.test(changeObj.text.join(""))) {
            changeObj.cancel();
        }
    }

    function filtersChanged(changed) {
        if (
            cache.user === getEditorText(editors.user) &&
            cache.avatar === getEditorText(editors.avatar) &&
            cache.signature === getEditorText(editors.signature)
        ) {
            buttons.save.disabled = true;
        }
        else {
            buttons.save.disabled = !changed;
        }
    }

    function storageChangeHandler(key, newValue) {
        cache[key] = newValue.join("\n");
        editors[key].setValue(cache[key]);

        if (editors[key].getLine(editors[key].lastLine()).length !== 0) {
            editors[key].replaceRange("\n", CodeMirror.Pos(editors[key].lastLine()));
        }

        editors[key].setCursor(editors[key].lineCount(), 0);
        editors[key].focus();
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
            user: user,
            avatar: avatar,
            signature: signature,
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
