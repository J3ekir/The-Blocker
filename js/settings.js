const origins = [
    "https://techolay.net/sosyal/*",
    "https://www.technopat.net/sosyal/*",
];

chrome.permissions.contains({ origins }).then(granted => {
    if (!granted) {
        qs("#requestPermission").style.display = "flex";
    }
});

qs("#requestPermission>button").addEventListener("click", requestPermission);

qs("#theme").addEventListener("change", event => {
    chrome.storage.local.set({ theme: event.currentTarget.value });
});

const settingElements = qsa("[data-setting-name]");
const settingKeys = Array.from(settingElements, elem => elem.getAttribute("data-setting-name"));
chrome.storage.local.get(["theme", ...settingKeys]).then(settings => {
    qs("#theme").value = settings["theme"];

    settingElements.forEach(elem => {
        elem.checked = settings[elem.getAttribute("data-setting-name")];
        elem.addEventListener("change", settingChanged);
    });
});

function requestPermission() {
    chrome.permissions.request({ origins }).then(granted => {
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
