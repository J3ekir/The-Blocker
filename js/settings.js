(async () => {
	const [origins, gifPrefixes] = await chrome.runtime.sendMessage({
		type: "getVariables",
		variables: ["origins", "gifPrefixes"],
	});

	checkPermission();
	qs("#requestPermission>button").addEventListener("click", requestPermission);
	qs("#resetGifs").addEventListener("click", resetGifs);
	qs("#theme").addEventListener("change", event => {
		chrome.storage.local.set({ theme: event.currentTarget.value });
	});

	const settingElements = qsa("[data-setting-name]");
	const settingKeys = Array.from(settingElements, elem => elem.getAttribute("data-setting-name"));
	chrome.storage.local.get(["theme", ...settingKeys]).then(settings => {
		qs("#theme").value = settings["theme"];

		settingElements.forEach((elem, i) => {
			elem.checked = settings[settingKeys[i]];
			elem.addEventListener("change", settingChanged);
		});
	});

	function checkPermission() {
		chrome.permissions.contains({ origins }).then(granted => {
			setRequestPermissionVisibility(granted);
		});
	}

	function requestPermission() {
		chrome.permissions.request({ origins }).then(granted => {
			setRequestPermissionVisibility(granted);
		});
	}

	function setRequestPermissionVisibility(granted) {
		qs("#requestPermission").style.display = granted ? "none" : "flex";
	}

	function settingChanged(event) {
		const settingName = event.currentTarget.getAttribute("data-setting-name");
		chrome.storage.local.set({
			[settingName]: event.currentTarget.checked,
		});
	}

	async function resetGifs() {
		const gifKeys = await getGifKeys();
		chrome.storage.local.remove(gifKeys);
	}

	async function getGifKeys() {
		const settings = await chrome.storage.local.get();
		return Object.keys(settings).filter(isGifEntry);
	}

	function isGifEntry(value) {
		return gifPrefixes.some(prefix => value.startsWith(prefix));
	}

	chrome.storage.onChanged.addListener(changes => {
		Object.entries(changes).forEach(([key, { oldValue, newValue }]) => {
			if (key === "theme") {
				qs("#theme").value = newValue;
			}
			if (settingKeys.includes(key)) {
				qs(`[data-setting-name="${ key }"]`).checked = newValue;
			}
		});
	});
})();
