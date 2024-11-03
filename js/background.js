import "./backgroundConfig.js";
import "./backgroundUtils.js";

chrome.runtime.onInstalled.addListener(async ({ reason, temporary }) => {
    await setDefaultSettings();
    setCSS();

    if (reason === "install") {
        checkPermissions();
    }
});

chrome.runtime.onMessage.addListener(({ type, ...params }, sender, sendResponse) => {
    self[type](sender.tab.id, params);
});

async function setDefaultSettings() {
    const settings = await chrome.storage.local.get();
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

chrome.storage.onChanged.addListener(changes => {
    const keys = Object.keys(changes);
    let setCssCalled = false;

    keys.forEach(key => {
        if (!setCssCalled && SET_CSS_TRIGGER_KEYS.includes(key)) {
            setCSS(FORUMS.find(forum => key.startsWith(forum)));
            setCssCalled = true;
        }
    });
});

async function setCSS(forum) {
    if (forum === undefined) {
        FORUMS.forEach(forum => setCSS(forum));
        return;
    }

    console.time(`setCSS ${ forum }`);

    const settings = await chrome.storage.local.get(getSetCssKeys(forum));

    const quoteCSS = settings["settingQuotes"]
        ? `[data-attributes="member: ${ settings[`${ forum }User`].join(`"],[data-attributes="member: `) }"]{display:none!important;}`
        : "";

    const userList = `(a:is([data-user-id="${ settings[`${ forum }User`].join(`"],[data-user-id="`) }"]))`;

    const userCSS = `:is(${ Object.keys(SELECTORS.user)
        .filter(key => settings[key])
        .map(key => SELECTORS.user[key])
        .join()
        }):has${ userList }{display:none!important;}:is(.block-row,.node-extra-row .node-extra-user):has${ userList },.structItem-cell.structItem-cell--latest:has${ userList }>div,:is(.message.message--post, .message.message--article, .structItem):has(:is(.message-cell--user, .message-articleUserInfo, .structItem-cell--main) :is${ userList }){display:none!important;}`;

    // https://github.com/J3ekir/The-Blocker/commit/03d6569
    const avatarCSS = `:is(#theBlocker,:is(a,span):is([data-user-id="${ settings[`${ forum }Avatar`].join(`"],[data-user-id="`) }"]))>img{display:none;}`;
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
