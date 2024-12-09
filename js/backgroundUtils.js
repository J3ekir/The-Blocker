import { GifResizer } from "./../lib/omggif/omggif.js";

self.getVariable = (_, { variable }, sendResponse) => sendResponse(self[variable]);

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
	fetch(url.replace(/\/avatars\/[smlh]\//, "/avatars/o/"))
		.then(response => response.arrayBuffer())
		.then(arrayBuffer => new Uint8Array(arrayBuffer))
		.then(async typedArray => {
			const gifResizer = new GifResizer(typedArray);

			if (gifResizer.frameCount === 1) { throw new Error("1 frame GIF."); }

			Promise.all([gifResizer.resize(48), gifResizer.resize(96), gifResizer.resize(192)]).then(([s, m, l]) => chrome.storage.local.set({ [forumUserId]: { t, s, m, l, g: 1 } }));
		})
		.catch(error => {
			chrome.storage.local.set({ [forumUserId]: { t, g: 0 } });

			switch (error.message) {
				case "Invalid GIF 89a header.": break;
				default: console.log(forumUserId, error.message);
			}
		});
};
