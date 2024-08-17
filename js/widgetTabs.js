(async () => {
    const settings = await chrome.storage.local.get([
        "settingCombineTabPanes",
        "settingAddBottomTabButtons",
    ]);

    const COMBINE_TAB_PANES = settings["settingCombineTabPanes"];
    const ADD_BOTTOM_TAB_BUTTONS = settings["settingAddBottomTabButtons"];

    if (!COMBINE_TAB_PANES && !ADD_BOTTOM_TAB_BUTTONS) { return; }

    if (COMBINE_TAB_PANES) {
        chrome.runtime.sendMessage({
            type: "combineTabPanes",
        });

        waitForElement(".tabs-tab").then(elem => {
            elem.textContent = STR.combinedTabName;
        });
    }

    waitForElement(".p-body-pageContent>.tab-wrapper.widget-group:first-child+.block").then(elem => {
        qsa(".tabs").forEach(elem => elem.removeAttribute("data-xf-init"));
        qsa("[role='tab']").forEach(elem => elem.removeAttribute("href"));

        const tabs = qs(".tabs");

        qsa(tabs, "[role='tab']").forEach(elem => {
            elem.addEventListener("click", activateTab);
        });

        if (COMBINE_TAB_PANES) {
            combineTabPanes();
        }

        if (ADD_BOTTOM_TAB_BUTTONS) {
            const bottomTabs = tabs.cloneNode(true);
            const bottomButtons = bottomTabs.firstElementChild.firstElementChild.children;

            Array.from(bottomButtons).forEach(elem => {
                elem.addEventListener("click", activateTab);
            });

            tabs.parentElement.appendChild(bottomTabs);
        }
    });

    function activateTab(event) {
        const tab = event.currentTarget;
        const index = Array.from(tab.parentElement.children).indexOf(tab);
        qsa(":is([role='tab'],[role='tabpanel']).is-active").forEach(elem => elem.classList.remove("is-active"));
        qsa(`:is([role='tab'],[role='tabpanel']):nth-child(${ index + 1 })`).forEach(elem => elem.classList.add("is-active"));
    }

    function combineTabPanes() {
        qs("[role='tabpanel']:nth-child(2)").classList.add("is-active");

        qs("[role='tab']:first-child").addEventListener("click", event => {
            qsa("[role='tabpanel']:nth-child(2)").forEach(elem => elem.classList.add("is-active"));
        });
    }

    function waitForElement(selector) {
        return new Promise(resolve => {
            const elem = document.querySelector(selector);
            if (elem) { return resolve(elem); }
            new MutationObserver((_, observer) => {
                const elem = document.querySelector(selector);
                if (elem) {
                    observer.disconnect();
                    return resolve(elem);
                }
            })
                .observe(document, { childList: true, subtree: true });
        });
    }
})();
