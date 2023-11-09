var buttons;
var cloneButtons;
var cloneMenuHandler;
var tabPanes;
var tabWrapper;
var borderColors = {
    "#1e1e1e": "#414141",   // default dark
    "#185886": "#e7e7e7",   // default light
    "#e1e8f8": "#424650",   // dimension dark
    "#323940": "#e8e8e8",   // dimension light
};


init();


async function init() {
    await storage.init();

    if (storage.settings["settingsCombineWidgetTabs"] || storage.settings["settingsBottomWidget"]) {
        if (storage.settings["settingsCombineWidgetTabs"]) {
            chrome.runtime.sendMessage({
                type: "combineWidgetTabs",
            });

            waitForElementToExist(".tab-wrapper.widget-group>:first-child>:first-child>:first-child>:first-child").then(elem => {
                dom.text(elem, i18n.get("tabHandlerCombinedTabName"));
            });
        }

        if (storage.settings["settingsBottomWidget"]) {
            chrome.runtime.sendMessage({
                type: "bottomWidget",
            });
        }

        waitForElementToExist("ul.tabPanes>li:nth-child(6)").then(elem => {
            if (storage.settings["settingsBottomWidget"]) {
                chrome.runtime.sendMessage({
                    type: "injectCSSString",
                    CSS: `#cloneMenuHandler{border-top-color:${ borderColors[dom.attr(`[name="theme-color"]`, "content")] }!important;}`,
                });
            }

            tabWrapper = qs(".tab-wrapper.widget-group");
            buttons = qs(".tab-wrapper.widget-group>:first-child>:first-child>:first-child").children;
            tabPanes = qs(".tab-wrapper.widget-group>:last-child").children;

            if (storage.settings["settingsCombineWidgetTabs"]) {
                dom.cl.add(tabPanes[1], "is-active");
            }

            if (storage.settings["settingsBottomWidget"]) {
                cloneMenuHandler = dom.clone(tabWrapper.firstElementChild);
                cloneButtons = cloneMenuHandler.firstElementChild.firstElementChild.children;
                cloneMenuHandler.id = "cloneMenuHandler";

                dom.attr([cloneMenuHandler, cloneMenuHandler.firstElementChild], "data-xf-init", null);

                for (let i = 0; i < cloneButtons.length; ++i) {
                    dom.attr(cloneButtons[i], "href", null);

                    cloneButtons[i].addEventListener("click", event => {
                        buttons[i].click();
                        buttons[i].scrollIntoView();
                        clearIsActive();
                        setIsActive();
                    });
                }

                tabWrapper.appendChild(cloneMenuHandler);
            }

            observe();
        });
    }
}

function combineTabs() {
    if (dom.cl.has(tabPanes[0], "is-active")) {
        dom.cl.add(tabPanes[1], "is-active");
    }
}

function clearIsActive() {
    for (const child of cloneButtons) {
        dom.cl.remove(child, "is-active");
    }
}

function setIsActive() {
    for (let i = 0; i < buttons.length; ++i) {
        if (dom.cl.has(buttons[i], "is-active")) {
            dom.cl.add(cloneButtons[i], "is-active");
        }
    }
}

function observe() {
    const targetNode = qs("span.hScroller-scroll");
    new MutationObserver(async (mutationList, observer) => {
        if (storage.settings["settingsCombineWidgetTabs"]) {
            combineTabs();
        }

        if (storage.settings["settingsBottomWidget"]) {
            clearIsActive();
            setIsActive();
        }
    })
        .observe(targetNode, { attributes: true, subtree: true });
}

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
