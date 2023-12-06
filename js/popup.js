chrome.storage.local.get().then(settings => {
    dom.text("#userCount", settings["userCount"]);
    dom.text("#avatarCount", settings["avatarCount"]);
    dom.text("#signatureCount", settings["signatureCount"]);
});

chrome.storage.onChanged.addListener(changes => {
    Object.keys(changes).forEach(key => {
        switch (key) {
            case "userCount":
            case "avatarCount":
            case "signatureCount":
                dom.text(`#${ key }`, changes[key].newValue);
        }
    });
});
