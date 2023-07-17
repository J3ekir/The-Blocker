const dom = {}

dom.attr = function (element, attribute, value = undefined) {
    if (value === undefined) {
        return element.getAttribute(attribute);
    }
    else {
        element.setAttribute(attribute, value);
    }
}

dom.ce = function (tag) {
    return document.createElement(tag);
}

dom.ceNS = function (NS, tag) {
    return document.createElementNS(NS, tag);
}

dom.getById = function (id) {
    return document.getElementById(id);
}

dom.qs = function (query) {
    return document.querySelector(query);
}

dom.qsa = function (query) {
    return document.querySelectorAll(query);
}
