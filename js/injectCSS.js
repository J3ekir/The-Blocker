chrome.runtime.sendMessage({
    type: "injectCSS",
});

chrome.storage.onChanged.addListener(changes => {
    Object.entries(changes).forEach(([key, { oldValue, newValue }]) => {
        switch (key) {
            case "user":
            case "avatar":
            case "signature":
                const isBlock = newValue.length > oldValue.length;
                const userId = isBlock ? newValue.at(-1) : oldValue.find((elem, i) => elem !== newValue[i]);
                toggleCSS(isBlock, userId, key);
        }
    });
});

async function toggleCSS(isBlock, userId, key) {
    const settings = await chrome.storage.local.get([
        "settingQuotes",
        "settingNotifications",
        "settingProfilePosts",
        "settingProfilePostComments",
    ]);

    var CSS;

    switch (key) {
        case "user":
            const quoteCSS = settings["settingQuotes"]
                ? `[data-attributes="member: ${ userId }"],`
                : "";

            const notificationsCSS = settings["settingNotifications"]
                ? `.alert.js-alert:has(a[data-user-id="${ userId }"]),`
                : "";

            const profilePostsCSS = settings["settingProfilePosts"]
                ? `.message.message--simple:has(a[data-user-id="${ userId }"]),`
                : "";

            const ProfilePostCommentsCSS = settings["settingProfilePostComments"]
                ? `.message-responseRow:has(a[data-user-id="${ userId }"]),`
                : "";

            CSS = `${ quoteCSS }${ notificationsCSS }${ profilePostsCSS }${ ProfilePostCommentsCSS }:is(.block-row,.node-extra-row .node-extra-user):has(a[data-user-id="${ userId }"]),.structItem-cell.structItem-cell--latest:has(a[data-user-id="${ userId }"])>div,:is(.message.message--post, .message.message--article, .structItem):has(:is(.message-cell--user, .message-articleUserInfo, .structItem-cell--main) a[data-user-id="${ userId }"])`;

            break;
        case "avatar":
            CSS = `a[data-user-id="${ userId }"]>img`;
            break;
        case "signature":
            CSS = `.message-signature:has(.js-userSignature-${ userId })`;
            break;
    }

    const CSS_HIDE = `${ CSS }{display:none!important;}`;
    const CSS_SHOW = `${ CSS }{display:block!important;}`;

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
