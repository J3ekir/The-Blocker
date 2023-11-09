var types;

init();

async function init() {
    await storage.init();
    i18n.setData();
    
    types = {
        "userCount": qs("#userValue"),
        "avatarCount": qs("#avatarValue"),
        "signatureCount": qs("#signatureValue"),
    };

    setValues();
}

chrome.storage.onChanged.addListener((changes, areaName) => {
    Object.keys(changes).forEach(key => {
        if (Object.keys(types).includes(key)) {
            types[key].textContent = changes[key].newValue;
        }
    });
});

function setValues() {
    Object.keys(types).forEach(key => {
        types[key].textContent = storage.settings[key];
    });
}
