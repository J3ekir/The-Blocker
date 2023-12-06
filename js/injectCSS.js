chrome.runtime.sendMessage({
    type: "injectCSS",
});

chrome.storage.onChanged.addListener(async changes => {
    Object.entries(changes).forEach(([key, { oldValue, newValue }]) => {
        switch (key) {
            case "user":
            case "avatar":
            case "signature":
                var isBlock = newValue.length > oldValue.length;
                var userId = isBlock ? newValue.at(-1) : oldValue.at(-1);
                toggleCSS(isBlock, userId, key);
        }
    });
});

async function toggleCSS(isBlock, userId, key) {
    var settings = await chrome.storage.local.get([
        "settingQuotes",
        "settingNotifications",
        "settingProfilePosts",
        "settingProfilePostComments",
    ]);

    var CSS;

    switch (key) {
        case "user":
            var quoteCSS = "";
            var notificationsCSS = "";
            var profilePostsCSS = "";
            var ProfilePostCommentsCSS = "";

            if (settings["settingQuotes"]) {
                quoteCSS = `[data-attributes="member: ${ userId }"],`;
            }

            if ("settingNotifications") {
                notificationsCSS = `.alert.js-alert:has(a[data-user-id="${ userId }"]),`;
            }

            if ("settingProfilePosts") {
                profilePostsCSS = `.message.message--simple:has(a[data-user-id="${ userId }"]),`;
            }

            if ("settingProfilePostComments") {
                ProfilePostCommentsCSS = `.message-responseRow:has(a[data-user-id="${ userId }"]),`;
            }

            CSS = `${ quoteCSS }${ notificationsCSS }${ profilePostsCSS }${ ProfilePostCommentsCSS }:is(.block-row,.node-extra-row .node-extra-user):has(a[data-user-id="${ userId }"]),.structItem-cell.structItem-cell--latest:has(a[data-user-id="${ userId }"])>div,:is(.message.message--post, .message.message--article, .structItem):has(:is(.message-cell--user, .message-articleUserInfo, .structItem-cell--main) a[data-user-id="${ userId }"])`;

            break;
        case "avatar":
            CSS = `a[data-user-id="${ userId }"]>img`;
            break;
        case "signature":
            CSS = `.message-signature:has(.js-userSignature-${ userId })`;
            break;
    }

    var CSS_HIDE = `${ CSS }{display:none!important;}`;
    var CSS_SHOW = `${ CSS }{display:block!important;}`;

    chrome.runtime.sendMessage({
        type: "insertCSSString",
        CSS: isBlock ? CSS_HIDE : CSS_SHOW,
    });

    // ???
    chrome.runtime.sendMessage({
        type: "removeCSSString",
        CSS: isBlock ? CSS_SHOW : CSS_HIDE,
    });
}
