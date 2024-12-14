const isMac = window.navigator.userAgent.includes("Mac OS");

chrome.storage.local.get(["theme", "lastPane"]).then(settings => {
	document.documentElement.setAttribute("theme", settings["theme"]);

	loadPane(window.location.hash.substring(1) || settings["lastPane"]);
});

chrome.storage.onChanged.addListener(changes => {
	Object.entries(changes).forEach(([key, { oldValue, newValue }]) => {
		if (key === "theme") {
			document.documentElement.setAttribute(key, newValue);
		}
	});
});

qsa(".tabButton").forEach(elem => {
	elem.addEventListener("click", event => loadPane(event.currentTarget.getAttribute("data-pane")));
});

window.addEventListener("message", function (event) {
	switch (event.data["type"]) {
		case "tab":
			setSelectedTab();
	}
});

document.addEventListener("keydown", event => {
	const isCtrl = isMac ? event.metaKey : event.ctrlKey;
	if (isCtrl && event.key.toLowerCase() === "s") {
		event.preventDefault();

		const applyButton = qs(qs("#iframe").contentDocument, "#applyButton");
		if (applyButton && !applyButton.disabled) {
			applyButton.click();
		}
	}
});

function loadPane(pane) {
	window.paneToLoad = pane;

	if (qs(".tabButton.active")?.getAttribute("data-pane") === pane) { return; }

	qs("#iframe").contentWindow.location.replace(pane.replace(/([^-]*)-?.*(.html)/, "$1$2"));

	switch (qs(".tabButton.active")?.getAttribute("data-pane")?.replace(/([^-]*)-?.*(.html)/, "$1$2")) {
		case "filters.html":
		case "notes.html":
			return;
	}

	setSelectedTab();
}

function setSelectedTab() {
	const tabButton = qs(`[data-pane="${ window.paneToLoad }"]`);
	window.location.hash = window.paneToLoad;
	qsa(".tabButton.active").forEach(elem => elem.classList.remove("active"));
	tabButton.classList.add("active");
	tabButton.scrollIntoView();
	chrome.storage.local.set({
		lastPane: window.paneToLoad,
	});

	document.title = tabButton.textContent;
	document.documentElement.dataset.forum = tabButton.dataset.pane.replace(/[^-]*-?(.*?)\.html/, "$1");
}
