const extensionName = chrome.runtime.getManifest().name;

chrome.storage.local.get(["theme", "lastPane"]).then(settings => {
	document.documentElement.setAttribute("theme", settings["theme"]);

	loadPane(window.location.hash.substring(1) || settings["lastPane"]);
});

chrome.storage.local.onChanged.addListener(changes => {
	const { theme } = changes;

	if (typeof theme !== "undefined") {
		storageChangedTheme(theme);
	}
});

function storageChangedTheme({ oldValue, newValue }) {
	// https://github.com/J3ekir/The-Blocker/issues/5
	if (isFirefox && oldValue === newValue) { return; }

	document.documentElement.setAttribute("theme", newValue);
}

qsa(".tab-button").forEach(elem => {
	elem.addEventListener("click", event => loadPane(event.currentTarget.getAttribute("data-pane")));
});

window.addEventListener("message", event => {
	switch (event.data["type"]) {
		case "tab":
			setSelectedTab();
	}
});

chrome.runtime.getPlatformInfo().then(({ os }) => {
	const ctrlKey = os === "mac" ? "metaKey" : "ctrlKey";

	document.addEventListener("keydown", event => {
		if (event[ctrlKey] && event.key.toLowerCase() === "s") {
			event.preventDefault();

			const applyButton = qs(qs("#iframe").contentDocument, "#apply-button");
			if (applyButton && !applyButton.disabled) {
				applyButton.click();
			}
		}
	});
});

function loadPane(pane) {
	window.paneToLoad = pane;

	if (qs(".tab-button.active")?.getAttribute("data-pane") === pane) { return; }

	qs("#iframe").contentWindow.location.replace(pane.replace(/([^-]*)-?.*(.html)/, "$1$2"));

	switch (qs(".tab-button.active")?.getAttribute("data-pane")?.replace(/([^-]*)-?.*(.html)/, "$1$2")) {
		case "filters.html":
		case "notes.html":
			return;
	}

	setSelectedTab();
}

function setSelectedTab() {
	const tabButton = qs(`[data-pane="${ window.paneToLoad }"]`);
	window.location.hash = window.paneToLoad;
	qsa(".tab-button.active").forEach(elem => elem.classList.remove("active"));
	tabButton.classList.add("active");
	tabButton.scrollIntoView();
	qs("#iframe").contentWindow.addEventListener("beforeunload", event => {
		chrome.storage.local.set({
			lastPane: window.paneToLoad,
		});
	});

	document.title = `${ tabButton.textContent } - ${ extensionName }`;
	document.documentElement.dataset.forum = tabButton.dataset.pane.replace(/[^-]*-?(.*?)\.html/, "$1");
}
