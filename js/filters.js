/* Heavily inspired by Raymond Hill's uBlock Origin */
var codeMirrorOptions = {
    autofocus: true,
    foldGutter: true,
    gutters: ["CodeMirror-linenumbers", "CodeMirror-foldgutter"],
    lineNumbers: true,
    lineWiseCopyCut: true,
    lineWrapping: true,
    mode: "text/plain",
    styleActiveLine: {
        nonEmpty: true,
    },
};

var types = {
    "userArray": "user",
    "avatarArray": "avatar",
    "signatureArray": "signature",
};



// var types = ["userArray", "avatarArray", "signatureArray"];

var cache = {
    user: "",
    avatar: "",
    signature: "",
};

self.userEditor = new CodeMirror(dom.byId("userEditor"), codeMirrorOptions);
self.avatarEditor = new CodeMirror(dom.byId("avatarEditor"), codeMirrorOptions);
self.signatureEditor = new CodeMirror(dom.byId("signatureEditor"), codeMirrorOptions);
var saveButton = qs("#applyButton");

init();


async function init() {
    await i18n.render();
    parent.postMessage({
        type: "title",
        title: document.title,
    }, "*");


    await setEditorText();
    setEditorFocuses();
    functions([setEditorEmptyLines, setEditorCursors, setEditorChanges]);
    self.userEditor.focus();
    editors(clearHistory);
}

async function setEditorText() {
    let result = await storage.get(Object.keys(types));
    
    cache.user = result["userArray"].join("\n");
    cache.avatar = result["avatarArray"].join("\n");
    cache.signature = result["signatureArray"].join("\n");

    self.userEditor.setValue(cache.user);
    self.avatarEditor.setValue(cache.avatar);
    self.signatureEditor.setValue(cache.signature);
}

function setEditorFocuses() {
    self.userEditor.setOption("extraKeys", {
        Tab: function (cm) {
            self.avatarEditor.focus();
        }
    });
    self.avatarEditor.setOption("extraKeys", {
        Tab: function (cm) {
            self.signatureEditor.focus();
        }
    });
    self.signatureEditor.setOption("extraKeys", {
        Tab: function (cm) {
            if (saveButton.disabled) {
                self.userEditor.focus();
            }
            else {
                saveButton.focus();
            }
        }
    });
}

function functions(array) {
    array.forEach(editors);
}

function editors(func) {
    func(self.userEditor);
    func(self.avatarEditor);
    func(self.signatureEditor);
}

function setEditorEmptyLines(editor) {
    if (editor.getLine(editor.lastLine()).length !== 0) {
        editor.replaceRange("\n", CodeMirror.Pos(editor.lastLine()));
    }
}

function setEditorCursors(editor) {
    editor.setCursor(editor.lineCount(), 0);
}

function setEditorChanges(editor) {
    editor.on("beforeChange", beforeFiltersChanged);
    editor.on("changes", filtersChanged);
}

function clearHistory(editor) {
    editor.clearHistory();
}

function beforeFiltersChanged(instance, changeObj) {
    if (/[^\d]/g.test(changeObj.text.join(""))) {
        changeObj.cancel();
    }
}

function filtersChanged(changed) {
    if (
        cache.user === getEditorText(self.userEditor) &&
        cache.avatar === getEditorText(self.avatarEditor) &&
        cache.signature === getEditorText(self.signatureEditor)
    ) {
        saveButton.disabled = true;
        return;
    }

    saveButton.disabled = !changed;
}

chrome.storage.onChanged.addListener((changes, areaName) => {
    Object.keys(changes).forEach((key) => {
        if (types.hasOwnProperty(key)) {
            const cacheKey = types[key];
            storageChangeHandler(changes[key].newValue, window[`${cacheKey}Editor`], cacheKey);
        }
    });
});

function storageChangeHandler(newValue, editor, cacheKey) {
    cache[cacheKey] = newValue.join("\n");
    editor.setValue(cache[cacheKey]);
    setEditorEmptyLines(editor);
    setEditorCursors(editor);
    editor.focus();
}

window.addEventListener("beforeunload", (event) => {
    if (saveButton.disabled) {
        return;
    }

    event.preventDefault();
    event.returnValue = "";
});

window.addEventListener("unload", (event) => {
    parent.postMessage({
        type: "tab",
    }, "*");
});

document.addEventListener("keydown", (event) => {
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "s") {
        event.preventDefault();

        if (!saveButton.disabled) {
            saveButton.click();
        }
    }
});

saveButton.addEventListener("click", async (event) => {
    await saveEditorText();
    editors(clearHistory);
    saveButton.disabled = true;
});

async function saveEditorText() {
    var userText = getEditorText(self.userEditor);
    var avatarText = getEditorText(self.avatarEditor);
    var signatureText = getEditorText(self.signatureEditor);

    cache.user = userText;
    cache.avatar = avatarText;
    cache.signature = signatureText;

    var userArray = userText.length === 0 ? [] : userText.split("\n");
    var avatarArray = avatarText.length === 0 ? [] : avatarText.split("\n");
    var signatureArray = signatureText.length === 0 ? [] : signatureText.split("\n");

    var userCount = userArray.length;
    var avatarCount = avatarArray.length;
    var signatureCount = signatureArray.length;

    await storage.set({
        userArray: userArray,
        avatarArray: avatarArray,
        signatureArray: signatureArray,
        userCount: userCount,
        avatarCount: avatarCount,
        signatureCount: signatureCount,
    });

    var CSS = await storage.setCSS();
    console.log(`CSS: ${CSS}`);
}

function getEditorText(editor) {
    return editor.getValue()
        .replace(/[ ]/g, "\n")
        .replace(/[^\n\d]/g, "")
        .replace(/\n{2,}/g, "\n")
        .trim();
}
