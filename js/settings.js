(async () => {
	const [origins] = await chrome.runtime.sendMessage({
		type: "getVariables",
		variables: ["origins"],
	});

	checkPermission();
	qs("#requestPermission>button").addEventListener("click", requestPermission);

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
