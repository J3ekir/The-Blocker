(async () => {
	const [forums] = await chrome.runtime.sendMessage({
		type: "getVariables",
		variables: ["FORUMS"],
	});

	const STATS = forums.flatMap(forum => [
		"UserCount",
		"AvatarCount",
		"SignatureCount",
	].map(type => `${ forum }${ type }`));

	chrome.storage.local.get(["theme", "lastForum", ...STATS]).then(settings => {
		document.documentElement.setAttribute("theme", settings["theme"]);

		chrome.tabs.query({ active: true, currentWindow: true }, ([tab]) => {
			const forum = tab?.url
				? new URL(tab.url).hostname.replace(/(?:www.)?(.*).net/, "$1")
				: settings["lastForum"];

			if (qs(`[data-forum="${ forum }"]`)) {
				settings["lastForum"] = forum;
			}

			qsa(`[data-forum="${ settings["lastForum"] }"]`).forEach(elem => elem.classList.add("active"));

			chrome.storage.local.set({
				lastForum: settings["lastForum"],
			});
		});

		STATS.forEach(value => {
			qs(`#${ value }`).textContent = settings[value];
		});
	});

	qsa(".tabButton").forEach(elem => {
		elem.addEventListener("click", event => {
			const forum = event.currentTarget.getAttribute("data-forum");

			qsa(".active").forEach(elem => elem.classList.remove("active"));
			qsa(`[data-forum="${ forum }"]`).forEach(elem => elem.classList.add("active"));

			chrome.storage.local.set({
				lastForum: forum,
			});
		});
	});

	chrome.storage.local.onChanged.addListener(changes => {
		Object.entries(changes).forEach(([key, { oldValue, newValue }]) => {
			if (STATS.includes(key)) {
				// https://github.com/J3ekir/The-Blocker/issues/5
				if (isFirefox && oldValue === newValue) { return; }

				qs(`#${ key }`).textContent = newValue;
			}
			if (key === "theme") {
				// https://github.com/J3ekir/The-Blocker/issues/5
				if (isFirefox && oldValue === newValue) { return; }

				document.documentElement.setAttribute(key, newValue);
			}
			if (key === "lastForum") {
				// https://github.com/J3ekir/The-Blocker/issues/5
				if (isFirefox && oldValue === newValue) { return; }

				qs(`.tabButton[data-forum="${ newValue }"]`).click();
			}
		});
	});
})();
