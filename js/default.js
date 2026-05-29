/* https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/manifest.json/content_scripts#browser_compatibility */
const css = `
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
	waitForElement("#footer").then(executeDefaults);

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
})();
