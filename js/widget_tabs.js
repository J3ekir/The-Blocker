(async () => {
	if (window.location.pathname !== "/sosyal/") { return; }

	const settings = await chrome.storage.local.get([
		"settingCombineTabPanes",
		"settingAddBottomTabButtons",
	]);

	const COMBINE_TAB_PANES = settings["settingCombineTabPanes"];
	const ADD_BOTTOM_TAB_BUTTONS = settings["settingAddBottomTabButtons"];

	if (!COMBINE_TAB_PANES && !ADD_BOTTOM_TAB_BUTTONS) { return; }

	if (COMBINE_TAB_PANES) {
		waitForElement("head").then(hideSecondTab);
		waitForElement(".tabs-tab:has(+.tabs-tab)").then(updateTabName);
	}

	waitForElement("head>link[href^='/sosyal/css.php']").then(addStyleId);
	waitForElement(".p-body-pageContent>.tab-wrapper.widget-group:first-child+div").then(initializaTabs);

	function addStyleId(elem) {
		document.documentElement.setAttribute("data-style-id", /&s=(\d+)/.exec(elem.href)[1]);
	}

	function initializaTabs() {
		qs(".tabs").removeAttribute("data-xf-init");

		qsa("[role='tab']").forEach(elem => {
			elem.removeAttribute("href");
			elem.addEventListener("click", activateTab);
		});

		if (COMBINE_TAB_PANES) {
			combineTabPanes();
		}

		if (ADD_BOTTOM_TAB_BUTTONS) {
			addBottomTabButtons();
		}
	}

	function activateTab(event) {
		const tab = event.currentTarget;
		const index = [...tab.parentElement.children].indexOf(tab);
		qsa(":is([role='tab'],[role='tabpanel']).is-active").forEach(elem => elem.classList.remove("is-active"));
		qsa(`:is([role='tab'],[role='tabpanel']):nth-child(${ index + 1 })`).forEach(elem => elem.classList.add("is-active"));

		const tabs = tab.closest("[role='tablist']");
		if (tabs.classList.contains("bottom-tabs")) {
			tabs.parentElement.firstElementChild.scrollIntoView();
		}
	}

	function combineTabPanes() {
		qs("[role='tabpanel']:nth-child(2)").classList.add("is-active", "tb-combine-tab-panes");

		qs("[role='tab']:first-child").addEventListener("click", event => {
			qsa("[role='tabpanel']:nth-child(2)").forEach(elem => elem.classList.add("is-active"));
		});
	}

	function addBottomTabButtons() {
		const tabs = qs("[role='tablist']");
		const bottomTabs = tabs.cloneNode(true);
		bottomTabs.classList.add("bottom-tabs");
		bottomTabs.setAttribute("style-id", document.documentElement.dataset.styleId || /&s=(\d+)/.exec(qs("head>link[href^='/sosyal/css.php']").href)[1]);

		qsa(bottomTabs, "[role='tab']").forEach(elem => {
			elem.addEventListener("click", activateTab);
		});

		tabs.parentElement.append(bottomTabs);
	}

	function hideSecondTab(head) {
		const elem = document.createElement("style");
		elem.textContent = ".tab-wrapper.widget-group .tabs-tab:nth-child(2){display:none!important;}";
		head.append(elem);
	}

	function updateTabName(elem) {
		const nextStr = elem.nextElementSibling.textContent;
		const spaceIndex = nextStr.indexOf(" ");
		const nextTabName = nextStr.substring(spaceIndex);
		elem.textContent += STR.combinedTabConjunction + nextTabName;
	}
})();
