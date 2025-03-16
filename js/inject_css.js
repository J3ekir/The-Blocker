chrome.runtime.sendMessage({
	type: "injectCSS",
	forum,
});

const blockKeys = [
	`${ forum }User`,
	`${ forum }Avatar`,
	`${ forum }Signature`,
];

chrome.storage.local.onChanged.addListener(changes => {
	blockKeys
		.filter(key => typeof changes[key] !== "undefined")
		.forEach(key => storageChangedBlock(key, changes[key]));
});

function storageChangedBlock(key, { oldValue, newValue }) {
	// https://github.com/J3ekir/The-Blocker/issues/5
	if (isFirefox && JSON.stringify(oldValue) === JSON.stringify(newValue)) { return; }

	const oldSet = new Set(oldValue);
	const newSet = new Set(newValue);
	toggleCSS(true, key, [...newSet.difference(oldSet)]);
	toggleCSS(false, key, [...oldSet.difference(newSet)]);
}

async function toggleCSS(isBlock, key, userIds) {
	const settings = await chrome.storage.local.get([
		"settingQuotes",
		"settingNotifications",
		"settingProfilePosts",
		"settingProfilePostComments",
	]);
	const userList = `[data-user-id="${ userIds.join(`"],[data-user-id="`) }"]`;
	let CSS;

	switch (key) {
		case `${ forum }User`:
			const commonUserCSS = `.structItem:has(.structItem-cell--main :is(${ userList })){display:${ isBlock ? "none" : "table" }!important;}:is(.node-extra-row .node-extra-user,.memberOverviewBlock-list>li):has(${ userList }){display:${ isBlock ? "none" : "inline" }!important;}.block-row:has(${ userList }),.structItem-cell.structItem-cell--latest:has(${ userList })>div,:is(.message.message--post, .message.message--article):has(:is(.message-cell--user, .message-articleUserInfo) :is(${ userList }))`;
			const quoteCSS = settings["settingQuotes"]
				? `[data-attributes="member: ${ userIds.join(`"],[data-attributes="member: `) }"]`
				: "";
			const notificationsCSS = settings["settingNotifications"]
				? `.alert.js-alert:has(${ userList })`
				: "";
			const profilePostsCSS = settings["settingProfilePosts"]
				? `.message.message--simple:has(${ userList })`
				: "";
			const profilePostCommentsCSS = settings["settingProfilePostComments"]
				? `.message-responseRow:has(${ userList })`
				: "";
			CSS = [commonUserCSS, quoteCSS, notificationsCSS, profilePostsCSS, profilePostCommentsCSS].filter(Boolean).join();
			break;
		case `${ forum }Avatar`:
			CSS = `:is(a,span):is(${ userList })>:is(img,canvas)`;
			break;
		case `${ forum }Signature`:
			CSS = `.message-inner:has(${ userList }) .message-signature`;
			break;
	}

	const css = `${ CSS }{display:${ isBlock ? "none" : "block" }!important;}`;

	chrome.runtime.sendMessage({
		type: "insertCssString",
		css,
	});
}
