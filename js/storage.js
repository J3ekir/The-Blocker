storage = {};

storage.isInited = false;

storage.init = async function() {
    if (!storage.isInited) {
        storage.settings = await chrome.storage.local.get(null);
        storage.isInited = true;
    }
}

storage.refresh = async function() {
    storage.settings = await chrome.storage.local.get(null);
}

storage.miscKeys = {
    "settingsSidebarShareThisPage": `div[data-widget-id="8"]`,
    "settingsSidebarMembersOnline": `div[data-widget-id="6"]`,
    "settingsSidebarRandomBlogEntries": `div[data-widget-id="41"]`,
    "settingsSidebarLatestResources": `div[data-widget-id="11"]`,
    "settingsNavigationBlogs": `li:has(a[data-xf-key="5"])`,
    "settingsNavigationQuestions": `li:has(a[data-xf-key="6"])`,
    "settingsNavigationVideos": `li:has(a[data-xf-key="7"])`,
    "settingsNavigationAdvices": `li:has(a[data-xf-key="8"])`,
    "settingsNavigationSponsor": `li:has(a[data-xf-key="9"])`,
    "settingsNavigationMedia": `li:has(a[data-xf-key="13"])`,
    "settingsShowIgnoredContent": `.showIgnoredLink.js-showIgnored`,
    "settingsHideThisUsersSignature": `[class^="js-userSignatureLabel"]`,
    "settingsXenforoFooter": `.p-footer-copyright`,
};

storage.userKeys = {
    "settingsPostsOnThreads": ".message.message--article,.message.message--post",
    "settingsNewThreadsPostsSidebar": ".block-row",
    "settingsNotifications": ".alert.js-alert",
    "settingsProfilePosts": ".message.message--simple",
    "settingsProfilePostComments": ".message-responseRow",

    // "settingsNewThreadsPostsHome": ".structItem:has(.structItem-cell--main)",
    // "settingsLatestOnNewThreadsPosts": false,
    // "settingsLatestOnCategoryNames": false,
    // "settingsQuotes": false,
};

storage.get = async function (keys, callback = null) {
    return callback
        ? await chrome.storage.local.get(keys, callback)
        : await chrome.storage.local.get(keys);
};

storage.set = async function (keys, callback = null) {
    return callback
        ? await chrome.storage.local.set(keys, callback)
        : await chrome.storage.local.set(keys);
};

storage.setCSS = async function () {
    console.time("setCSS");

    await storage.refresh();

    var miscCSS = "";
    var userCSS = "";
    var avatarCSS = "";
    var signatureCSS = "";
    var quoteCSS = "";

    var userCSSgeneral = "";
    var userCSSlatestOnNewThreadsPosts = "";
    var userCSSlatestOnCategoryNames = "";
    var userCSSnewThreadsPostsHome = "";

    var isAnyUserFiltersAreUsed = Object.keys(this.userKeys).some(key => storage.settings[key]);

    // https://github.com/J3ekir/The-Blocker/commit/03d6569c44318ee1445049faba4e268ade3b79aa
    if (storage.settings["settingsAvatars"] && storage.settings["avatarArray"].length) {
        avatarCSS = `:is(#theBlocker, a[data-user-id="${ storage.settings["avatarArray"].join(`"],a[data-user-id="`) }"])>img{display:none;}`;
    }

    if (storage.settings["settingsSignatures"] && storage.settings["signatureArray"].length) {
        signatureCSS = `.message-signature:has(.js-userSignature-${ storage.settings["signatureArray"].join(`,.js-userSignature-`) }){display:none;}`;
    }

    if (storage.settings["settingsQuotes"] && storage.settings["userArray"].length) {
        quoteCSS = `[data-attributes="member: ${ storage.settings["userArray"].join(`"],[data-attributes="member: `) }"]{display:none!important;}`;
    }

    // if any misc filters are used
    if (Object.keys(this.miscKeys).some(key => storage.settings[key])) {
        miscCSS = `:is(${ Object.keys(this.miscKeys)
            .filter(key => storage.settings[key])
            .map(key => this.miscKeys[key])
            .join()
            }){display:none!important;}`;
    }

    if (storage.settings["userArray"].length &&
        (isAnyUserFiltersAreUsed
            || storage.settings["settingsLatestOnNewThreadsPosts"]
            || storage.settings["settingsLatestOnCategoryNames"])
    ) {
        var userList = `(a[data-user-id="${ storage.settings["userArray"].join(`"],a[data-user-id="`) }"])`;

        if (isAnyUserFiltersAreUsed) {
            userCSSgeneral = `:is(${ Object.keys(this.userKeys)
                .filter(key => storage.settings[key])
                .map(key => this.userKeys[key])
                .join()
                }):has${ userList }{display:none!important;}`;
        }

        if (storage.settings["settingsLatestOnNewThreadsPosts"]) {
            // to hide latest too
            // :has()>div -> :has()>:is(a,div) || :has()>*
            userCSSlatestOnNewThreadsPosts = `.structItem-cell.structItem-cell--latest:has${ userList }>div{display:none!important;}`;
        }

        if (storage.settings["settingsLatestOnCategoryNames"]) {
            userCSSlatestOnCategoryNames = `.node-extra-row:has${ userList }{display:none!important;}`;
        }

        if (storage.settings["settingsNewThreadsPostsHome"]) {
            userCSSnewThreadsPostsHome = `.structItem:has(.structItem-cell--main :is${ userList }){display:none!important;}`;
        }

        userCSS = `${ userCSSgeneral }${ userCSSlatestOnNewThreadsPosts }${ userCSSlatestOnCategoryNames }${ userCSSnewThreadsPostsHome }`;
    }

    var CSS = `${ miscCSS }${ userCSS }${ avatarCSS }${ signatureCSS }${ quoteCSS }`;

    await this.set({
        CSS: CSS
    });

    console.timeEnd("setCSS");

    return CSS;
};
