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

function waitForElement(selector) {
    return new Promise(resolve => {
        const elem = qs(selector);
        if (elem) { return resolve(elem); }
        new MutationObserver((_, observer) => {
            const elem = qs(selector);
            if (elem) {
                observer.disconnect();
                return resolve(elem);
            }
        })
            .observe(document, { childList: true, subtree: true });
    });
}
