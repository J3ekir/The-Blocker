(async () => {
    const isLoggedIn = document.documentElement.getAttribute("data-logged-in") === "true";

    const settings = await chrome.storage.local.get([
        `${ forum }Notes`,
        "settingNotes",
    ]);
    const NOTES = settings["settingNotes"];

    waitForElement("body").then(elem => {
        observeForNewTooltips();
    });

    waitForElement(".memberHeader-buttons").then(elem => {
        if (NOTES) {
            addProfileNote();
        }
    });

    function addTooltipItems(elem) {
        if (!qs(elem, ".tooltip-content-inner .memberTooltip")) { return; }

        const userId = parseInt(qs(elem, ".memberTooltip-avatar>a").dataset.userId, 10);

        addReportButton(elem, userId);
        addFindButton(elem, userId);

        if (NOTES) {
            addNote(elem, userId);
        }
    }

    function addReportButton(elem, userId) {
        if (hasReportButton(elem)) { return; }

        qs(elem, ".memberTooltip-headerInfo").prepend(
            BASE.tooltipReport(userId),
        );
    }

    function addFindButton(elem, userId) {
        if (hasFindButton(elem)) { return; }

        if (!hasActions(elem)) {
            qs(elem, ".memberTooltip").append(
                BASE.tooltipSeperator,
                BASE.tooltipActions,
            );
        }

        const userName = qs(elem, ".memberTooltip-nameWrapper>a").textContent;

        qs(elem, ".memberTooltip-actions").append(
            BASE.tooltipFind,
            BASE.tooltipFindMenu(userId, userName),
        );
    }

    function addNote(elem, userId) {
        if (hasNote(elem)) { return; }

        if (isSelfNote(userId)) { return; }

        qs(elem, ".memberTooltip-info").before(
            BASE.tooltipNote(settings[`${ forum }Notes`], userId),
            BASE.tooltipSeperator
        );
    }

    function addProfileNote() {
        const userId = parseInt(qs(".memberHeader-avatar>.avatarWrapper>:is(a,span)").dataset.userId, 10);

        if (isSelfNote(userId)) { return; }

        qs(".memberHeader-buttons").append(
            BASE.tooltipNote(settings[`${ forum }Notes`], userId),
        );
    }

    self.noteEnterHandler = function (event) {
        if (event.key === "Enter") {
            event.currentTarget.nextElementSibling.click();
            event.currentTarget.closest(".tooltip.tooltip--member")?.dispatchEvent(new Event("mouseout"));
        }
    };

    self.noteSaveHandler = function (event) {
        const note = event.currentTarget.previousElementSibling.value;
        const userId = parseInt(event.currentTarget.parentElement.dataset.userId, 10);

        settings[`${ forum }Notes`][userId] = note;

        if (!note.length) {
            delete settings[`${ forum }Notes`][userId];
        }

        chrome.storage.local.set({
            [`${ forum }Notes`]: settings[`${ forum }Notes`],
        });

        chrome.runtime.sendMessage({
            type: "noteSavedMessage",
        });

        event.currentTarget.closest(".tooltip.tooltip--member")?.dispatchEvent(new Event("mouseout"));
    };

    function hasReportButton(elem) {
        return qs(elem, ".button--link[href$='report']");
    }

    function hasActions(elem) {
        return qs(elem, ".memberTooltip .memberTooltip-actions");
    }

    function hasFindButton(elem) {
        return qs(elem, ".memberTooltip .memberTooltip-actions>.menu");
    }

    function hasNote(elem) {
        return qs(elem, ".memberTooltip .memberTooltip-note");
    }

    function isSelfNote(userId) {
        return isLoggedIn && userId === parseInt(qs(".p-navgroup-link--user>.avatar").dataset.userId, 10);
    }

    chrome.storage.onChanged.addListener(changes => {
        Object.entries(changes).forEach(([key, { oldValue, newValue }]) => {
            if (key === `${ forum }Notes`) {
                // it might be one of three things
                // 1) a new key and value added => new keys are more
                // 2) an existing key and value deleted => new keys are less
                // 3) an existing key's value changed => new keys are the same

                settings[`${ forum }Notes`] = newValue;

                const oldKeys = Object.keys(oldValue);
                const newKeys = Object.keys(newValue);
                const keys = oldKeys.length < newKeys.length ? newKeys : oldKeys;
                const userId = keys.find(key => newValue[key] !== oldValue[key]);
                setNewNoteValue(newValue, userId);
            }
        });
    });

    function setNewNoteValue(newValue, userId) {
        qsa(`.memberTooltip-note[data-user-id="${ userId }"]>.input`).forEach(elem => {
            elem.value = newValue[userId] || "";
        });
    }

    function observeForNewTooltips() {
        const targetNode = document.body;
        new MutationObserver(async (mutationList, observer) => {
            mutationList.forEach(mutation => {
                mutation.addedNodes.forEach(elem => {
                    if (elem.nodeType === Node.ELEMENT_NODE) {
                        addTooltipItems(elem);
                    }
                });
            });
        })
            .observe(targetNode, { childList: true, subtree: true });
    }

    function waitForElement(selector) {
        return new Promise(resolve => {
            const elem = document.querySelector(selector);
            if (elem) { return resolve(elem); }
            new MutationObserver((_, observer) => {
                const elem = document.querySelector(selector);
                if (elem) {
                    observer.disconnect();
                    return resolve(elem);
                }
            })
                .observe(document, { childList: true, subtree: true });
        });
    }
})();
