(async () => {
	const supportsStorageLocalGetKeys = typeof chrome.storage.local.getKeys === "function";
	const supportsStorageLocalGetBytesInUse = typeof chrome.storage.local.getBytesInUse === "function";
	const DATA_SIZE_UNITS = ["B", "KB", "MB", "GB"];
	const [origins, gifPrefixes] = await chrome.runtime.sendMessage({
		type: "getVariables",
		variables: ["origins", "gifPrefixes"],
	});
	const animationPolicyConfig = {
		chrome: {
			// https://source.chromium.org/chromium/chromium/src/+/main:extensions/common/api/types.json;drc=636054fd874a8e9535b4db695c8ea15636200e52;l=19
			set: chrome?.accessibilityFeatures?.animationPolicy?.set.bind(chrome?.accessibilityFeatures?.animationPolicy),
			get: chrome?.accessibilityFeatures?.animationPolicy?.get.bind(chrome?.accessibilityFeatures?.animationPolicy),
			onChange: chrome?.accessibilityFeatures?.animationPolicy?.onChange?.addListener.bind(chrome?.accessibilityFeatures?.animationPolicy?.onChange),
			// https://source.chromium.org/chromium/chromium/src/+/main:chrome/common/extensions/api/accessibility_features.json;drc=4a8573cb240df29b0e4d9820303538fb28e31d84;l=100
			allowed: "allowed",
			once: "once",
			none: "none",
		},
		firefox: {
			// https://searchfox.org/mozilla-central/rev/ae658df8b2e28234092cec19d3f07e32e119924e/toolkit/components/extensions/ExtensionSettingsStore.sys.mjs#588
			set: chrome?.browserSettings?.imageAnimationBehavior?.set.bind(chrome?.browserSettings?.imageAnimationBehavior),
			get: chrome?.browserSettings?.imageAnimationBehavior?.get.bind(chrome?.browserSettings?.imageAnimationBehavior),
			onChange: chrome?.browserSettings?.imageAnimationBehavior?.onChange?.addListener.bind(chrome?.browserSettings?.imageAnimationBehavior),
			// https://searchfox.org/mozilla-central/rev/ae658df8b2e28234092cec19d3f07e32e119924e/toolkit/components/extensions/schemas/browser_settings.json#24
			allowed: "normal",
			normal: "allowed",
			once: "once",
			none: "none",
		},
		levelOfControl: [
			"controllable_by_this_extension",
			"controlled_by_this_extension",
		],
	};
	const animationPolicy = animationPolicyConfig[isFirefox ? "firefox" : "chrome"];

	checkPermission();
	qs("#requestPermission>button").addEventListener("click", requestPermission);
	const settingElements = qsa("[data-setting-name]");
	const settingKeys = Array.from(settingElements, elem => elem.getAttribute("data-setting-name"));
	chrome.storage.local.get(["theme", ...settingKeys]).then(initSettings);
	animationPolicyValue();
	qs("#resetGifs").addEventListener("click", resetGifs);
	qs("#theme").addEventListener("change", setTheme);
	qs("#animationPolicy").addEventListener("change", animationPolicyChanged);
	qs("#animationPolicyHint>b").addEventListener("click", hideAnimationPolicyHint);
	animationPolicy.onChange(animationPolicyValue);
	calculateGifDataInUse();

	async function animationPolicyValue(policyInfo) {
		if (!policyInfo) {
			policyInfo = await animationPolicy.get({});
		}

		qs("#animationPolicy").value = animationPolicy[policyInfo.value];
		chrome.storage.local.set({ animationPolicy: animationPolicy[policyInfo.value] });
		animationPolicyVisibility(policyInfo.levelOfControl);
	}

	function animationPolicyVisibility(levelOfControl) {
		chrome.storage.local.get("hideAnimationPolicyHint").then(({ hideAnimationPolicyHint }) => {
			const force = hideAnimationPolicyHint || animationPolicyConfig.levelOfControl.includes(levelOfControl);
			qs("#animationPolicyHint").classList.toggle("hidden", force);
		});
	}

	function animationPolicyChanged(event) {
		animationPolicy.get({}).then(({ levelOfControl, value }) => {
			if (
				animationPolicyConfig.levelOfControl.includes(levelOfControl) &&
				value !== animationPolicy[event.target.value]
			) {
				animationPolicy.set({
					value: animationPolicy[event.target.value],
				});
			}
		});
	}

	function hideAnimationPolicyHint(event) {
		event.currentTarget.parentElement.classList.add("hidden");
		chrome.storage.local.set({ hideAnimationPolicyHint: true });
	}

	function checkPermission() {
		chrome.permissions.contains({ origins }).then(setRequestPermissionVisibility);
	}

	function requestPermission() {
		chrome.permissions.request({ origins }).then(setRequestPermissionVisibility);
	}

	function setRequestPermissionVisibility(granted) {
		qs("#requestPermission").classList.toggle("hidden", granted);
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
		if (confirm("Tüm GIF verilerini sıfırlamak istediğinizden emin misiniz?")) {
			const gifKeys = await getGifKeys();
			chrome.storage.local.remove(gifKeys);
		}
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
		const { theme, ...rest } = changes;
		let callCalculateGifDataInUse = false;

		if (typeof theme !== "undefined") {
			storageChangedTheme(theme);
		}

		Object.keys(rest).forEach(key => {
			if (settingKeys.includes(key)) {
				storageChangedSetting(key, rest[key]);
			}

			if (!callCalculateGifDataInUse && isGifEntry(key)) {
				callCalculateGifDataInUse = true;
			}
		});

		if (callCalculateGifDataInUse) {
			calculateGifDataInUse();
		}
	});

	function storageChangedTheme({ oldValue, newValue }) {
		if (isFirefox && oldValue === newValue) { return; }

		qs("#theme").value = newValue;
	}

	function storageChangedSetting(key, { oldValue, newValue }) {
		// https://github.com/J3ekir/The-Blocker/issues/5
		if (isFirefox && oldValue === newValue) { return; }

		qs(`[data-setting-name="${ key }"]`).checked = newValue;
	}
})();
