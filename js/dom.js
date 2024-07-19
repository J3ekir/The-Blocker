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
