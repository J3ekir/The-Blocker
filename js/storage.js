const storage = {};

storage.settings = {};

storage.miscKeys = {
    "settingsSidebarShareThisPage": `div[data-widget-id="8"]`,
    "settingsSidebarMembersOnline": `div[data-widget-id="6"]`,
    "settingsSidebarRandomBlogEntries": `div[data-widget-id="41"]`,
    "settingsSidebarLatestResources": `div[data-widget-id="11"]`,
    "settingsNavigationBlogs": `li:has(a[data-xf-key="4"])`,
    "settingsNavigationVideos": `li:has(a[data-xf-key="6"])`,
    "settingsNavigationAdvices": `li:has(a[data-xf-key="7"])`,
    "settingsNavigationSponsor": `li:has(a[data-xf-key="8"])`,
    "settingsNavigationMedia": `li:has(a[data-xf-key="12"])`,
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
    if (callback) {
        return await chrome.storage.local.get(keys, callback);
    }
    return await chrome.storage.local.get(keys);
};

storage.set = async function (keys, callback = null) {
    if (callback) {
        return await chrome.storage.local.set(keys, callback);
    }
    return await chrome.storage.local.set(keys);
};

storage.setCSS = async function () {
    console.time("setCSS");

    this.settings = await this.get(null);

    var miscCSS = "";
    var userCSS = "";
    var avatarCSS = "";
    var signatureCSS = "";
    var quoteCSS = "";

    var userCSSgeneral = "";
    var userCSSlatestOnNewThreadsPosts = "";
    var userCSSlatestOnCategoryNames = "";
    var userCSSnewThreadsPostsHome = "";

    var isAnyUserFiltersAreUsed = Object.keys(this.userKeys).some(key => this.settings[key]);

    if (this.settings["settingsAvatars"] && this.settings["avatarArray"].length) {
        avatarCSS = `:is(#theBlocker, a[data-user-id="${this.settings["avatarArray"].join(`"],a[data-user-id="`)}"])>img{display:none;}`;
    }

    if (this.settings["settingsSignatures"] && this.settings["signatureArray"].length) {
        signatureCSS = `.message-signature:has(#theBlocker, .js-userSignature-${this.settings["signatureArray"].join(`,.js-userSignature-`)}){display:none;}`;
    }

    if (this.settings["settingsQuotes"] && this.settings["userArray"].length) {
        quoteCSS = `[data-attributes="member: ${this.settings["userArray"].join(`"],[data-attributes="member: `)}"]{display:none!important;}`;
    }

    // if any misc filters are used
    if (Object.keys(this.miscKeys).some(key => this.settings[key])) {
        miscCSS = `:is(${Object.entries(this.miscKeys)
                .filter(([key, value]) => this.settings[key])
                .map(([key, value]) => value)
                .join()
            }){display:none!important;}`;
    }

    if (this.settings["userArray"].length &&
        (isAnyUserFiltersAreUsed ||
            this.settings["settingsLatestOnNewThreadsPosts"] ||
            this.settings["settingsLatestOnCategoryNames"])
    ) {
        var userList = `(a[data-user-id="${this.settings["userArray"].join(`"],a[data-user-id="`)}"])`;

        if (isAnyUserFiltersAreUsed) {
            userCSSgeneral = `:is(${Object.entries(this.userKeys)
                    .filter(([key, value]) => this.settings[key])
                    .map(([key, value]) => value)
                    .join()
                }):has${userList}{display:none!important;}`;
        }

        if (this.settings["settingsLatestOnNewThreadsPosts"]) {
            userCSSlatestOnNewThreadsPosts = `.structItem-cell.structItem-cell--latest:has${userList}>:is(a,div){display:none!important;}`;
        }

        if (this.settings["settingsLatestOnCategoryNames"]) {
            userCSSlatestOnCategoryNames = `.node-extra:has${userList}>.node-extra-row{display:none!important;}`;
        }

        if (this.settings["settingsNewThreadsPostsHome"]) {
            userCSSnewThreadsPostsHome = `.structItem:has(.structItem-cell--main :is${userList}){display:none!important;}`;
        }

        userCSS = `${userCSSgeneral}${userCSSlatestOnNewThreadsPosts}${userCSSlatestOnCategoryNames}${userCSSnewThreadsPostsHome}`;
    }

    var CSS = `${miscCSS}${userCSS}${avatarCSS}${signatureCSS}${quoteCSS}`;

    await this.set({
        CSS: CSS
    });

    console.timeEnd("setCSS");

    return CSS;
};

export default storage;
