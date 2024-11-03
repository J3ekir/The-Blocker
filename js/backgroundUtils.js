export function injectCSS(tabId, { forum }) {
    chrome.storage.local.get(`${ forum }CSS`).then(settings => {
        chrome.scripting.insertCSS({
            target: { tabId },
            origin: "AUTHOR",
            css: settings[`${ forum }CSS`],
        });
    });
}

export function insertCSSString(tabId, { css }) {
    chrome.scripting.insertCSS({
        target: { tabId },
        origin: "USER",
        css,
    });
}

export function removeCSSString(tabId, { css }) {
    chrome.scripting.removeCSS({
        target: { tabId },
        origin: "USER",
        css,
    });
}

export function noteSavedMessage(tabId, { message }) {
    chrome.scripting.executeScript({
        target: { tabId },
        injectImmediately: true,
        world: "MAIN",
        args: [message],
        func: message => XF.flashMessage(message, 1500),
    });
}
