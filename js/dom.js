self.qs = (a, b) => typeof a === "string" ? document.querySelector(a) : a.querySelector?.(b);
self.qsa = (a, b) => typeof a === "string" ? document.querySelectorAll(a) : a.querySelectorAll?.(b);
self.waitForElement = selector => new Promise(resolve => {
    const elem = qs(selector);
    if (elem) { return resolve(elem); }
    new MutationObserver((_, observer) => {
        const elem = qs(selector);
        if (elem) {
            observer.disconnect();
            return resolve(elem);
        }
    }).observe(document, { childList: true, subtree: true });
});
self.isLoggedIn = document.documentElement.getAttribute("data-logged-in") === "true";
self.isSelf = userId => isLoggedIn && userId === parseInt(qs(".p-navgroup-link--user>.avatar").dataset.userId, 10);
self.isUserIdValid = userId => userId && /^\d+$/.test(userId);
