importScripts("storage.js");

let creating;
var types = {
    "user": ["userArray", "userCount"],
    "avatar": ["avatarArray", "avatarCount"],
    "signature": ["signatureArray", "signatureCount"],
};

chrome.runtime.onInstalled.addListener(async () => {
    await init();

    const jsonURL = await chrome.runtime.getURL("storage.json");
    const response = await fetch(jsonURL);
    const json = await response.json();
    const defaultSettings = json["defaultSettings"];
    var defaultValues = {};

    for (const key in defaultSettings) {
        if (storage.settings[key] === undefined) {
            defaultValues[key] = defaultSettings[key];
        }
    }

    await storage.set(defaultValues);
    await storage.set({
        "en": json["en"],
        "tr": json["tr"],
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
            case "injectCSSString":
                injectCSSString(sender.tab.id, request.CSS);
                break;
            case "bottomWidget":
                bottomWidget(sender.tab.id);
                break;
            case "combineWidgetTabs":
                combineWidgetTabs(sender.tab.id);
                break;
            case "block":
                block(request.userId, request.buttonType);
                break;
            case "unblock":
                unblock(request.userId, request.buttonType);
                break;
            case "theme":
                setIcon(request.theme);
                break;
            default:
                break;
        }
    }
);

async function init() {
    await storage.init();
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
        css: result["CSS"],
    });
}

function injectCSSString(tabId, CSS) {
    chrome.scripting.insertCSS({
        target: { tabId: tabId },
        origin: "USER",
        css: CSS,
    });
}

function bottomWidget(tabId) {
    chrome.scripting.insertCSS({
        target: { tabId: tabId },
        origin: "USER",
        css: "#cloneMenuHandler{margin-top:-12px!important;margin-bottom:20px!important;border-bottom:none!important;border-top-width:1px!important;border-top-style:solid!important;}#cloneMenuHandler .tabs-tab{border-bottom:none!important;border-top:3px solid transparent;padding:4px 15px 5px!important;}",
    });
}

function combineWidgetTabs(tabId) {
    chrome.scripting.insertCSS({
        target: { tabId: tabId },
        origin: "USER",
        css: ".tab-wrapper.widget-group .tabs-tab:nth-child(2){display:none!important;}",
    });
}

async function block(userId, buttonType) {
    if (!isUserIdValid(userId)) {
        console.log(`user ID is not a number: ${ userId }`);
        return;
    }

    await storage.refresh();

    var [typeArray, typeCount] = types[buttonType];

    if (storage.settings[typeArray].includes(userId)) {
        console.log(`user ID: ${ userId }, ${ buttonType } is already blocked`);
        return;
    }

    storage.settings[typeArray].push(userId);
    var newCount = storage.settings[typeCount] + 1;
    var newValues = {
        [typeArray]: storage.settings[typeArray],
        [typeCount]: newCount,
    };

    await storage.set(newValues);
    await storage.setCSS();

    console.log(`user ID: ${ userId }, ${ buttonType } blocked`);
}

async function unblock(userId, buttonType) {
    if (!isUserIdValid(userId)) {
        console.log(`user ID is not a number: ${ userId }`);
        return;
    }

    await storage.refresh();

    var [typeArray, typeCount] = types[buttonType];

    storage.settings[typeArray].splice(storage.settings[typeArray].indexOf(userId), 1);
    var newCount = storage.settings[typeCount] - 1;
    var newValues = {
        [typeArray]: storage.settings[typeArray],
        [typeCount]: newCount,
    };

    await storage.set(newValues);
    await storage.setCSS();

    console.log(`user ID: ${ userId }, ${ buttonType } unblocked`);
}

function isUserIdValid(userId) {
    return userId && /^\d+$/.test(userId);
}

function setIcon(theme) {
    chrome.action.setIcon({
        path: {
            "16": `../img/icon_${ theme }_16.png`,
            "32": `../img/icon_${ theme }_32.png`,
            "48": `../img/icon_${ theme }_48.png`,
            "64": `../img/icon_${ theme }_64.png`,
            "128": `../img/icon_${ theme }_128.png`,
        }
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
