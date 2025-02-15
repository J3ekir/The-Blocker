(async () => {
	const USE_GIF = await chrome.storage.local.get([`${ forum }Gif`, "animationPolicy"]).then(settings => settings[`${ forum }Gif`] && settings.animationPolicy !== "none");
	if (!USE_GIF) { return; }

	chrome.runtime.sendMessage({
		type: "gifStopperStopper",
	});

	const [{ origin, prefix }] = await chrome.runtime.sendMessage({
		type: "getVariables",
		variables: [`forumGifData.${ forum }`],
	});
	const avatarSelector = ".avatar[data-user-id]>img:not([class$='l'])";
	const processedAvatars = new Set();
	const cache = {};
	let avatarProcessor = processAvatarOnLoad;

	if (document.readyState !== "loading") { processAllAvatarsAfterLoad(); }
	else { document.addEventListener("DOMContentLoaded", processAllAvatarsAfterLoad); }
	observeForAvatars();

	function processAllAvatarsAfterLoad() {
		processedAvatars.clear();
		qsa(avatarSelector).forEach(processAvatarOnLoad);
		avatarProcessor = processAvatarAfterLoad;
	}

	function processAvatarOnLoad(elem) {
		processAvatar(elem, true);
	}

	function processAvatarAfterLoad(elem) {
		processAvatar(elem);
		qsa(elem, avatarSelector).forEach(processAvatar);
	}

	async function processAvatar(img, isLoading) {
		if (img.nodeType !== Node.ELEMENT_NODE) { return; }
		if (!img?.matches?.(avatarSelector)) { return; }
		if (!img?.src?.startsWith(origin) && (!isLoading || !img?.src?.startsWith("data:"))) { return; }

		const t = parseInt(img.src.split("?")[1], 10);
		const userId = img.parentElement.getAttribute("data-user-id");
		const forumUserId = `${ prefix }${ userId }`;

		if (isLoading) {
			if (processedAvatars.has(forumUserId)) { return; }
			processedAvatars.add(forumUserId);
		}

		if (cache[forumUserId]?.g) {
			updateAvatars(forumUserId);
			return;
		}

		const { [forumUserId]: gif } = await chrome.storage.local.get(forumUserId);

		if (gif?.t !== t) {
			chrome.runtime.sendMessage({
				type: "url2Base64",
				url: img.src,
				forumUserId,
				t,
			});
			return;
		}

		if (gif?.g) {
			cache[forumUserId] = gif;
			updateAvatars(forumUserId);
		}
	}

	function updateAvatars(forumUserId) {
		qsa(`[data-user-id="${ forumUserId.substring(2) }"]${ avatarSelector }`).forEach(img => img.src = img.srcset = cache[forumUserId][img.className.at(-1)]);
	}

	function observeForAvatars() {
		new MutationObserver(mutationList =>
			mutationList.forEach(mutation =>
				mutation.addedNodes.forEach(elem => {
					if (elem.nodeType === Node.ELEMENT_NODE) {
						avatarProcessor(elem);
					}
				})
			)
		).observe(document, { childList: true, subtree: true });
	}

	chrome.storage.local.onChanged.addListener(changes => {
		Object.entries(changes).forEach(([key, { oldValue, newValue }]) => {
			if (newValue.g && key.startsWith(prefix)) {
				// https://github.com/J3ekir/The-Blocker/issues/5
				if (isFirefox && oldValue.t === newValue.t) { return; }

				cache[key] = newValue;
				updateAvatars(key);
			}
		});
	});
})();
