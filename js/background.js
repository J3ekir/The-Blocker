importScripts("storage.js");

let creating;
var settings;
var types = {
    "user": ["userArray", "userCount"],
    "avatar": ["avatarArray", "avatarCount"],
    "signature": ["signatureArray", "signatureCount"],
};

chrome.runtime.onInstalled.addListener(async () => {
    const jsonURL = await chrome.runtime.getURL("storage.json");
    const response = await fetch(jsonURL);
    const json = await response.json();
    const defaultSettings = json["defaultSettings"];
    var defaultValues = {};
    settings = await storage.get(null);

    for (const key in defaultSettings) {
        if (settings[key] === undefined) {
            defaultValues[key] = defaultSettings[key];
        }
    }

    await storage.set(defaultValues);
    await storage.set({
        "en": json["en"],
        "tr": json["tr"]
    });

    await storage.setCSS();

    // await chrome.storage.local.clear();
    // await chrome.storage.sync.clear();
});

chrome.runtime.onStartup.addListener(async () => {
    await init();
});

chrome.runtime.onMessage.addListener(
    async function (request, sender, sendResponse) {
        switch (request.type) {
            case "injectCSS":
                await injectCSS(sender.tab.id);
                break;
            case "tabHandlerCSS":
                tabHandlerCSS(sender.tab.id);
                break;
            case "theme":
                setIcon(request.theme);
                break;
            case "block":
                // is userId a number?
                if (!request.userId || !/^\d+$/.test(request.userId)) {
                    // i18n
                    console.log(`user ID is not a number: ${ request.userId }`);
                    return;
                }

                settings = await storage.get(null);

                var [typeArray, typeCount] = types[request.buttonType];

                if (settings[typeArray].includes(request.userId)) {
                    // i18n
                    console.log(`user ID: ${ request.userId }, ${ request.buttonType } is already blocked`);
                    return;
                }

                settings[typeArray].push(request.userId);
                var newCount = settings[typeCount] + 1;
                var newValues = {
                    [typeArray]: settings[typeArray],
                    [typeCount]: newCount
                };

                await storage.set(newValues);
                await storage.setCSS();

                // i18n
                console.log(`user ID: ${ request.userId }, ${ request.buttonType } blocked`);

                break;
            case "unblock":
                // is userId a number?
                if (!request.userId || !/^\d+$/.test(request.userId)) {
                    // i18n
                    console.log(`user ID is not a number: ${ request.userId }`);
                    return;
                }

                settings = await storage.get(null);

                var [typeArray, typeCount] = types[request.buttonType];

                settings[typeArray].splice(settings[typeArray].indexOf(request.userId), 1);
                var newCount = settings[typeCount] - 1;
                var newValues = {
                    [typeArray]: settings[typeArray],
                    [typeCount]: newCount
                };

                await storage.set(newValues);
                await storage.setCSS();

                // i18n
                console.log(`user ID: ${ request.userId }, ${ request.buttonType } unblocked`);

                break;
            default:
                break;
        }
    }
);

async function init() {
    settings = await storage.get(null);
    createOffscreen();
}

async function createOffscreen(path = "offscreen.html") {
    const offscreenUrl = chrome.runtime.getURL(path);
    const matchedClients = await clients.matchAll();

    for (const client of matchedClients) {
        if (client.url === offscreenUrl) {
            return;
        }
    }

    if (creating) {
        await creating;
    }
    else {
        creating = chrome.offscreen.createDocument({
            url: path,
            reasons: ["DOM_SCRAPING"],
            justification: "set icon theme",
        });
        await creating;
        creating = null;
    }
}

async function injectCSS(tabId) {
    var result = await storage.get("CSS");

    chrome.scripting.insertCSS({
        target: { tabId: tabId },
        origin: "AUTHOR",
        css: result["CSS"]
    });

    chrome.scripting.insertCSS({
        target: { tabId: tabId },
        origin: "AUTHOR",
        files: ["css/buttons.css"]
    });
}

function setIcon(theme) {
    chrome.action.setIcon({
        path: {
            "16": `../img/icon_${ theme }_16.png`,
            "32": `../img/icon_${ theme }_32.png`,
            "48": `../img/icon_${ theme }_48.png`,
            "64": `../img/icon_${ theme }_64.png`,
            "128": `../img/icon_${ theme }_128.png`
        }
    });
}

function tabHandlerCSS(tabId) {
    chrome.scripting.insertCSS({
        target: { tabId: tabId },
        origin: "USER",
        css: "#cloneMenuHandler{margin-top:-12px!important;margin-bottom:20px!important;border-bottom:none!important;border-top:1px solid #414141!important;}#cloneMenuHandler .tabs-tab{border-bottom:none!important;border-top:3px solid transparent;padding:4px 15px 5px!important;}"
    });
}

/****************************************************************************************/
// keepAlive
// https://stackoverflow.com/a/66618269/13630257
// "Persistent" service worker while a connectable tab is present
// "host_permissions": ["<all_urls>"],
// const onUpdate = (tabId, info, tab) => /^https?:/.test(info.url) && findTab([tab]);
// findTab();
// chrome.runtime.onConnect.addListener(port => {
//     if (port.name === "keepAlive") {
//         setTimeout(() => port.disconnect(), 250e3);
//         port.onDisconnect.addListener(() => findTab());
//     }
// });
// async function findTab(tabs) {
//     if (chrome.runtime.lastError) { } // tab was closed before setTimeout ran
//     for (const { id: tabId } of tabs || await chrome.tabs.query({ url: "*://*/*" })) {
//         try {
//             await chrome.scripting.executeScript({ target: { tabId }, func: connect });
//             chrome.tabs.onUpdated.removeListener(onUpdate);
//             return;
//         } catch (e) { }
//     }
//     chrome.tabs.onUpdated.addListener(onUpdate);
// }
// function connect() {
//     chrome.runtime.connect({ name: "keepAlive" })
//         .onDisconnect.addListener(connect);
// }
/****************************************************************************************/
