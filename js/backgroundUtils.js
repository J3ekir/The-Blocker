self.injectCSS = (tabId, { forum }) => {
    chrome.storage.local.get(`${ forum }CSS`).then(settings => {
        chrome.scripting.insertCSS({
            target: { tabId },
            origin: "AUTHOR",
            css: settings[`${ forum }CSS`],
        });
    });
};

self.insertCssString = (tabId, { css }) => {
    chrome.scripting.insertCSS({
        target: { tabId },
        origin: "USER",
        css,
    });
};

self.removeCssString = (tabId, { css }) => {
    chrome.scripting.removeCSS({
        target: { tabId },
        origin: "USER",
        css,
    });
};

self.noteSavedMessage = (tabId, { message }) => {
    chrome.scripting.executeScript({
        target: { tabId },
        injectImmediately: true,
        world: "MAIN",
        args: [message],
        func: message => XF.flashMessage(message, 1500),
    });
};
