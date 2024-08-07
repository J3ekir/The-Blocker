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
            elem.addEventListener("click", event => {
                const index = Array.from(event.currentTarget.parentElement.children).indexOf(event.currentTarget);
                qsa(":is([role='tab'],[role='tabpanel']).is-active").forEach(elem => elem.classList.remove("is-active"));
                qsa(`:is([role='tab'],[role='tabpanel']):nth-child(${ index + 1 })`).forEach(elem => elem.classList.add("is-active"));
            });
        });

        if (COMBINE_TAB_PANES) {
            qsa("[role='tabpanel']:nth-child(2)").forEach(elem => elem.classList.add("is-active"));

            qs("[role='tab']:nth-child(1)").addEventListener("click", () => {
                qsa("[role='tabpanel']:nth-child(2)").forEach(elem => elem.classList.add("is-active"));
            });
        }

        if (ADD_BOTTOM_TAB_BUTTONS) {
            const bottomTabs = tabs.cloneNode(true);
            const bottomButtons = bottomTabs.firstElementChild.firstElementChild.children;

            Array.from(bottomButtons).forEach(elem => {
                elem.addEventListener("click", event => {
                    const index = Array.from(event.currentTarget.parentElement.children).indexOf(event.currentTarget);
                    qsa(":is([role='tab'],[role='tabpanel']).is-active").forEach(elem => elem.classList.remove("is-active"));
                    qsa(`:is([role='tab'],[role='tabpanel']):nth-child(${ index + 1 })`).forEach(elem => elem.classList.add("is-active"));

                    tabs.scrollIntoView();
                });
            });

            tabs.parentElement.appendChild(bottomTabs);
        }
    });

    function waitForElement(selector) {
        return new Promise(resolve => {
            if (document.querySelector(selector)) {
                return resolve(document.querySelector(selector));
            }
            new MutationObserver((_, observer) => {
                if (document.querySelector(selector)) {
                    observer.disconnect();
                    return resolve(document.querySelector(selector));
                }
            })
                .observe(document, { childList: true, subtree: true });
        });
    }
})();
