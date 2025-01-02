(async () => {
	const supportsStorageLocalGetKeys = typeof chrome.storage.local.getKeys === "function";
	const supportsStorageLocalGetBytesInUse = typeof chrome.storage.local.getBytesInUse === "function";
	const DATA_SIZE_UNITS = ["B", "KB", "MB", "GB"];
	const [origins, gifPrefixes] = await chrome.runtime.sendMessage({
		type: "getVariables",
		variables: ["origins", "gifPrefixes"],
	});

	checkPermission();
	qs("#requestPermission>button").addEventListener("click", requestPermission);
	const settingElements = qsa("[data-setting-name]");
	const settingKeys = Array.from(settingElements, elem => elem.getAttribute("data-setting-name"));
	chrome.storage.local.get(["theme", ...settingKeys]).then(initSettings);
	qs("#resetGifs").addEventListener("click", resetGifs);
	qs("#theme").addEventListener("change", setTheme);
	calculateGifDataInUse();

	function checkPermission() {
		chrome.permissions.contains({ origins }).then(setRequestPermissionVisibility);
	}

	function requestPermission() {
		chrome.permissions.request({ origins }).then(setRequestPermissionVisibility);
	}

	function setRequestPermissionVisibility(granted) {
		qs("#requestPermission").style.display = granted ? "none" : "flex";
	}

	function setTheme(event) {
		chrome.storage.local.set({ theme: event.currentTarget.value });
	}

	function initSettings(settings) {
		qs("#theme").value = settings["theme"];

		settingElements.forEach((elem, i) => {
			elem.checked = settings[settingKeys[i]];
			elem.addEventListener("change", settingChanged);
		});
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
		// https://github.com/J3ekir/The-Blocker/issues/4
		return supportsStorageLocalGetKeys
			? await chrome.storage.local.getKeys().then(keys => keys.filter(isGifEntry))
			: Object.keys(await chrome.storage.local.get()).filter(isGifEntry);
	}

	function isGifEntry(value) {
		return gifPrefixes.some(prefix => value.startsWith(prefix));
	}

	async function calculateGifDataInUse() {
		const gifKeys = await getGifKeys();

		// https://github.com/J3ekir/The-Blocker/issues/3
		// https://bugzil.la/1385832#c20
		supportsStorageLocalGetBytesInUse
			? chrome.storage.local.getBytesInUse(gifKeys).then(updateGifDataInUse)
			: updateGifDataInUse(new TextEncoder().encode(gifKeys.map(key => `${ key }${ JSON.stringify(settings[key]) }`).join("")).length);
	}

	function updateGifDataInUse(bytes) {
		let unitIndex = 0;

		while (bytes >= 1e3 && unitIndex < DATA_SIZE_UNITS.length - 1) {
			bytes /= 1e3;
			++unitIndex;
		}

		qs("#gifDataInUse").textContent = `${ bytes.toLocaleString(undefined, { maximumSignificantDigits: 3 }) } ${ DATA_SIZE_UNITS[unitIndex] }`;
	}

	chrome.storage.local.onChanged.addListener(changes => {
		let callCalculateGifDataInUse = false;

		Object.entries(changes).forEach(([key, { oldValue, newValue }]) => {
			if (key === "theme") {
				// https://github.com/J3ekir/The-Blocker/issues/5
				if (isFirefox && oldValue === newValue) { return; }

				qs("#theme").value = newValue;
			}
			if (settingKeys.includes(key)) {
				// https://github.com/J3ekir/The-Blocker/issues/5
				if (isFirefox && oldValue === newValue) { return; }

				qs(`[data-setting-name="${ key }"]`).checked = newValue;
			}
			if (isGifEntry(key)) {
				// https://github.com/J3ekir/The-Blocker/issues/5
				if (isFirefox && oldValue.t === newValue.t) { return; }

				callCalculateGifDataInUse = true;
			}
		});

		if (callCalculateGifDataInUse) {
			calculateGifDataInUse();
		}
	});
})();
