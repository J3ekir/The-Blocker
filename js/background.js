import "./backgroundConfig.js";
import "./backgroundUtils.js";

chrome.runtime.onInstalled.addListener(({ reason, temporary }) => {
    setDefaultSettings();
    setCss();

    if (reason === "install") {
        checkPermissions();
    }
});

chrome.runtime.onMessage.addListener(({ type, ...params }, sender, sendResponse) => {
    self[type](sender.tab.id, params);
});

function setDefaultSettings() {
    const keys = Object.keys(defaultSettings);

    chrome.storage.local.get(keys).then(settings => {
        const defaultValues = Object.fromEntries(keys.map(key => [key, settings[key] ?? defaultSettings[key]]));
        chrome.storage.local.set(defaultValues);
    });
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
            setCss(FORUMS.find(forum => key.startsWith(forum)));
            setCssCalled = true;
        }
    });
});

async function setCss(...forums) {
    forums = forums.length ? forums : FORUMS;

    for (const forum of forums) {
        console.time(`setCss ${ forum }`);

        const settings = await chrome.storage.local.get(getSetCssKeys(forum));

        const quoteCSS = settings["settingQuotes"]
            ? `[data-attributes="member: ${ settings[`${ forum }User`].join(`"],[data-attributes="member: `) }"]`
            : "";
        const userList = `[data-user-id="${ settings[`${ forum }User`].join(`"],[data-user-id="`) }"]`;
        const commonUserCSS = Object.keys(SELECTORS.user).filter(key => settings[key]).map(key => SELECTORS.user[key]).join();
        const userCSS = `:is(${ commonUserCSS }):has(${ userList }),:is(.block-row,.node-extra-row .node-extra-user):has(${ userList }),.structItem-cell.structItem-cell--latest:has(${ userList })>div,:is(.message.message--post, .message.message--article, .structItem):has(:is(.message-cell--user, .message-articleUserInfo, .structItem-cell--main) :is(${ userList }))`;
        // https://github.com/J3ekir/The-Blocker/commit/03d6569
        const avatarCSS = `:is(#theBlocker,:is(a,span):is([data-user-id="${ settings[`${ forum }Avatar`].join(`"],[data-user-id="`) }"]))>img`;
        const signatureCSS = `.message-inner:has(a:is([data-user-id="${ settings[`${ forum }Signature`].join(`"],[data-user-id="`) }"])) .message-signature`;
        const miscCSS = Object.keys(SELECTORS.misc).filter(key => settings[key]).map(key => SELECTORS.misc[key]).join();

        const CSS = `${ quoteCSS },${ userCSS },${ avatarCSS },${ signatureCSS },${ miscCSS }{display:none!important;}`;

        await chrome.storage.local.set({
            [`${ forum }CSS`]: CSS,
        });

        console.timeEnd(`setCss ${ forum }`);
    }
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
