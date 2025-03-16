self.isFirefox = navigator.userAgent.toLowerCase().includes("firefox");

self.origins = chrome.runtime.getManifest()["host_permissions"];

self.FORUMS = origins.map(origin => new URL(origin).hostname.replace(/(?:www.)?(.*).net/, "$1"));

self.animationPolicyValues = {
	allowed: "allowed",
	normal: "allowed",
	once: "once",
	none: "none",
};

self.forumGifData = Object.fromEntries(
	FORUMS.map((forum, index) => [
		forum,
		{
			origin: origins[index].replace("/sosyal/*", ""),
			id: index + 1,
			prefix: `${ index + 1 }_`,
		},
	])
);

self.gifPrefixes = Object.values(forumGifData).map(({ prefix }) => prefix);

self.SELECTORS = {
	filters: [
		"User",
		"Avatar",
		"Signature",
	],
	misc: {
		settingSidebarShareThisPage: "div[data-widget-definition='share_page']",
		settingSidebarMembersOnline: "div[data-widget-section='onlineNow']",
		settingSidebarRandomBlogEntries: "div[data-widget-definition='xa_ubs_latest_entries']",
		settingSidebarLatestResources: "div[data-widget-definition='xfrm_new_resources']",
		settingNavigationBlogs: "li:has(a[data-nav-id='xa_ubs'],a[data-nav-id='taylorjBlogs'])",
		settingNavigationQuestions: "li:has(a[data-nav-id='sorular'])",
		settingNavigationVideos: "li:has(a[data-nav-id='videolar'])",
		settingNavigationAdvices: "li:has(a[data-nav-id='sistem'])",
		settingNavigationMedia: "li:has(a[data-nav-id='xfmg'])",
		settingNavigationStore: "li:has(a[data-nav-id='dbtechEcommerce'])",
		settingNavigationCredits: "li:has(a[data-nav-id='dbtechCredits'])",
		settingNavigationAccountTypes: "li:has(a[data-nav-id='ozzmodz_paidreg_types'])",
		settingShowIgnoredContent: ".showIgnoredLink.js-showIgnored",
		settingHideThisUsersSignature: "[data-xf-click='signature-ignore']",
		settingXenforoFooter: ".p-footer-copyright",
		settingReportReasonExplanation: ".overlay-container form[action$='/report'] ul.inputChoices[role='radiogroup'] > li > dfn",
		settingScheduledContent: "form[method='post'] dl:has([name='ozzmodz_sc_check'])",
		settingSpellCheck: "form[method='post'] dl:has([name='fixDot'])",
		settingAds: "div[data-position]:has([data-xf-init='sam-item'])",
	},
	user: {
		settingNotifications: ".alert.js-alert",
		settingProfilePosts: ".message.message--simple",
		settingProfilePostComments: ".message-responseRow",
	},
};

const SET_CSS_KEYS = [
	"settingQuotes",
	...Object.keys(SELECTORS.user),
	...Object.keys(SELECTORS.misc),
];

self.SET_CSS_TRIGGER_KEYS = [
	...SET_CSS_KEYS,
	...FORUMS.flatMap(forum => SELECTORS.filters.map(filter => `${ forum }${ filter }Count`)),
];

self.getSetCssKeys = forum => {
	return [
		...SET_CSS_KEYS,
		...SELECTORS.filters.map(filter => `${ forum }${ filter }`),
	];
};

const storage = {
	defaultForumSettings: {
		User: [],
		Avatar: [],
		Signature: [],
		UserCount: 0,
		AvatarCount: 0,
		SignatureCount: 0,
		Notes: {},
		CSS: "",
		Gif: !self.isFirefox,
	},
	defaultSettings: {
		animationPolicy: "allow",
		lastPane: "settings.html",
		lastForum: FORUMS[0],
		theme: "system",
		hideDoubleTapHint: false,
		hideAnimationPolicyHint: false,
		settingNotes: true,
		settingAddBottomTabButtons: true,
		settingCombineTabPanes: true,
		settingUserButton: true,
		settingAvatarButton: true,
		settingSignatureButton: true,
		settingNotifications: true,
		settingProfilePosts: true,
		settingProfilePostComments: true,
		settingQuotes: true,
		settingSidebarShareThisPage: true,
		settingSidebarMembersOnline: true,
		settingSidebarRandomBlogEntries: true,
		settingSidebarLatestResources: true,
		settingNavigationBlogs: true,
		settingNavigationQuestions: true,
		settingNavigationVideos: true,
		settingNavigationAdvices: true,
		settingNavigationMedia: true,
		settingNavigationStore: true,
		settingNavigationCredits: true,
		settingNavigationAccountTypes: true,
		settingShowIgnoredContent: true,
		settingHideThisUsersSignature: true,
		settingXenforoFooter: true,
		settingReportReasonExplanation: true,
		settingScheduledContent: true,
		settingSpellCheck: true,
		settingAds: true,
	},
};

self.defaultSettings = {
	...storage.defaultSettings,
	...Object.fromEntries(FORUMS.flatMap(forum => Object.entries(storage.defaultForumSettings).map(([key, value]) => ([`${ forum }${ key }`, value])))),
};

self.defaultSettings.techolayGif = false;

self.defaultSettingsKeys = Object.keys(defaultSettings);
