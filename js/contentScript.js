(async () => {
    const STR = new Proxy(
        {
            LANG: dom.attr("html", "lang"),
            "en-US": {
                userBlock: "Block",
                avatarBlock: "Block avatar",
                signatureBlock: "Block signature",
                userUnblock: "-",
                avatarUnblock: "Unblock avatar",
                signatureUnblock: "Unblock signature",
                report: "Report",
            },
            "tr-TR": {
                userBlock: "Engelle",
                avatarBlock: "Avatar engelle",
                signatureBlock: "İmza engelle",
                userUnblock: "-",
                avatarUnblock: "Avatarı göster",
                signatureUnblock: "İmzayı göster",
                report: "Rapor",
            },
        },
        {
            get(target, prop) {
                if (!target.LANG) {
                    return null;
                }

                return typeof target[target.LANG][prop] === "string"
                    ? target[target.LANG][prop]
                    : target[target.LANG][prop].bind(target);
            },
        },
    );

    const BASE = {
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

        reportButton: (() => {
            const element = dom.ce("a");
            dom.cl.add(element, "actionBar-action actionBar-action--report");
            dom.text(element, STR.report);
            dom.attr(element, "data-xf-click", "overlay");

            return element;
        })(),

        userButton: (() => {
            const svg = dom.ceNS("http://www.w3.org/2000/svg", "svg");
            dom.attr(svg, "viewBox", "0 0 448 512");
            svg.append(dom.ceNS("http://www.w3.org/2000/svg", "path"));

            const text = dom.ce("span");
            dom.text(text, STR.userBlock);

            const element = dom.ce("a");
            dom.cl.add(element, "actionBar-action actionBar-action--block");
            dom.attr(element, "blocktype", "user");
            element.title = STR.userBlock;
            element.append(svg, text);

            return element;
        })(),

        avatarButton: (() => {
            const svg = dom.ceNS("http://www.w3.org/2000/svg", "svg");
            dom.attr(svg, "viewBox", "0 0 448 512");
            svg.append(dom.ceNS("http://www.w3.org/2000/svg", "path"));

            const text = dom.ce("span");
            dom.text(text, STR.avatarBlock);

            const element = dom.ce("a");
            dom.cl.add(element, "actionBar-action actionBar-action--block");
            dom.attr(element, "blocktype", "avatar");
            element.title = STR.avatarBlock;
            element.append(svg, text);

            return element;
        })(),

        signatureButton: (() => {
            const svg = dom.ceNS("http://www.w3.org/2000/svg", "svg");
            dom.attr(svg, "viewBox", "0 0 448 512");
            svg.append(dom.ceNS("http://www.w3.org/2000/svg", "path"));

            const text = dom.ce("span");
            dom.text(text, STR.signatureBlock);

            const element = dom.ce("a");
            dom.cl.add(element, "actionBar-action actionBar-action--block");
            dom.attr(element, "blocktype", "signature");
            element.title = STR.signatureBlock;
            element.append(svg, text);

            return element;
        })(),
    };

    var postIds;
    var userIds;
    var messages;


    waitForElementToExist(".block-outer--after").then(elem => {
        main();
    });

    async function main() {
        var settings;

        blockButtons();
        observe();

        async function blockButtons() {
            postIds = Array.from(qsa(".message-userContent.lbContainer.js-lbContainer"), node => dom.attr(node, "data-lb-id").slice(5));
            userIds = Array.from(qsa(".message-name>:is(a, span)"), node => parseInt(dom.attr(node, "data-user-id"), 10));
            messages = qsa(".message-actionBar.actionBar");

            // if article
            if (userIds.length === postIds.length - 1) {
                userIds.splice(0, 0, parseInt(dom.attr(".message-articleUserName>a", "data-user-id"), 10));
            }

            // report ban and reaction ban
            if (messages.length === 0) {
                qsa(".message-footer").forEach(elem => {
                    elem.prepend(dom.clone(BASE.actionBar));
                });

                messages = qsa(".message-actionBar.actionBar");
            }

            settings = await chrome.storage.local.get([
                "user",
                "avatar",
                "signature",
                "userCount",
                "avatarCount",
                "signatureCount",
                "settingUserButton",
                "settingAvatarButton",
                "settingSignatureButton",
            ]);

            messages.forEach((elem, i) => {
                // no report and no edit
                if (!elem.querySelector(".actionBar-set.actionBar-set--internal")) {
                    elem.append(dom.clone(BASE.internalActionBar));
                }

                // no report
                if (!elem.querySelector(".actionBar-action.actionBar-action--report")) {
                    const reportButton = dom.clone(BASE.reportButton);
                    dom.attr(reportButton, "href", `/sosyal/mesaj/${ postIds[i] }/report`);
                    elem.lastElementChild.prepend(reportButton);
                }

                if (!elem.querySelector(".actionBar-action--block")) {
                    elem.lastElementChild.append(...makeBlockButtons(userIds[i]));
                }
            });
        }

        function makeBlockButtons(userId) {
            const buttonArray = [];

            if (!userId || isSelfBlock(userId)) {
                buttonArray.push(
                    dom.clone(BASE.userButton),
                    dom.clone(BASE.avatarButton),
                    dom.clone(BASE.signatureButton),
                );

                buttonArray.forEach(elem => {
                    dom.cl.add(elem, "theBlocker-hide");
                });

                return buttonArray;
            }

            if (settings["settingUserButton"]) {
                const button = dom.clone(BASE.userButton);

                // if userId is blocked, the user can't see the buttons
                // if (settings["user"].includes(userId)) {
                //     button.title = STR.userUnblock;
                //     dom.text(button.lastElementChild, STR.userUnblock);
                // }

                dom.attr(button, "data-user-id", userId);
                button.addEventListener("click", blockHandler);

                buttonArray.push(button);
            }

            if (settings["settingAvatarButton"]) {
                const button = dom.clone(BASE.avatarButton);

                if (settings["avatar"].includes(userId)) {
                    button.title = STR.avatarUnblock;
                    dom.text(button.lastElementChild, STR.avatarUnblock);
                }

                dom.attr(button, "data-user-id", userId);
                button.addEventListener("click", blockHandler);

                buttonArray.push(button);
            }

            if (settings["settingSignatureButton"]) {
                const button = dom.clone(BASE.signatureButton);

                if (settings["signature"].includes(userId)) {
                    button.title = STR.signatureUnblock;
                    dom.text(button.lastElementChild, STR.signatureUnblock);
                }

                dom.attr(button, "data-user-id", userId);
                button.addEventListener("click", blockHandler);

                buttonArray.push(button);
            }

            return buttonArray;
        }

        async function blockHandler(event) {
            const userId = parseInt(dom.attr(event.currentTarget, "data-user-id"), 10);
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
            // if not member
            return qs(".p-navgroup--member") && userId === parseInt(dom.attr("a[href='/sosyal/hesap/']>span", "data-user-id"), 10);
        }

        function isUserIdValid(userId) {
            return userId && /^\d+$/.test(userId);
        }

        chrome.storage.onChanged.addListener(async changes => {
            Object.entries(changes).forEach(([key, { oldValue, newValue }]) => {
                switch (key) {
                    case "user":
                    case "avatar":
                    case "signature":
                        settings[key] = newValue;
                        settings[`${ key }Count`] = newValue.length;

                        const isBlock = newValue.length > oldValue.length;
                        const userId = isBlock ? newValue.at(-1) : oldValue.find((elem, i) => elem !== newValue[i]);
                        toggleButtonTexts(isBlock, userId, key);
                }
            });
        });

        function toggleButtonTexts(isBlock, userId, key) {
            var newText;

            switch (key.length << isBlock) {
                case 4 << 0: newText = STR.userBlock; break;
                case 6 << 0: newText = STR.avatarBlock; break;
                case 9 << 0: newText = STR.signatureBlock; break;
                case 4 << 1: newText = STR.userUnblock; break;
                case 6 << 1: newText = STR.avatarUnblock; break;
                case 9 << 1: newText = STR.signatureUnblock; break;
            }

            qsa(`[data-user-id="${ userId }"][blocktype="${ key }"]`).forEach(elem => {
                dom.text(elem.lastElementChild, newText);
                elem.title = newText;
            });
        }

        async function observe() {
            waitForElementToExist(".block.block--messages[data-href]").then(elem => {
                new MutationObserver(async _ => {
                    blockButtons();
                })
                    .observe(elem, { childList: true, subtree: true });
            });
        }
    }

    function waitForElementToExist(selector) {
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
