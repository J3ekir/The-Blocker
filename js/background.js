const FORUMS = [
    "techolay",
    "technopat",
];
const SELECTORS = {
    filters: [
        "User",
        "Avatar",
        "Signature",
    ],
    misc: {
        "settingSidebarShareThisPage": "div[data-widget-definition='share_page']",
        "settingSidebarMembersOnline": "div[data-widget-section='onlineNow']",
        "settingSidebarRandomBlogEntries": "div[data-widget-definition='xa_ubs_latest_entries']",
        "settingSidebarLatestResources": "div[data-widget-definition='xfrm_new_resources']",
        "settingNavigationBlogs": "li:has(a[data-nav-id='xa_ubs'])",
        "settingNavigationQuestions": "li:has(a[data-nav-id='sorular'])",
        "settingNavigationVideos": "li:has(a[data-nav-id='videolar'])",
        "settingNavigationAdvices": "li:has(a[data-nav-id='sistem'])",
        "settingNavigationMedia": "li:has(a[data-nav-id='xfmg'])",
        "settingShowIgnoredContent": ".showIgnoredLink.js-showIgnored",
        "settingHideThisUsersSignature": "[data-xf-click='signature-ignore']",
        "settingXenforoFooter": ".p-footer-copyright",
    },
    user: {
        "settingNotifications": ".alert.js-alert",
        "settingProfilePosts": ".message.message--simple",
        "settingProfilePostComments": ".message-responseRow",
    },
};

const SET_CSS_KEYS = [
    "settingQuotes",
    ...FORUMS.flatMap(forum => SELECTORS.filters.map(filter => `${ forum }${ filter }`)),
    ...Object.keys(SELECTORS.user),
    ...Object.keys(SELECTORS.misc),
];


chrome.runtime.onInstalled.addListener(async ({ reason, temporary }) => {
    await setDefaultSettings();

    if (reason === "install") {
        checkPermissions();
    }
});

chrome.runtime.onMessage.addListener(
    async function (request, sender, sendResponse) {
        switch (request.type) {
            case "injectCSS":
                injectCSS(sender.tab.id, request.forum);
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
            case "noteSavedMessageChrome":
                noteSavedMessageChrome(sender.tab.id);
                break;
        }
    }
);

async function setDefaultSettings() {
    const settings = await chrome.storage.local.get();

    const storage = await (async () => {
        const storageURL = await chrome.runtime.getURL("storage.json");
        const response = await fetch(storageURL);
        return response.json();
    })();

    storage["defaultSettings"] = Object.assign(storage["defaultSettings"], ...FORUMS.map(forum => Object.assign(...Object.entries(storage["defaultForumSettings"]).map(([key, value]) => ({ [`${ forum }${ key }`]: value })))));

    const defaultValues = {};

    Object.keys(storage["defaultSettings"]).forEach(key => {
        if (settings[key] === undefined) {
            defaultValues[key] = storage["defaultSettings"][key];
        }
    });

    // TODO: remove after 1.0.0
    if (settings[`${ FORUMS[0] }User`] === undefined) {
        defaultValues["lastPane"] = "settings.html";

        const forumSettings = [
            "user",
            "avatar",
            "signature",
            "userCount",
            "avatarCount",
            "signatureCount",
            "notes",
            "CSS",
        ];

        forumSettings.forEach(key => {
            if (settings[key] !== undefined) {
                defaultValues[`technopat${ key.charAt(0).toUpperCase() }${ key.slice(1) }`] = settings[key];
            }
        });

        const oldSettings = [
            "settingNotes",
            "settingAddBottomTabButtons",
            "settingCombineTabPanes",
            "settingUserButton",
            "settingAvatarButton",
            "settingSignatureButton",
            "settingNotifications",
            "settingProfilePosts",
            "settingProfilePostComments",
            "settingQuotes",
            "settingSidebarShareThisPage",
            "settingSidebarMembersOnline",
            "settingSidebarRandomBlogEntries",
            "settingSidebarLatestResources",
            "settingNavigationBlogs",
            "settingNavigationQuestions",
            "settingNavigationVideos",
            "settingNavigationAdvices",
            "settingNavigationMedia",
            "settingShowIgnoredContent",
            "settingHideThisUsersSignature",
            "settingXenforoFooter",
        ];

        oldSettings.forEach(key => {
            if (settings[key] !== undefined) {
                defaultValues[key] = settings[key];
            }
        });

        await chrome.storage.local.clear();
    }

    chrome.storage.local.set(defaultValues);
}

function checkPermissions() {
    chrome.permissions.contains({
        origins: [
            "https://techolay.net/sosyal/*",
            "https://www.technopat.net/sosyal/*",
        ]
    }).then(granted => {
        if (!granted) {
            chrome.tabs.create({ url: `${ chrome.runtime.getURL("options.html") }#settings.html` });
        }
    });
}

function injectCSS(tabId, forum) {
    chrome.storage.local.get(`${ forum }CSS`).then(settings => {
        chrome.scripting.insertCSS({
            target: { tabId: tabId },
            origin: "AUTHOR",
            css: settings[`${ forum }CSS`],
        });
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

function noteSavedMessage(tabId) {
    chrome.scripting.executeScript({
        target: { tabId: tabId },
        injectImmediately: true,
        func: () => {
            // if chrome
            if (window?.wrappedJSObject?.XF?.browser?.browser !== "mozilla") {
                chrome.runtime.sendMessage({
                    type: "noteSavedMessageChrome",
                });

                return;
            }

            const XF = window.wrappedJSObject.XF;

            switch (XF.getLocale()) {
                case "en_US": XF.flashMessage("Note has been saved.", 1500); break;
                case "tr_TR": XF.flashMessage("Not kaydedildi.", 1500); break;
            }
        }
    });
}

function noteSavedMessageChrome(tabId) {
    chrome.scripting.executeScript({
        target: { tabId: tabId },
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

chrome.storage.onChanged.addListener(changes => {
    Object.entries(changes).forEach(([key, { oldValue, newValue }]) => {
        if (SET_CSS_KEYS.includes(key)) {
            setCSS(FORUMS.find(forum => key.startsWith(forum)));
        }
    });
});

async function setCSS(forum) {
    if (forum === undefined) {
        FORUMS.forEach(forum => setCSS(forum));

        return;
    }

    console.time(`setCSS: ${ forum }`);

    const settings = await chrome.storage.local.get();

    const quoteCSS = settings["settingQuotes"]
        ? `[data-attributes="member: ${ settings[`${ forum }User`].join(`"],[data-attributes="member: `) }"]{display:none!important;}`
        : "";

    const userList = `(a:is([data-user-id="${ settings[`${ forum }User`].join(`"],[data-user-id="`) }"]))`;

    const userCSS = `:is(${ Object.keys(SELECTORS.user)
        .filter(key => settings[key])
        .map(key => SELECTORS.user[key])
        .join()
        }):has${ userList }{display:none!important;}:is(.block-row,.node-extra-row .node-extra-user):has${ userList },.structItem-cell.structItem-cell--latest:has${ userList }>div,:is(.message.message--post, .message.message--article, .structItem):has(:is(.message-cell--user, .message-articleUserInfo, .structItem-cell--main) :is${ userList }){display:none!important;}`;

    // https://github.com/J3ekir/The-Blocker/commit/03d6569c44318ee1445049faba4e268ade3b79aa
    const avatarCSS = `:is(#theBlocker,a:is([data-user-id="${ settings[`${ forum }Avatar`].join(`"],[data-user-id="`) }"]))>img{display:none;}`;
    const signatureCSS = `.message-inner:has(a:is([data-user-id="${ settings[`${ forum }Signature`].join(`"],[data-user-id="`) }"])) .message-signature{display:none;}`;

    const miscCSS = `:is(${ Object.keys(SELECTORS.misc)
        .filter(key => settings[key])
        .map(key => SELECTORS.misc[key])
        .join()
        }){display:none!important;}`;

    const CSS = `${ quoteCSS }${ userCSS }${ avatarCSS }${ signatureCSS }${ miscCSS }`;

    await chrome.storage.local.set({
        [`${ forum }CSS`]: CSS,
    });

    console.timeEnd(`setCSS: ${ forum }`);
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
