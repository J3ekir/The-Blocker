i18n.render();

var result;
var types = {
    "userCount": qs("#userValue"),
    "avatarCount": qs("#avatarValue"),
    "signatureCount": qs("#signatureValue"),
};

setValues();

chrome.storage.onChanged.addListener((changes, areaName) => {
    Object.keys(changes).forEach(key => {
        if (Object.keys(types).includes(key)) {
            types[key].textContent = changes[key].newValue;
        }
    });
});

async function setValues() {
    result = await storage.get(Object.keys(types));
    Object.keys(types).forEach(key => {
        types[key].textContent = result[key];
    });
}
