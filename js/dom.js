const dom = {};
dom.cl = {};


const normalizeTarget = target => {
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
        if (value === undefined) {
            return elem.getAttribute(attr);
        }
        if (value === null) {
            elem.removeAttribute(attr);
        }
        else {
            elem.setAttribute(attr, value);
        }
    }
};

dom.byId = function (id) {
    return document.getElementById(id);
};

dom.byName = function (name) {
    return document.getElementsByName(name);
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


dom.cl.add = function (target, ...name) {
    for (const elem of normalizeTarget(target)) {
        elem.classList.add(...name);
    }
};

dom.cl.remove = function (target, ...name) {
    for (const elem of normalizeTarget(target)) {
        elem.classList.remove(...name);
    }
};

dom.cl.toggle = function (target, name, state) {
    if (state === undefined) {
        for (const elem of normalizeTarget(target)) {
            elem.classList.toggle(name);
        }
    }
    else {
        for (const elem of normalizeTarget(target)) {
            elem.classList.toggle(name, state);
        }
    }
};

dom.cl.has = function has(target, name) {
    for (const elem of normalizeTarget(target)) {
        if (elem.classList.contains(name)) {
            return true;
        }
    }
    return false;
};
