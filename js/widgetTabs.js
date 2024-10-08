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
    });

    function activateTab(event) {
        const tab = event.currentTarget;
        const index = Array.from(tab.parentElement.children).indexOf(tab);
        qsa(":is([role='tab'],[role='tabpanel']).is-active").forEach(elem => elem.classList.remove("is-active"));
        qsa(`:is([role='tab'],[role='tabpanel']):nth-child(${ index + 1 })`).forEach(elem => elem.classList.add("is-active"));

        const tabs = tab.closest("[role='tablist']");
        if (tabs.classList.contains("bottom-tabs")) {
            tabs.parentElement.firstElementChild.scrollIntoView();
        }
    }

    function combineTabPanes() {
        qs("[role='tabpanel']:nth-child(2)").classList.add("is-active");

        qs("[role='tab']:first-child").addEventListener("click", event => {
            qsa("[role='tabpanel']:nth-child(2)").forEach(elem => elem.classList.add("is-active"));
        });
    }

    function addBottomTabButtons() {
        const tabs = qs("[role='tablist']");
        const bottomTabs = tabs.cloneNode(true);
        bottomTabs.classList.add("bottom-tabs");

        bottomTabs.querySelectorAll("[role='tab']").forEach(elem => {
            elem.addEventListener("click", activateTab);
        });

        tabs.parentElement.append(bottomTabs);

        chrome.runtime.sendMessage({
            type: "addBottomTabButtons",
            styleId: /'style_id':(\d+)/.exec(document.querySelector('script[src^="https://www.googletagmanager.com/gtag/js"]+script').textContent)[1],
            forum,
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
