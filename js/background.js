import "./background_config.js";
import "./background_utils.js";

chrome.runtime.onInstalled.addListener(({ reason, temporary }) => {
	setDefaultSettings();
	setCSS();

	if (reason === "install") {
		checkPermissions();
		checkAnimationPolicy();
	}
});

chrome.runtime.onMessage.addListener(({ type, ...params }, sender, sendResponse) => self[type](sender, params, sendResponse));

function setDefaultSettings() {
	chrome.storage.local.get(defaultSettingsKeys).then(settings => chrome.storage.local.set(Object.fromEntries(defaultSettingsKeys.map(key => [key, settings[key] ?? defaultSettings[key]]))));
}

function checkPermissions() {
	chrome.permissions.contains({ origins }).then(granted => !granted && chrome.tabs.create({ url: `${ chrome.runtime.getURL("options.html") }#settings.html` }));
}

function checkAnimationPolicy() {
	const policy = !isFirefox
		? chrome?.accessibilityFeatures?.animationPolicy?.get({})
		: chrome?.browserSettings?.imageAnimationBehavior?.get({});
	policy.then(({ value }) => chrome.storage.local.set({ animationPolicy: animationPolicyValues[value] }));
}

chrome.storage.local.onChanged.addListener(changes => {
	let callSetCSS = false;
	const setCssParams = new Set();

	Object.keys(changes).forEach(key => {
		if (key.endsWith("Gif")) {
			storageChangedGifRule(key, changes[key]);
		}

		if (SET_CSS_TRIGGER_KEYS.includes(key)) {
			callSetCSS = true;
			storageChangedSetCss(key, changes[key])?.forEach(forum => setCssParams.add(forum));
		}
	});

	if (callSetCSS) {
		setCSS(...setCssParams);
	}
});

function storageChangedSetCss(key, { oldValue, newValue }) {
	// https://github.com/J3ekir/The-Blocker/issues/5
	if (isFirefox && oldValue === newValue) { return; }

	return FORUMS.filter(forum => key.startsWith(forum));
}

function storageChangedGifRule(key, { oldValue, newValue }) {
	// https://github.com/J3ekir/The-Blocker/issues/5
	if (isFirefox && oldValue === newValue) { return; }

	gifRule(key, newValue);
}

async function setCSS(...forums) {
	forums = forums[0] ? forums : FORUMS;

	for (const forum of forums) {
		console.time(`setCSS ${ forum }`);

		const settings = await chrome.storage.local.get(getSetCssKeys(forum));

		const quoteCSS = settings["settingQuotes"]
			? `[data-attributes="member: ${ settings[`${ forum }User`].join(`"],[data-attributes="member: `) }"]`
			: "";
		const userList = `[data-user-id="${ settings[`${ forum }User`].join(`"],[data-user-id="`) }"]`;
		const commonUserCSS = Object.keys(SELECTORS.user).filter(key => settings[key]).map(key => SELECTORS.user[key]).join();
		const userCSS = `:is(${ commonUserCSS }):has(${ userList }),:is(.block-row,.node-extra-row .node-extra-user,.memberOverviewBlock-list>li):has(${ userList }),.structItem-cell.structItem-cell--latest:has(${ userList })>div,:is(.message.message--post, .message.message--article, .structItem):has(:is(.message-cell--user, .message-articleUserInfo, .structItem-cell--main) :is(${ userList }))`;
		// https://github.com/J3ekir/The-Blocker/commit/03d6569
		const avatarCSS = `:is(#theBlocker,:is(a,span):is([data-user-id="${ settings[`${ forum }Avatar`].join(`"],[data-user-id="`) }"]))>:is(img,canvas)`;
		const signatureCSS = `.message-inner:has(a:is([data-user-id="${ settings[`${ forum }Signature`].join(`"],[data-user-id="`) }"])) .message-signature`;
		const miscCSS = Object.keys(SELECTORS.misc).filter(key => settings[key]).map(key => SELECTORS.misc[key]).join();

		const CSS = `${ quoteCSS },${ userCSS },${ avatarCSS },${ signatureCSS },${ miscCSS }{display:none!important;}`;

		await chrome.storage.local.set({
			[`${ forum }CSS`]: CSS,
		});

		console.timeEnd(`setCSS ${ forum }`);
	}
}

/**********************************************************************************************/
// keepAlive
// https://stackoverflow.com/a/66618269
// "Persistent" service worker while a connectable tab is present
// "host_permissions": ["<all_urls>"],
// const onUpdate = (tabId, info, tab) => /^https?:/.test(info.url) && findTab([tab]);
// findTab();
// chrome.runtime.onConnect.addListener(port => {
// 	if (port.name === "keepAlive") {
// 		setTimeout(() => port.disconnect(), 250e3);
// 		port.onDisconnect.addListener(() => findTab());
// 	}
// });
// async function findTab(tabs) {
// 	if (chrome.runtime.lastError) { } // tab was closed before setTimeout ran
// 	for (const { id: tabId } of tabs || await chrome.tabs.query({ url: "*://*/*" })) {
// 		try {
// 			await chrome.scripting.executeScript({ target: { tabId }, func: connect });
// 			chrome.tabs.onUpdated.removeListener(onUpdate);
// 			return;
// 		} catch (e) { }
// 	}
// 	chrome.tabs.onUpdated.addListener(onUpdate);
// }
// function connect() {
// 	chrome.runtime.connect({ name: "keepAlive" })
// 		.onDisconnect.addListener(connect);
// }
/**********************************************************************************************/
