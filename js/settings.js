/* Heavily inspired by Raymond Hill's uBlock Origin */

parent.postMessage({
    type: "title",
    title: document.title,
}, "*");

chrome.storage.local.get().then(settings => {
    qsa("[data-setting-name]").forEach(elem => {
        elem.checked = settings[dom.attr(elem, "data-setting-name")];
        elem.addEventListener("change", settingChanged);
    });
});

function settingChanged(event) {
    const settingName = dom.attr(event.target, "data-setting-name");
    chrome.storage.local.set({
        [settingName]: event.target.checked,
    });
}
