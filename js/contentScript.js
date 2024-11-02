(async () => {
    const isLoggedIn = document.documentElement.getAttribute("data-logged-in") === "true";

    var settings;

    waitForElement(".blockMessage--none").then(elem => {
        main();
    });

    async function main() {
        createBlockButtons();
        observeForNewActionBars();
        observeForNewBlockMenus();

        async function createBlockButtons() {
            const postIds = Array.from(qsa(":is(.message--post,.message--article)"), node => node.dataset.content.slice(5));
            const userIds = Array.from(qsa(":is(.message-name,.message-articleUserName)>:is(a,span)"), node => parseInt(node.dataset.userId, 10));
            let messages = qsa(".message-actionBar.actionBar");

            // report ban and reaction ban
            if (messages.length === 0) {
                qsa(".message-footer").forEach(elem => {
                    elem.prepend(BASE.actionBar);
                });

                messages = qsa(".message-actionBar.actionBar");
            }

            settings = await chrome.storage.local.get([
                `${ forum }User`,
                `${ forum }Avatar`,
                `${ forum }Signature`,
                `${ forum }UserCount`,
                `${ forum }AvatarCount`,
                `${ forum }SignatureCount`,
                "settingUserButton",
                "settingAvatarButton",
                "settingSignatureButton",
            ]);

            messages.forEach((elem, i) => {
                // no report and no edit
                if (!elem.querySelector(".actionBar-set.actionBar-set--internal")) {
                    elem.append(BASE.internalActionBar);
                }

                // no report
                if (!elem.querySelector(".actionBar-action.actionBar-action--report")) {
                    elem.lastElementChild.prepend(BASE.reportButton(postIds[i]));
                }

                if (!elem.querySelector("[blocktype]")) {
                    elem.lastElementChild.append(...makeBlockButtons(userIds[i]));
                }
                if (!elem.querySelector(".actionBar-action.actionBar-action--menuTrigger")) {
                    elem.lastElementChild.append(BASE.actionBarMenu, BASE.actionBarMenuList);
                }
            });
        }

        function makeBlockButtons(userId) {
            const buttonArray = [];

            if (!userId || isSelfBlock(userId)) {
                buttonArray.push(
                    BASE.baseUserButton,
                    BASE.baseAvatarButton,
                    BASE.baseSignatureButton,
                );

                buttonArray.forEach(elem => {
                    elem.classList.add("theBlocker-hide");
                });

                return buttonArray;
            }

            if (settings["settingUserButton"]) {
                buttonArray.push(BASE.userButton(settings[`${ forum }User`], userId));
            }

            if (settings["settingAvatarButton"]) {
                buttonArray.push(BASE.avatarButton(settings[`${ forum }Avatar`], userId));
            }

            if (settings["settingSignatureButton"]) {
                buttonArray.push(BASE.signatureButton(settings[`${ forum }Signature`], userId));
            }

            return buttonArray;
        }

        chrome.storage.onChanged.addListener(changes => {
            Object.entries(changes).forEach(([key, { oldValue, newValue }]) => {
                switch (key) {
                    case `${ forum }User`:
                    case `${ forum }Avatar`:
                    case `${ forum }Signature`:
                        settings[key] = newValue;
                        settings[`${ key }Count`] = newValue.length;

                        const isBlock = newValue.length > oldValue.length;
                        const userId = isBlock ? newValue.at(-1) : oldValue.find((elem, i) => elem !== newValue[i]);
                        toggleButtonTexts(isBlock, userId, key);
                }
            });
        });

        function toggleButtonTexts(isBlock, userId, key) {
            const newText = STR[`${ key.replace(forum, "").toLowerCase() }${ isBlock ? "Unblock" : "Block" }`];
            qsa(`[data-user-id="${ userId }"][blocktype="${ key }"]`).forEach(elem => {
                elem.textContent = elem.title = newText;
            });
        }

        function addBlockButtonEventListeners(elem) {
            if (!elem.matches(".menu[data-menu-builder='actionBar']")) { return; }

            qsa(elem, "[blocktype]").forEach(elem => {
                elem.addEventListener("click", blockHandler);
            });
        }

        async function observeForNewActionBars() {
            waitForElement(".block.block--messages[data-href]").then(elem => {
                new MutationObserver(async _ => {
                    createBlockButtons();
                })
                    .observe(elem, { childList: true, subtree: true });
            });
        }

        function observeForNewBlockMenus() {
            const targetNode = document.body;
            new MutationObserver(async mutationList => {
                mutationList.forEach(mutation => {
                    mutation.addedNodes.forEach(elem => {
                        if (elem.nodeType === Node.ELEMENT_NODE) {
                            addBlockButtonEventListeners(elem);
                        }
                    });
                });
            })
                .observe(targetNode, { childList: true });
        }
    }

    self.blockHandler = async function (event) {
        event.currentTarget.closest(".menu[data-menu-builder='actionBar']")?.dispatchEvent(new Event("menu:close"));

        const userId = parseInt(event.currentTarget.dataset.userId, 10);
        const type = event.currentTarget.getAttribute("blocktype");
        const isBlocked = settings[type].includes(userId);

        if (!isUserIdValid(userId)) {
            console.log(`user ID is not a number: ${ userId }`);
            return;
        }

        !isBlocked
            ? settings[type].push(userId)
            : settings[type].splice(settings[type].indexOf(userId), 1);

        chrome.storage.local.set({
            [type]: settings[type].map(id => parseInt(id, 10)),
            [`${ type }Count`]: settings[type].length,
        });

        console.log(`user ID: ${ userId }, ${ type } ${ !isBlocked ? "blocked" : "unblocked" }`);
    };

    function isSelfBlock(userId) {
        return isLoggedIn && userId === parseInt(qs(".p-navgroup-link--user>.avatar").dataset.userId, 10);
    }

    function isUserIdValid(userId) {
        return userId && /^\d+$/.test(userId);
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
