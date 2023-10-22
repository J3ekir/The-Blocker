var buttons;
var cloneButtons;
var cloneMenuHandler;
var result;
var tabPanes;
var tabWrapper;


init();


async function init() {
    result = await storage.get(["settingsCombineWidgetTabs", "settingsBottomWidget"]);
    tabWrapper = qs(".tab-wrapper.widget-group");

    if (result["settingsCombineWidgetTabs"]) {
        tabPanes = qs("ul.tabPanes");
        dom.cl.add(tabPanes.children[1], "is-active");
    }

    if (result["settingsBottomWidget"]) {
        buttons = tabWrapper.firstElementChild.firstElementChild.firstElementChild.children;
        cloneMenuHandler = tabWrapper.firstElementChild.cloneNode(true);
        cloneButtons = cloneMenuHandler.firstElementChild.firstElementChild.children;
        cloneMenuHandler.id = "cloneMenuHandler";

        for (let i = 0; i < cloneButtons.length; ++i) {
            cloneButtons[i].removeAttribute("href");

            cloneButtons[i].addEventListener("click", (event) => {
                buttons[i].click();
                buttons[i].scrollIntoView();
                clearIsActive();
                setIsActive();
            });
        }

        tabWrapper.appendChild(cloneMenuHandler);
    }

    if (result["settingsCombineWidgetTabs"] || result["settingsBottomWidget"]) {
        observe();
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
    const targetNode = tabWrapper.firstElementChild.firstElementChild.firstElementChild;
    const config = { attributes: true, subtree: true };
    const callback = async (mutationList, observer) => {
        if (result["settingsCombineWidgetTabs"]) {
            if (dom.cl.has(tabWrapper.firstElementChild.firstElementChild.firstElementChild.firstElementChild, "is-active")) {
                dom.cl.add(tabPanes.children[1], "is-active");
            }
        }

        if (result["settingsBottomWidget"]) {
            clearIsActive();
            setIsActive();
        }
    };
    const observer = new MutationObserver(callback);
    if (targetNode) {
        observer.observe(targetNode, config);
    }
    //observer.disconnect();
}
