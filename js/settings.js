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

async function settingChanged(event) {
    var settingName = dom.attr(event.target, "data-setting-name");
    await chrome.storage.local.set({
        [settingName]: event.target.checked,
    });
}
