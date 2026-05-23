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
