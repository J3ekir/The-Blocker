function qs(a, b) {
    return typeof a === "string"
        ? document.querySelector(a)
        : a.querySelector?.(b);
};

function qsa(a, b) {
    return typeof a === "string"
        ? document.querySelectorAll(a)
        : a.querySelectorAll?.(b);
};
