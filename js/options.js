/* Heavily inspired by Raymond Hill's uBlock Origin */

chrome.storage.local.get("lastPane").then(settings => {
    loadPane(settings["lastPane"]);
});

chrome.storage.local.get("lastPane").then(settings => {
    window.location.hash === ""
        ? loadPane(settings["lastPane"])
        : loadPane(window.location.hash.substring(1));
});

qsa(".tabButton").forEach(elem => {
    elem.addEventListener("click", event => loadPane(dom.attr(event.target, "data-pane")));
});

window.addEventListener("message", function (event) {
    switch (event.data["type"]) {
        case "tab":
            setSelectedTab();
    }
});

document.addEventListener("keydown", event => {
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "s") {
        event.preventDefault();

        const applyButton = qs("#iframe").contentWindow.document.querySelector("#applyButton");
        if (applyButton && !applyButton.disabled) {
            applyButton.click();
        }
    }
});

function loadPane(pane) {
    window.paneToLoad = pane;

    if (dom.attr(".tabButton.active", "data-pane") === pane) {
        return;
    }

    qs("#iframe").contentWindow.location.replace(pane);

    switch (dom.attr(".tabButton.active", "data-pane")) {
        case "filters.html":
        case "notes.html":
            return;
    }

    setSelectedTab();
}

function setSelectedTab() {
    const tabButton = qs(`[data-pane="${ window.paneToLoad }"]`);
    window.location.replace(`#${ window.paneToLoad }`);
    dom.cl.remove(".tabButton.active", "active");
    dom.cl.add(tabButton, "active");
    tabButton.scrollIntoView();
    chrome.storage.local.set({
        lastPane: window.paneToLoad,
    });

    document.title = dom.text(tabButton);
}
