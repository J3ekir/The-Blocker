chrome.runtime.sendMessage({
    type: "injectCSS"
});

storage.get(["settingsCombineWidgetTabs", "settingsBottomWidget"]).then(result => {
    if (result["settingsCombineWidgetTabs"]) {
        chrome.runtime.sendMessage({
            type: "combineWidgetTabs"
        });
    }

    if (result["settingsBottomWidget"]) {
        chrome.runtime.sendMessage({
            type: "bottomWidget"
        });
    }
});
