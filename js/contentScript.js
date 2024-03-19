(async () => {
    const forum = window.location.hostname.replace(/(?:www.)?(.*).net/, "$1");
    const isLoggedIn = dom.attr("html", "data-logged-in") === "true";
    const STR = new Proxy(
        {
            "LANGUAGE": dom.attr("html", "lang"),
            "en-US": {
                userBlock: "Block",
                avatarBlock: "Block avatar",
                signatureBlock: "Block signature",
                userUnblock: "-",
                avatarUnblock: "Unblock avatar",
                signatureUnblock: "Unblock signature",
                report: "Report",
                actionBarMenu: "More options",
            },
            "tr-TR": {
                userBlock: "Engelle",
                avatarBlock: "Avatar engelle",
                signatureBlock: "İmza engelle",
                userUnblock: "-",
                avatarUnblock: "Avatarı göster",
                signatureUnblock: "İmzayı göster",
                report: "Rapor",
                actionBarMenu: "Detaylar",
            },
        },
        {
            get(target, prop) {
                if (!target.LANGUAGE) {
                    return null;
                }

                return typeof target[target.LANGUAGE][prop] === "string"
                    ? target[target.LANGUAGE][prop]
                    : target[target.LANGUAGE][prop].bind(target);
            },
        },
    );

    const BASE = new Proxy(
        {
            baseReportButton: (() => {
                const element = dom.ce("a");
                dom.cl.add(element, "actionBar-action actionBar-action--report");
                dom.text(element, STR.report);
                dom.attr(element, "data-xf-click", "overlay");

                return element;
            })(),

            baseUserButton: (() => {
                const element = dom.ce("a");
                dom.cl.add(element, "actionBar-action actionBar-action--menuItem");
                dom.text(element, STR.userBlock);
                dom.attr(element, "blocktype", `${ forum }User`);
                element.title = STR.userBlock;

                return element;
            })(),

            baseAvatarButton: (() => {
                const element = dom.ce("a");
                dom.cl.add(element, "actionBar-action actionBar-action--menuItem");
                dom.text(element, STR.avatarBlock);
                dom.attr(element, "blocktype", `${ forum }Avatar`);
                element.title = STR.avatarBlock;

                return element;
            })(),

            baseSignatureButton: (() => {
                const element = dom.ce("a");
                dom.cl.add(element, "actionBar-action actionBar-action--menuItem");
                dom.text(element, STR.signatureBlock);
                dom.attr(element, "blocktype", `${ forum }Signature`);
                element.title = STR.signatureBlock;

                return element;
            })(),

            actionBar: (() => {
                const element = dom.ce("div");
                dom.cl.add(element, "message-actionBar actionBar");

                return element;
            })(),

            internalActionBar: (() => {
                const element = dom.ce("div");
                dom.cl.add(element, "actionBar-set actionBar-set--internal");

                return element;
            })(),

            reportButton(postId) {
                const element = dom.clone(BASE.baseReportButton);
                dom.attr(element, "href", `/sosyal/mesaj/${ postId }/report`);

                return element;
            },

            userButton(userId) {
                const element = dom.clone(BASE.baseUserButton);

                if (settings[`${ forum }User`].includes(userId)) {
                    element.title = STR.userUnblock;
                    dom.text(element, STR.userUnblock);
                }

                dom.attr(element, "data-user-id", userId);
                element.addEventListener("click", blockHandler);

                return element;
            },

            avatarButton(userId) {
                const element = dom.clone(BASE.baseAvatarButton);

                if (settings[`${ forum }Avatar`].includes(userId)) {
                    element.title = STR.avatarUnblock;
                    dom.text(element, STR.avatarUnblock);
                }

                dom.attr(element, "data-user-id", userId);
                element.addEventListener("click", blockHandler);

                return element;
            },

            signatureButton(userId) {
                const element = dom.clone(BASE.baseSignatureButton);

                if (settings[`${ forum }Signature`].includes(userId)) {
                    element.title = STR.signatureUnblock;
                    dom.text(element, STR.signatureUnblock);
                }

                dom.attr(element, "data-user-id", userId);
                element.addEventListener("click", blockHandler);

                return element;
            },

            actionBarMenu: (() => {
                const element = dom.ce("a");
                dom.cl.add(element, "actionBar-action actionBar-action--menuTrigger");
                dom.attr(element, "data-xf-click", "menu");
                dom.attr(element, "title", STR.actionBarMenu);
                dom.attr(element, "role", "button");
                dom.attr(element, "tabindex", "0");
                dom.attr(element, "aria-expanded", "false");
                dom.attr(element, "aria-haspopup", "true");
                dom.text(element, "•••");

                return element;
            })(),

            actionBarMenuList: (() => {
                const menuHeader = dom.ce("h4");
                dom.cl.add(menuHeader, "menu-header");
                dom.text(menuHeader, STR.actionBarMenu);

                const menuBuilderTarget = dom.ce("div");
                dom.cl.add(menuBuilderTarget, "js-menuBuilderTarget");

                const menuContent = dom.ce("div");
                dom.cl.add(menuContent, "menu-content");
                menuContent.append(menuHeader, menuBuilderTarget);

                const element = dom.ce("div");
                dom.cl.add(element, "menu");
                dom.attr(element, "data-menu", "menu");
                dom.attr(element, "aria-hidden", "true");
                dom.attr(element, "data-menu-builder", "actionBar");
                element.append(menuContent);

                return element;
            })(),
        },
        {
            get(target, prop) {
                return target[prop] instanceof Element
                    ? dom.clone(target[prop])
                    : target[prop].bind(target);
            },
        },
    );


    var settings;

    waitForElement(".block-outer--after").then(elem => {
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
                    dom.cl.add(elem, "theBlocker-hide");
                });

                return buttonArray;
            }

            if (settings["settingUserButton"]) {
                buttonArray.push(BASE.userButton(userId));
            }

            if (settings["settingAvatarButton"]) {
                buttonArray.push(BASE.avatarButton(userId));
            }

            if (settings["settingSignatureButton"]) {
                buttonArray.push(BASE.signatureButton(userId));
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
            let newText;

            switch (key.length << isBlock) {
                case forum.length + 4 << 0: newText = STR.userBlock; break;
                case forum.length + 6 << 0: newText = STR.avatarBlock; break;
                case forum.length + 9 << 0: newText = STR.signatureBlock; break;
                case forum.length + 4 << 1: newText = STR.userUnblock; break;
                case forum.length + 6 << 1: newText = STR.avatarUnblock; break;
                case forum.length + 9 << 1: newText = STR.signatureUnblock; break;
            }

            qsa(`[data-user-id="${ userId }"][blocktype="${ key }"]`).forEach(elem => {
                dom.text(elem, newText);
                elem.title = newText;
            });
        }

        function addBlockButtonEventListeners(elem) {
            if (!elem.matches(".menu[data-menu-builder='actionBar']")) {
                return;
            }

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

    async function blockHandler(event) {
        event.currentTarget.closest(".menu[data-menu-builder='actionBar']")?.dispatchEvent(new Event("menu:close"));

        const userId = parseInt(event.currentTarget.dataset.userId, 10);
        const type = dom.attr(event.currentTarget, "blocktype");
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
    }

    function isSelfBlock(userId) {
        return isLoggedIn && userId === parseInt(qs(".p-navgroup-link--user>.avatar").dataset.userId, 10);
    }

    function isUserIdValid(userId) {
        return userId && /^\d+$/.test(userId);
    }

    function waitForElement(selector) {
        return new Promise(resolve => {
            if (document.querySelector(selector)) {
                return resolve(document.querySelector(selector));
            }
            new MutationObserver((_, observer) => {
                if (document.querySelector(selector)) {
                    observer.disconnect();
                    return resolve(document.querySelector(selector));
                }
            })
                .observe(document, { childList: true, subtree: true });
        });
    }
})();
