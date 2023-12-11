const KEYS = {
    misc: {
        "settingSidebarShareThisPage": "div[data-widget-id='8']",
        "settingSidebarMembersOnline": "div[data-widget-id='6']",
        "settingSidebarRandomBlogEntries": "div[data-widget-id='41']",
        "settingSidebarLatestResources": "div[data-widget-id='11']",
        "settingNavigationBlogs": "li:has(a[data-xf-key='5'])",
        "settingNavigationQuestions": "li:has(a[data-xf-key='6'])",
        "settingNavigationVideos": "li:has(a[data-xf-key='7'])",
        "settingNavigationAdvices": "li:has(a[data-xf-key='8'])",
        "settingNavigationMedia": "li:has(a[data-xf-key='12'])",
        "settingShowIgnoredContent": ".showIgnoredLink.js-showIgnored",
        "settingHideThisUsersSignature": "[data-xf-click='signature-ignore']",
        "settingXenforoFooter": ".p-footer-copyright",
    },
    user: {
        "settingNotifications": ".alert.js-alert",
        "settingProfilePosts": ".message.message--simple",
        "settingProfilePostComments": ".message-responseRow",
    },
    get setCSS() {
        if (!this.setCSSKeys) {
            this.setCSSKeys = [
                "user",
                "avatar",
                "signature",
                "settingQuotes",
                ...Object.keys(this.user),
                ...Object.keys(this.misc),
            ];
        }

        return this.setCSSKeys;
    },
};


chrome.runtime.onInstalled.addListener(async () => {
    var settings = await chrome.storage.local.get();

    // old default settings
    if (settings["userArray"]) {
        var user = settings["userArray"];
        var avatar = settings["avatarArray"];
        var signature = settings["signatureArray"];
        var notes = settings["notes"];

        const jsonURL = await chrome.runtime.getURL("storage.json");
        const response = await fetch(jsonURL);
        const json = await response.json();
        const defaultSettings = json["defaultSettings"];
        var defaultValues = {};

        for (const key in defaultSettings) {
            if (settings[key] === undefined) {
                defaultValues[key] = defaultSettings[key];
            }
        }

        await chrome.storage.local.clear();

        await chrome.storage.local.set(defaultValues);

        await chrome.storage.local.set({
            user: user,
            avatar: avatar,
            signature: signature,
            userCount: user?.length || 0,
            avatarCount: avatar?.length || 0,
            signatureCount: signature?.length || 0,
            notes: notes,
        });
    }
    else {
        const jsonURL = await chrome.runtime.getURL("storage.json");
        const response = await fetch(jsonURL);
        const json = await response.json();
        const defaultSettings = json["defaultSettings"];
        var defaultValues = {};

        for (const key in defaultSettings) {
            if (settings[key] === undefined) {
                defaultValues[key] = defaultSettings[key];
            }
        }

        await chrome.storage.local.set(defaultValues);
    }

    await setCSS();

    // await chrome.storage.local.clear();
    // await chrome.storage.sync.clear();
});

chrome.runtime.onMessage.addListener(
    async function (request, sender, sendResponse) {
        switch (request.type) {
            case "injectCSS":
                injectCSS(sender.tab.id);
                break;
            case "insertCSSString":
                insertCSSString(sender.tab.id, request.CSS);
                break;
            case "removeCSSString":
                removeCSSString(sender.tab.id, request.CSS);
                break;
            case "combineTabPanes":
                combineTabPanes(sender.tab.id);
                break;
            case "noteSavedMessage":
                noteSavedMessage(sender.tab.id);
                break;
        }
    }
);

async function injectCSS(tabId) {
    var result = await chrome.storage.local.get("CSS");

    chrome.scripting.insertCSS({
        target: { tabId: tabId },
        origin: "AUTHOR",
        css: result["CSS"],
    });

    chrome.scripting.insertCSS({
        target: { tabId: tabId },
        origin: "USER",
        files: ["css/buttons.css"],
    });
}

function insertCSSString(tabId, CSS) {
    chrome.scripting.insertCSS({
        target: { tabId: tabId },
        origin: "USER",
        css: CSS,
    });
}

function removeCSSString(tabId, CSS) {
    chrome.scripting.removeCSS({
        target: { tabId: tabId },
        origin: "USER",
        css: CSS,
    });
}

function combineTabPanes(tabId) {
    chrome.scripting.insertCSS({
        target: { tabId: tabId },
        origin: "USER",
        css: ".tab-wrapper.widget-group .tabs-tab:nth-child(2){display:none!important;}",
    });
}

async function noteSavedMessage(tabId) {
    chrome.scripting.executeScript({
        target: { tabId: tabId },
        injectImmediately: true,
        world: "MAIN",
        func: () => {
            switch ($("html").attr("lang")) {
                case "en-US":
                    XF.flashMessage("Note has been saved.", 1500);
                    break;
                case "tr-TR":
                    XF.flashMessage("Not kaydedildi.", 1500);
                    break;
            }
        }
    });
}

chrome.storage.onChanged.addListener(async changes => {
    Object.entries(changes).forEach(([key, { oldValue, newValue }]) => {
        if (KEYS.setCSS.includes(key)) {
            setCSS();
        }
    });
});

async function setCSS() {
    console.time("setCSS");

    var settings = await chrome.storage.local.get();

    var quoteCSS = "";
    if (settings["settingQuotes"]) {
        quoteCSS = `[data-attributes="member: ${ settings["user"].join(`"],[data-attributes="member: `) }"]{display:none!important;}`;
    }

    var userList = `(a[data-user-id="${ settings["user"].join(`"],a[data-user-id="`) }"])`;

    var userCSS = `:is(${ Object.keys(KEYS.user)
        .filter(key => settings[key])
        .map(key => KEYS.user[key])
        .join()
        }):has${ userList }{display:none!important;}:is(.block-row,.node-extra-row .node-extra-user):has${ userList },.structItem-cell.structItem-cell--latest:has${ userList }>div,:is(.message.message--post, .message.message--article, .structItem):has(:is(.message-cell--user, .message-articleUserInfo, .structItem-cell--main) :is${ userList }){display:none!important;}`;

    // https://github.com/J3ekir/The-Blocker/commit/03d6569c44318ee1445049faba4e268ade3b79aa
    var avatarCSS = `:is(#theBlocker, a[data-user-id="${ settings["avatar"].join(`"],a[data-user-id="`) }"])>img{display:none;}`;
    var signatureCSS = `.message-signature:has(.js-userSignature-${ settings["signature"].join(`,.js-userSignature-`) }){display:none;}`;

    var miscCSS = `:is(${ Object.keys(KEYS.misc)
        .filter(key => settings[key])
        .map(key => KEYS.misc[key])
        .join()
        }){display:none!important;}`;

    var CSS = `${ quoteCSS }${ userCSS }${ avatarCSS }${ signatureCSS }${ miscCSS }`;

    await chrome.storage.local.set({
        CSS: CSS,
    });

    console.timeEnd("setCSS");
}

/**********************************************************************************************/
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
/**********************************************************************************************/
