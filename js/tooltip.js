(async () => {
    const forum = window.location.hostname.replace(/(?:www.)?(.*).net/, "$1");
    const STR = new Proxy(
        {
            "LANGUAGE": dom.attr("html", "lang"),
            "en-US": {
                save: "Save",
                addNote: "Add note",
                report: "Report",
                find: "Find",
                findContent: "Find content",
                findAllContentBy(userName) {
                    return `Find all content by ${ userName }`;
                },
                findAllThreadsBy(userName) {
                    return `Find all threads by ${ userName }`;
                },
            },
            "tr-TR": {
                save: "Kaydet",
                addNote: "Not ekle",
                report: "Rapor",
                find: "Bul",
                findContent: "İçerik bul",
                findAllContentBy(userName) {
                    return `${ userName } tarafından gönderilen tüm içeriği arattır`;
                },
                findAllThreadsBy(userName) {
                    return `${ userName } tarafından açılan tüm konuları arattır`;
                },
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
            baseTooltipReport: (() => {
                const text = dom.ce("span");
                dom.text(text, STR.report);

                const button = dom.ce("a");
                dom.cl.add(button, "button button--link");
                dom.attr(button, "data-xf-click", "overlay");
                button.append(text);

                const element = dom.ce("div");
                dom.cl.add(element, "memberTooltip-report");
                element.append(button);

                return element;
            })(),

            baseTooltipNote: (() => {
                const input = dom.ce("input");
                dom.cl.add(input, "input");
                input.placeholder = STR.addNote;
                input.type = "text";

                const svg = dom.ceNS("http://www.w3.org/2000/svg", "svg");
                dom.attr(svg, "viewBox", "0 0 448 512");
                svg.append(dom.ceNS("http://www.w3.org/2000/svg", "path"));

                const text = dom.ce("span");
                dom.text(text, STR.save);

                const button = dom.ce("a");
                dom.cl.add(button, "button button--link");
                button.append(svg, text);

                const element = dom.ce("div");
                dom.cl.add(element, "memberTooltip-note");
                element.append(input, button);

                return element;
            })(),

            baseTooltipFindMenu: (() => {
                const menuHeader = dom.ce("h4");
                dom.cl.add(menuHeader, "menu-header");
                dom.text(menuHeader, STR.findContent);

                const menuContent = dom.ce("div");
                dom.cl.add(menuContent, "menu-content");
                menuContent.append(menuHeader);

                const element = dom.ce("div");
                dom.cl.add(element, "menu");
                dom.attr(element, "data-menu", "menu");
                element.append(menuContent);

                return element;
            })(),

            baseFindAllContentsBy: (() => {
                const element = dom.ce("a");
                dom.cl.add(element, "menu-linkRow");
                dom.attr(element, "rel", "nofollow");
                dom.attr(element, "data-xf-click", "overlay");

                return element;
            })(),

            baseFindAllThreadsBy: (() => {
                const element = dom.ce("a");
                dom.cl.add(element, "menu-linkRow");
                dom.attr(element, "rel", "nofollow");
                dom.attr(element, "data-xf-click", "overlay");

                return element;
            })(),

            tooltipReport(userId) {
                const element = dom.clone(BASE.baseTooltipReport);
                dom.attr(element.firstElementChild, "href", `/sosyal/uye/${ userId }/report`);

                return element;
            },

            tooltipNote(userId) {
                const element = dom.clone(BASE.baseTooltipNote);
                dom.attr(element, "data-user-id", userId);
                element.firstElementChild.value = settings[`${ forum }Notes`][userId] || "";
                element.firstElementChild.addEventListener("keydown", noteEnterHandler);
                element.lastElementChild.addEventListener("click", noteSaveHandler);

                return element;
            },

            tooltipSeperator: (() => {
                const element = dom.ce("hr");
                dom.cl.add(element, "memberTooltip-separator");

                return element;
            })(),

            tooltipFind: (() => {
                const text = dom.ce("span");
                dom.text(text, STR.find);

                const element = dom.ce("button");
                dom.cl.add(element, "button--link menuTrigger button");
                dom.attr(element, "data-xf-click", "menu");
                element.type = "button";
                element.append(text);

                return element;
            })(),

            tooltipFindMenu(userId, userName) {
                const element = dom.clone(BASE.baseTooltipFindMenu);
                element.firstElementChild.append(
                    BASE.findAllContentBy(userId, userName),
                    BASE.findAllThreadsBy(userId, userName),
                );

                return element;
            },

            findAllContentBy(userId, userName) {
                const element = dom.clone(BASE.baseFindAllContentsBy);
                dom.attr(element, "href", `/sosyal/ara/member?user_id=${ userId }`);
                dom.text(element, STR.findAllContentBy(userName));

                return element;
            },

            findAllThreadsBy(userId, userName) {
                const element = dom.clone(BASE.baseFindAllThreadsBy);
                dom.attr(element, "href", `/sosyal/ara/member?user_id=${ userId }&content=thread`);
                dom.text(element, STR.findAllThreadsBy(userName));

                return element;
            },
        },
        {
            get(target, prop) {
                return target[prop] instanceof Element
                    ? dom.clone(target[prop])
                    : target[prop].bind(target);
            },
        },
    );


    const settings = await chrome.storage.local.get([
        `${ forum }Notes`,
        "settingNotes",
    ]);
    const NOTES = settings["settingNotes"];

    waitForElementToExist("body").then(elem => {
        observeForNewTooltips();
    });

    waitForElementToExist(".memberHeader-buttons").then(elem => {
        if (NOTES) {
            addProfileNote();
        }
    });

    function addTooltipItems(elem) {
        if (!qs(elem, ".tooltip-content-inner .memberTooltip")) {
            return;
        }

        const userId = qs(elem, ".memberTooltip-avatar>a").dataset.userId;

        addReportButton(elem, userId);
        addFindButton(elem, userId);

        if (NOTES) {
            addNote(elem, userId);
        }
    }

    function addReportButton(elem, userId) {
        if (hasReportButton(elem)) {
            return;
        }

        qs(elem, ".memberTooltip-headerInfo").prepend(
            BASE.tooltipReport(userId),
        );
    }

    function addFindButton(elem, userId) {
        if (hasFindButton(elem)) {
            return;
        }

        const userName = dom.text(qs(elem, ".memberTooltip-nameWrapper>a"));

        qs(elem, ".memberTooltip-actions").append(
            BASE.tooltipFind,
            BASE.tooltipFindMenu(userId, userName),
        );
    }

    function addNote(elem, userId) {
        if (hasNote(elem)) {
            return;
        }

        if (isSelfNote(userId)) {
            return;
        }

        qs(elem, ".memberTooltip-info").before(
            BASE.tooltipNote(userId),
            BASE.tooltipSeperator
        );
    }

    function addProfileNote() {
        const userId = qs(".memberHeader-avatar>.avatarWrapper>:is(a,span)").dataset.userId;

        if (isSelfNote(userId)) {
            return;
        }

        qs(".memberHeader-buttons").append(
            BASE.tooltipNote(userId),
        );
    }

    function noteEnterHandler(event) {
        if (event.key === "Enter") {
            event.currentTarget.nextElementSibling.click();
        }
    }

    function noteSaveHandler(event) {
        const note = event.currentTarget.previousElementSibling.value;
        const userId = event.currentTarget.parentElement.dataset.userId;

        settings[`${ forum }Notes`][parseInt(userId, 10)] = note;

        if (!note.length) {
            delete settings[`${ forum }Notes`][parseInt(userId, 10)];
        }

        chrome.storage.local.set({
            [`${ forum }Notes`]: settings[`${ forum }Notes`],
        });

        chrome.runtime.sendMessage({
            type: "noteSavedMessage",
        });
    }

    function hasReportButton(elem) {
        return qs(elem, ".button--link[href$='report']");
    }

    function hasFindButton(elem) {
        return qs(elem, ".memberTooltip .memberTooltip-actions>.menu");
    }

    function hasNote(elem) {
        return qs(elem, ".memberTooltip .memberTooltip-note");
    }

    function isSelfNote(userId) {
        // if not member
        return qs(".p-navgroup--member") && userId === qs("a[href='/sosyal/hesap/']>span").dataset.userId;
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
