/* https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/manifest.json/content_scripts#browser_compatibility */
const css = `
/* techolay çözüm */
.message--solution {
    border: unset !important;
    box-shadow: unset !important;
    position: unset !important;
}

:is(.memberTooltip-stats, .memberHeader-stats) dl {
	/* techolay */
	/* yazılımlar */
	&:has(> dd > [href^="/sosyal/indir"]),
	/* rozetler */
	&:has(> dd > [href$="/badges"]),
	/* giriş serisi */
	&:has(> dd > [href$="/daily-login-streaks"]),
    /* ürünler */
	&:has(> dd > [href=^"/sosyal/satis"]) {
		display: none !important;
	}

    /* technopat */
    /* medya */
    &:has(> dd > [href^="/sosyal/medya"]),
    /* blog */
    &:has(> dd > [href^="/sosyal/blog"]),
    /* blog girdisi yorumları*/
    &:has(> dd > [href^="/sosyal/blog"]) + *,
    /* rozetler */
    &:has(> dd > [href$="/badges"]),
    /* giriş serisi */
	&:has(> dd > [href$="/daily-login-streaks"]) {
		display: none !important;
	}
}
`;

chrome.runtime.sendMessage({
    type: "insertCssString",
    css,
});

(async () => {
	waitForElement("#footer").then(() => {
        executeDefaults();
		ignoreUserStyles();
    });

    const noticeAds = [
        "reklam",
        "amazon",
        "hepsiburada",
        "n11",
        "trendyol",
        "kampanya",
        "indirim",
        "fırsat",
        "haber",
    ];
    const frameSelector = ".ap-ss-avatarFrameContainer .avatar";
    const seenFrameIds = new Set();

    function executeDefaults() {
        qsa(".p-body-inner>.notices>.notice").forEach(elem => {
            if (noticeAds.some(ad => elem.textContent.toLowerCase().includes(ad))) {
                chrome.runtime.sendMessage({
                    type: "dismissNotice",
                    noticeId: elem.dataset.noticeId,
                });
            }
        });
    }

    function ignoreUserStyles() {
        if (forum !== "technopat") { return; }

        qsa(frameSelector).forEach(elem => {
            if (seenFrameIds.has(elem.dataset.userId)) { return; }

            seenFrameIds.add(elem.dataset.userId);
            chrome.runtime.sendMessage({
                type: "ignoreUserStyle",
                url: `${ elem.href }/ignore-style`,
            });
        });
    }
})();
