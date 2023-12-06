/* Heavily inspired by Raymond Hill's uBlock Origin */
const codeMirrorOptions = {
    autofocus: true,
    foldGutter: true,
    gutters: ["CodeMirror-foldgutter", "CodeMirror-linenumbers"],
    lineNumbers: true,
    lineWiseCopyCut: true,
    lineWrapping: true,
    mode: "text/plain",
    styleActiveLine: { nonEmpty: true },
};

const editors = {
    user: new CodeMirror(qs("#userEditor"), codeMirrorOptions),
    avatar: new CodeMirror(qs("#avatarEditor"), codeMirrorOptions),
    signature: new CodeMirror(qs("#signatureEditor"), codeMirrorOptions),
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


init();


async function init() {
    parent.postMessage({
        type: "title",
        title: document.title,
    }, "*");

    await setEditorText();
    setEditorFocuses();
    setEditorEmptyLines();
    setEditorCursors();
    setEditorChanges();
    editors.user.focus();
    clearHistory();
}

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

function setEditorFocuses() {
    editors.user.setOption("extraKeys", {
        Tab: function (cm) {
            editors.avatar.focus();
        }
    });

    editors.avatar.setOption("extraKeys", {
        Tab: function (cm) {
            editors.signature.focus();
        }
    });

    editors.signature.setOption("extraKeys", {
        Tab: function (cm) {
            if (buttons.save.disabled) {
                editor.user.focus();
            }
            else {
                buttons.save.focus();
            }
        }
    });
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
        return;
    }

    buttons.save.disabled = !changed;
}

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

function storageChangeHandler(key, newValue) {
    cache[key] = newValue.join("\n");
    editors[key].setValue(cache[key]);

    if (editors[key].getLine(editors[key].lastLine()).length !== 0) {
        editors[key].replaceRange("\n", CodeMirror.Pos(editors[key].lastLine()));
    }

    editors[key].setCursor(editors[key].lineCount(), 0);
    editors[key].focus();
}

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

buttons.save.addEventListener("click", async event => {
    await saveEditorText();
    clearHistory();
    buttons.save.disabled = true;
});

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
        .replace(/[ ]/g, "\n")
        .replace(/[^\n\d]/g, "")
        .replace(/\n{2,}/g, "\n")
        .trim();
}
