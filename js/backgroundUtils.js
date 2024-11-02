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

export function combineTabPanes(tabId) {
    chrome.scripting.insertCSS({
        target: { tabId },
        origin: "USER",
        css: ".tab-wrapper.widget-group .tabs-tab:nth-child(2){display:none!important;}",
    });
}

export function noteSavedMessage(tabId) {
    chrome.scripting.executeScript({
        target: { tabId },
        injectImmediately: true,
        world: "MAIN",
        func: () => {
            switch (XF.getLocale()) {
                case "en_US": XF.flashMessage("Note has been saved.", 1500); break;
                case "tr_TR": XF.flashMessage("Not kaydedildi.", 1500); break;
            }
        }
    });
}
