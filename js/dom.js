self.dom = self.dom || {};


normalizeTarget = target => {
    if (typeof target === "string") { return Array.from(qsa(target)); }
    if (target instanceof Element) { return [target]; }
    if (target === null) { return []; }
    if (Array.isArray(target)) { return target; }
    return Array.from(target);
};

qs = function (a, b) {
    return typeof a === "string"
        ? document.querySelector(a)
        : a.querySelector(b);
};

qsa = function (a, b) {
    return typeof a === "string"
        ? document.querySelectorAll(a)
        : a.querySelectorAll(b);
};


dom.attr = function (target, attr, value) {
    for (const elem of normalizeTarget(target)) {
        if (value === undefined) { return elem.getAttribute(attr); }
        if (value === null) { elem.removeAttribute(attr); }
        else { elem.setAttribute(attr, value); }
    }
};

dom.ce = function (tag) {
    return document.createElement(tag);
};

dom.ceNS = function (NS, tag) {
    return document.createElementNS(NS, tag);
};

dom.clone = function (target) {
    return normalizeTarget(target)[0].cloneNode(true);
};

dom.remove = function (target) {
    for (const elem of normalizeTarget(target)) {
        elem.remove();
    }
};

dom.text = function (target, text) {
    const targets = normalizeTarget(target);
    if (text === undefined) {
        return targets.length !== 0 ? targets[0].textContent : undefined;
    }
    for (const elem of targets) {
        elem.textContent = text;
    }
};
