import { GifResizer } from "./../lib/omggif/omggif.js";

self.getNestedValue = (obj, keys) => keys.reduce((acc, key) => acc && acc[key], obj);

self.getVariables = (_, { variables }, sendResponse) => sendResponse(variables.map(key => getNestedValue(self, key.split("."))));

self.injectCSS = ({ tab }, { forum }) => {
	chrome.storage.local.get(`${ forum }CSS`).then(settings => {
		chrome.scripting.insertCSS({
			target: { tabId: tab.id },
			origin: "AUTHOR",
			css: settings[`${ forum }CSS`],
		});
	});
};

self.insertCssString = ({ tab }, { css }) => {
	chrome.scripting.insertCSS({
		target: { tabId: tab.id },
		origin: "USER",
		css,
	});
};

self.removeCssString = ({ tab }, { css }) => {
	chrome.scripting.removeCSS({
		target: { tabId: tab.id },
		origin: "USER",
		css,
	});
};

self.noteSavedMessage = ({ tab }, { message }) => {
	chrome.scripting.executeScript({
		target: { tabId: tab.id },
		injectImmediately: true,
		world: "MAIN",
		args: [message],
		func: message => XF.flashMessage(message, 1500),
	});
};

self.url2Base64 = (_, { url, forumUserId, t }) => {
	fetch(url.replace(/\/avatars\/[sm]\//, "/avatars/o/"))
		.then(response => response.arrayBuffer())
		.then(arrayBuffer => new Uint8Array(arrayBuffer))
		.then(async typedArray => {
			const gifResizer = new GifResizer(typedArray);

			if (gifResizer.frameCount === 1) { throw new Error("1 frame GIF."); }

			const [s, m] = await Promise.all([gifResizer.resize(48), gifResizer.resize(96)]);
			chrome.storage.local.set({ [forumUserId]: { t, s, m, g: 1 } });
		})
		.catch(error => {
			chrome.storage.local.set({ [forumUserId]: { t, g: 0 } });

			switch (error.message) {
				case "Invalid GIF 89a header.": break;
				default: console.log(forumUserId, error.message);
			}
		});
};

self.gifRule = (key, value) => {
	const forum = key.slice(0, -3);
	const { origin, id } = forumGifData[forum];
	const addRules = [{
		id,
		action: {
			type: "redirect",
			redirect: {
				regexSubstitution: `${ origin }/sosyal/data/avatars/o/\\1`
			}
		},
		condition: {
			regexFilter: `^${ origin }/sosyal/data/avatars/[lh]/(.+)$`
		}
	}];

	chrome.declarativeNetRequest.updateDynamicRules({
		...value && { addRules },
		removeRuleIds: [id],
	});
};
