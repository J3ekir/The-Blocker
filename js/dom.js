self.qs = (a, b) => typeof a === "string" ? document.querySelector(a) : a.querySelector?.(b);
self.qsa = (a, b) => typeof a === "string" ? document.querySelectorAll(a) : a.querySelectorAll?.(b);
self.waitForElement = selector => new Promise(resolve => {
	let elem;
	if (elem = qs(selector)) { return resolve(elem); }
	new MutationObserver((_, observer) => {
		if (elem = qs(selector)) {
			observer.disconnect();
			resolve(elem);
		}
	}).observe(document, { childList: true, subtree: true });
});
self.isLoggedIn = document.documentElement.getAttribute("data-logged-in") === "true";
self.isSelfUserId = userId => isLoggedIn && userId === parseInt(qs(".p-navgroup-link--user>.avatar").dataset.userId, 10);
self.isUserIdValid = userId => userId && /^\d+$/.test(userId);
self.forum = window.location.hostname.replace(/(?:www.)?(.*).net/, "$1");
self.isFirefox = window.navigator.userAgent.includes("Firefox");
