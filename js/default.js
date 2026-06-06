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
