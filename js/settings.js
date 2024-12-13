(async () => {
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
		const settings = await chrome.storage.local.get();
		return Object.keys(settings).filter(isGifEntry);
	}

	function isGifEntry(value) {
		return gifPrefixes.some(prefix => value.startsWith(prefix));
	}

	async function calculateGifDataInUse() {
		const gifKeys = await getGifKeys();

		// https://bugzilla.mozilla.org/show_bug.cgi?id=1385832#c20
		if (typeof chrome.storage.local.getBytesInUse !== "function") {
			const bytes = new TextEncoder().encode(gifKeys.map(key => `${ key }${ JSON.stringify(settings[key]) }`).join("")).length;
			updateGifDataInUse(bytes);
		}
		else {
			chrome.storage.local.getBytesInUse(gifKeys).then(updateGifDataInUse);
		}
	}

	function updateGifDataInUse(bytes) {
		let unit;

		if (bytes < 1e3) {
			unit = "B";
		}
		else if (bytes < 1e6) {
			bytes /= 1e3;
			unit = "KB";
		}
		else if (bytes < 1e9) {
			bytes /= 1e6;
			unit = "MB";
		}
		else {
			bytes /= 1e9;
			unit = "GB";
		}

		qs("#gifDataInUse").textContent = `${ bytes.toLocaleString(undefined, { maximumSignificantDigits: 3 }) } ${ unit }`;
	}

	chrome.storage.onChanged.addListener(changes => {
		let callCalculateGifDataInUse = false;

		Object.entries(changes).forEach(([key, { oldValue, newValue }]) => {
			if (key === "theme") {
				qs("#theme").value = newValue;
			}
			if (settingKeys.includes(key)) {
				qs(`[data-setting-name="${ key }"]`).checked = newValue;
			}
			if (isGifEntry(key)) {
				callCalculateGifDataInUse = true;
			}
		});

		if (callCalculateGifDataInUse) {
			calculateGifDataInUse();
		}
	});
})();
