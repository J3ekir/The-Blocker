/* Heavily inspired by Raymond Hill's uBlock Origin */

chrome.permissions.contains({
    origins: [
        "https://techolay.net/sosyal/*",
        "https://www.technopat.net/sosyal/*",
    ],
}).then(granted => {
    if (!granted) {
        qs("#requestPermission").style.display = "flex";
    }
});

qs("#requestPermission>button").addEventListener("click", requestPermission);

chrome.storage.local.get().then(settings => {
    qsa("[data-setting-name]").forEach(elem => {
        elem.checked = settings[elem.getAttribute("data-setting-name")];
        elem.addEventListener("change", settingChanged);
    });
});

function requestPermission() {
    chrome.permissions.request({
        origins: [
            "https://techolay.net/sosyal/*",
            "https://www.technopat.net/sosyal/*",
        ],
    }).then(granted => {
        if (granted) {
            qs("#requestPermission").style.display = "none";
        }
    });
}

function settingChanged(event) {
    const settingName = event.currentTarget.getAttribute("data-setting-name");
    chrome.storage.local.set({
        [settingName]: event.currentTarget.checked,
    });
}
