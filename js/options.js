/* Heavily inspired by Raymond Hill's uBlock Origin */

chrome.storage.local.get("lastPane").then(settings => {
    loadPane(settings["lastPane"]);
});

qsa(".tabButton").forEach(elem => {
    elem.addEventListener("click", event => loadPane(dom.attr(event.target, "data-pane")));
});

window.addEventListener("message", function (event) {
    switch (event.data["type"]) {
        case "tab":
            setSelectedTab();
            break;
        case "title":
            document.title = event.data["title"];
            break;
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

    if (dom.attr(".tabButton.selected", "data-pane") === pane) {
        return;
    }

    qs("#iframe").contentWindow.location.replace(pane);

    switch (dom.attr(".tabButton.selected", "data-pane")) {
        case "filters.html":
        case "notes.html":
            return;
    }

    setSelectedTab();
}

function setSelectedTab() {
    const tabButton = qs(`[data-pane="${ window.paneToLoad }"]`);
    window.location.replace(`#${ window.paneToLoad }`);
    dom.cl.remove(".tabButton.selected", "selected");
    dom.cl.add(tabButton, "selected");
    tabButton.scrollIntoView();
    chrome.storage.local.set({
        lastPane: window.paneToLoad,
    });
}
