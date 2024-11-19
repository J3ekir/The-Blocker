self.injectCSS = ({ tab }, { forum }) => {
    chrome.storage.local.get(`${ forum }CSS`).then(settings => {
        chrome.scripting.insertCSS({
            target: { tabId: tab.id },
            origin: "AUTHOR",
            css: settings[`${ forum }CSS`],
        });
    });
};

self.insertCssString = ({ tab }, { css }) => {
    chrome.scripting.insertCSS({
        target: { tabId: tab.id },
        origin: "USER",
        css,
    });
};

self.removeCssString = ({ tab }, { css }) => {
    chrome.scripting.removeCSS({
        target: { tabId: tab.id },
        origin: "USER",
        css,
    });
};

self.noteSavedMessage = ({ tab }, { message }) => {
    chrome.scripting.executeScript({
        target: { tabId: tab.id },
        injectImmediately: true,
        world: "MAIN",
        args: [message],
        func: message => XF.flashMessage(message, 1500),
    });
};
