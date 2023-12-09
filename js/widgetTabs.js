(async () => {
    const STR = new Proxy({
        LANG: dom.attr("html", "lang"),
        "en-US": {
            combinedTabName: "New threads and messages",
        },
        "tr-TR": {
            combinedTabName: "Yeni konular ve mesajlar",
        },
    }, {
        get(target, prop) {
            if (!target.LANG) {
                return null;
            }

            return typeof target[target.LANG][prop] === "string"
                ? target[target.LANG][prop]
                : target[target.LANG][prop].bind(target);
        },
    });


    var settings = await chrome.storage.local.get([
        "settingCombineTabPanes",
        "settingAddBottomTabButtons",
    ]);

    const COMBINE_TAB_PANES = settings["settingCombineTabPanes"];
    const ADD_BOTTOM_TAB_BUTTONS = settings["settingAddBottomTabButtons"];

    if (!COMBINE_TAB_PANES && !ADD_BOTTOM_TAB_BUTTONS) {
        return;
    }

    if (COMBINE_TAB_PANES) {
        chrome.runtime.sendMessage({
            type: "combineTabPanes",
        });

        waitForElementToExist(".tabs-tab").then(elem => {
            dom.text(elem, STR.combinedTabName);
        });
    }

    waitForElementToExist("[role='tabpanel']:nth-child(6)").then(elem => {
        dom.attr(".tabs", "data-xf-init", null);
        dom.attr("[role='tab']", "href", null);

        var tabs = qs(".tabs");

        qsa(tabs, "[role='tab']").forEach(elem => {
            elem.addEventListener("click", event => {
                var index = Array.from(event.currentTarget.parentElement.children).indexOf(event.currentTarget);
                dom.cl.remove(":is([role='tab'],[role='tabpanel']).is-active", "is-active");
                dom.cl.add(`:is([role='tab'],[role='tabpanel']):nth-child(${ index + 1 })`, "is-active");
            });
        });

        if (COMBINE_TAB_PANES) {
            dom.cl.add("[role='tabpanel']:nth-child(2)", "is-active");

            qs("[role='tab']:nth-child(1)").addEventListener("click", () => {
                dom.cl.add("[role='tabpanel']:nth-child(2)", "is-active");
            });
        }

        if (ADD_BOTTOM_TAB_BUTTONS) {
            var bottomTabs = dom.clone(tabs);
            var bottomButtons = bottomTabs.firstElementChild.firstElementChild.children;

            Array.from(bottomButtons).forEach(elem => {
                elem.addEventListener("click", event => {
                    var index = Array.from(event.currentTarget.parentElement.children).indexOf(event.currentTarget);
                    dom.cl.remove(":is([role='tab'],[role='tabpanel']).is-active", "is-active");
                    dom.cl.add(`:is([role='tab'],[role='tabpanel']):nth-child(${ index + 1 })`, "is-active");

                    tabs.scrollIntoView();
                });
            });

            tabs.parentElement.appendChild(bottomTabs);
        }
    });

    function waitForElementToExist(selector) {
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
