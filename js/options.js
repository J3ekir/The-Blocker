/* Heavily inspired by Raymond Hill's uBlock Origin */
var iframe = qs("#iframe");
var paneToLoad = "";


init();


async function init() {
    await i18n.render();
    await loadLastPane();
}

window.addEventListener("message", function (event) {
    switch (event.data["type"]) {
        case "tab":
            setSelectedTab();
            break;
        case "title":
            document.title = event.data["title"];
            break;
        case "language":
            i18n.render();
            break;
        default:
            break;
    }
});

document.addEventListener("keydown", (event) => {
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "s") {
        event.preventDefault();

        var saveButton = iframe.contentWindow.document.querySelector("#applyButton");
        if (saveButton && !saveButton.disabled) {
            saveButton.click();
        }
    }
});

qsa(".tabButton").forEach((elem) => {
    elem.addEventListener("click", tabCliked);
});

function tabCliked(event) {
    loadPane(dom.attr(event.target, "data-pane"));
}

async function loadLastPane() {
    var result = await storage.get("optionsLastPane");
    iframe.contentWindow.location.replace(result["optionsLastPane"]);
    const tabButton = qs(`[data-pane="${result["optionsLastPane"]}"]`);
    tabButton.classList.add("selected");
    tabButton.scrollIntoView();
}

function loadPane(pane) {
    paneToLoad = pane;
    
    if (qs(`[data-pane="${paneToLoad}"]`).classList.contains("selected")) {
        return;
    }

    iframe.contentWindow.location.replace(paneToLoad);

    if (dom.attr(".tabButton.selected", "data-pane") === "filters.html") {
        return;
    }

    setSelectedTab();
}

function setSelectedTab() {
    const tabButton = qs(`[data-pane="${paneToLoad}"]`);
    window.location.replace(`#${paneToLoad}`);
    qsa(".tabButton.selected").forEach((elem) => {
        elem.classList.remove("selected");
    });
    tabButton.classList.add("selected");
    tabButton.scrollIntoView();
    storage.set({ "optionsLastPane": paneToLoad });
}
