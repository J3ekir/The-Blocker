(async () => {
	if (window.location.pathname !== "/sosyal/") { return; }

	const settings = await chrome.storage.local.get("settingCombineTabPanes");

	if (!settings["settingCombineTabPanes"]) { return; }

	waitForElement("head").then(hideSecondTab);
	waitForElement(".tabs-tab:has(+.tabs-tab)").then(updateTabName);
	waitForElement(".p-body-pageContent>.tab-wrapper.widget-group:first-child+*").then(initializaTabs);

	function initializaTabs() {
		qs(".tabs").removeAttribute("data-xf-init");

		qsa("[role='tab']").forEach(elem => {
			elem.removeAttribute("href");
			elem.addEventListener("click", activateTab);
		});

		combineTabPanes();
	}

	function activateTab(event) {
		const tab = event.currentTarget;
		const index = [...tab.parentElement.children].indexOf(tab);
		qsa(":is([role='tab'],[role='tabpanel']).is-active").forEach(elem => elem.classList.remove("is-active"));
		qsa(`:is([role='tab'],[role='tabpanel']):nth-child(${ index + 1 })`).forEach(elem => elem.classList.add("is-active"));

		const tabs = tab.closest("[role='tablist']");
	}

	function combineTabPanes() {
		qs("[role='tabpanel']:nth-child(2)").classList.add("is-active", "tb-combine-tab-panes");

		qs("[role='tab']:first-child").addEventListener("click", event => {
			qsa("[role='tabpanel']:nth-child(2)").forEach(elem => elem.classList.add("is-active"));
		});
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
