/* Heavily inspired by Raymond Hill's uBlock Origin */
var buttons = ["settingsButtonsUser", "settingsButtonsAvatar", "settingsButtonsSignature"];
var inputs = qsa("[data-setting-name]");
var language = qs("#language");


init();


async function init() {
    await i18n.render();
    parent.postMessage({
        type: "title",
        title: document.title,
    }, "*");

    var settings = await storage.get(null);

    language.value = settings["language"];
    language.addEventListener("change", languageChanged);

    inputs.forEach((elem) => {
        elem.checked = settings[dom.attr(elem, "data-setting-name")];
        elem.addEventListener("change", settingChanged);
    });
}

async function languageChanged(event) {
    var selectedLanguage = language.value;
    await storage.set({"language": selectedLanguage});
    i18n.render();
    parent.postMessage({
        type: "language",
        language: selectedLanguage,
    }, "*");
}

async function settingChanged(event) {
    var data = {};
    var settingName = dom.attr(event.target, "data-setting-name");
    var isChecked = event.target.checked;
    data[settingName] = isChecked;
    await storage.set(data);

    if (buttons.includes(settingName)) {
        return;
    }

    var CSS = await storage.setCSS();
    console.log(`CSS: ${CSS}`);
}
