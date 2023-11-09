const i18n = {};

i18n.get = function (key) {
    return storage.settings[storage.settings["language"]][key];
};

i18n.setData = function () {
    qsa("[data-i18n]").forEach(elem => {
        elem.textContent = this.get(dom.attr(elem, "data-i18n"));
    });
};
