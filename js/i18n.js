const i18n = {}

i18n.settings = {};

i18n.get = function (key) {
    return this.settings[this.settings["language"]][key];
}

i18n.render = async function () {
    await this.init();
    this.setData();
}

i18n.init = async function () {
    this.settings = await storage.get(null);
}

i18n.setData = function () {
    dom.qsa("[data-i18n]").forEach((elem) => {
        elem.textContent = this.get(dom.attr(elem, "data-i18n"));
    });
}
