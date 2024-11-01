const isMac = window.navigator.userAgent.indexOf("Mac OS") !== -1;

chrome.storage.local.get("lastPane").then(settings => {
    window.location.hash === ""
        ? loadPane(settings["lastPane"])
        : loadPane(window.location.hash.substring(1));
});

qsa(".tabButton").forEach(elem => {
    elem.addEventListener("click", event => loadPane(event.currentTarget.getAttribute("data-pane")));
});

window.addEventListener("message", function (event) {
    switch (event.data["type"]) {
        case "tab":
            setSelectedTab();
    }
});

document.addEventListener("keydown", event => {
    if (isMac ? event.metaKey : event.ctrlKey && event.key.toLowerCase() === "s") {
        event.preventDefault();

        const applyButton = qs("#iframe").contentWindow.document.querySelector("#applyButton");
        if (applyButton && !applyButton.disabled) {
            applyButton.click();
        }
    }
});

function loadPane(pane) {
    window.paneToLoad = pane;

    if (qs(".tabButton.active")?.getAttribute("data-pane") === pane) { return; }

    qs("#iframe").contentWindow.location.replace(pane.replace(/([^-]*)-?.*(.html)/, "$1$2"));

    switch (qs(".tabButton.active")?.getAttribute("data-pane")?.replace(/([^-]*)-?.*(.html)/, "$1$2")) {
        case "filters.html":
        case "notes.html":
            return;
    }

    setSelectedTab();
}

function setSelectedTab() {
    const tabButton = qs(`[data-pane="${ window.paneToLoad }"]`);
    window.location.hash = window.paneToLoad;
    qsa(".tabButton.active").forEach(elem => elem.classList.remove("active"));
    tabButton.classList.add("active");
    tabButton.scrollIntoView();
    chrome.storage.local.set({
        lastPane: window.paneToLoad,
    });

    document.title = tabButton.textContent;
    document.documentElement.dataset.forum = tabButton.dataset.pane.replace(/[^-]*-?(.*?)\.html/, "$1");
}
