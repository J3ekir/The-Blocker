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

chrome.runtime.onMessage.addListener(({ type, ...params }, sender, sendResponse) => {
    self[type](sender.tab.id, ...Object.values(params));
});

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

function noteSavedMessage(tabId, isChrome) {
    chrome.scripting.executeScript({
        target: { tabId: tabId },
        injectImmediately: true,
        ...(isChrome && { world: "MAIN" }),
        func: () => {
            const XF = window.XF || window.wrappedJSObject.XF;
            switch (XF.getLocale()) {
                case "en_US": XF.flashMessage("Note has been saved.", 1500); break;
                case "tr_TR": XF.flashMessage("Not kaydedildi.", 1500); break;
            }
        }
    });
}

chrome.storage.onChanged.addListener(changes => {
    for (const key of Object.keys(changes)) {
        if (SET_CSS_KEYS.includes(key)) {
            setCSS(FORUMS.find(forum => key.startsWith(forum)));
            break;
        }
    }
});

async function setCSS(forum) {
    if (forum === undefined) {
        FORUMS.forEach(forum => setCSS(forum));

        return;
    }

    console.time(`setCSS ${ forum }`);

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

    console.timeEnd(`setCSS ${ forum }`);
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
