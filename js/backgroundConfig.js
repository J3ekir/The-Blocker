export const FORUMS = [
    "techolay",
    "technopat",
];

export const SELECTORS = {
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
        "settingNavigationBlogs": "li:has(a[data-nav-id='xa_ubs'],a[data-nav-id='taylorjBlogs'])",
        "settingNavigationQuestions": "li:has(a[data-nav-id='sorular'])",
        "settingNavigationVideos": "li:has(a[data-nav-id='videolar'])",
        "settingNavigationAdvices": "li:has(a[data-nav-id='sistem'])",
        "settingNavigationMedia": "li:has(a[data-nav-id='xfmg'])",
        "settingShowIgnoredContent": ".showIgnoredLink.js-showIgnored",
        "settingHideThisUsersSignature": "[data-xf-click='signature-ignore']",
        "settingXenforoFooter": ".p-footer-copyright",
        "settingReportReasonExplanation": ".overlay-container form[action$='/report'] ul.inputChoices[role='radiogroup'] > li > dfn",
    },
    user: {
        "settingNotifications": ".alert.js-alert",
        "settingProfilePosts": ".message.message--simple",
        "settingProfilePostComments": ".message-responseRow",
    },
};

export const SET_CSS_KEYS = [
    "settingQuotes",
    ...FORUMS.flatMap(forum => SELECTORS.filters.map(filter => `${ forum }${ filter }`)),
    ...Object.keys(SELECTORS.user),
    ...Object.keys(SELECTORS.misc),
];

export const storage = {
    "defaultForumSettings": {
        "User": [],
        "Avatar": [],
        "Signature": [],
        "UserCount": 0,
        "AvatarCount": 0,
        "SignatureCount": 0,
        "Notes": {},
        "CSS": "",
    },
    "defaultSettings": {
        "lastPane": "settings.html",
        "lastForum": "techolay",
        "hideDoubleTapHint": false,
        "settingNotes": true,
        "settingAddBottomTabButtons": true,
        "settingCombineTabPanes": true,
        "settingUserButton": true,
        "settingAvatarButton": true,
        "settingSignatureButton": true,
        "settingNotifications": true,
        "settingProfilePosts": true,
        "settingProfilePostComments": true,
        "settingQuotes": true,
        "settingSidebarShareThisPage": true,
        "settingSidebarMembersOnline": true,
        "settingSidebarRandomBlogEntries": true,
        "settingSidebarLatestResources": true,
        "settingNavigationBlogs": true,
        "settingNavigationQuestions": true,
        "settingNavigationVideos": true,
        "settingNavigationAdvices": true,
        "settingNavigationMedia": true,
        "settingShowIgnoredContent": true,
        "settingHideThisUsersSignature": true,
        "settingXenforoFooter": true,
        "settingReportReasonExplanation": true,
    },
};
