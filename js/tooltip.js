(async () => {
    const STR = new Proxy(
        {
            LANG: dom.attr("html", "lang"),
            "en-US": {
                save: "Save",
                addNote: "Add note",
                report: "Report",
                find: "Find",
                findContent: "Find content",
                findAllContentBy(arg) {
                    return `Find all content by ${ arg }`;
                },
                findAllThreadsBy(arg) {
                    return `Find all threads by ${ arg }`;
                },
            },
            "tr-TR": {
                save: "Kaydet",
                addNote: "Not ekle",
                report: "Rapor",
                find: "Bul",
                findContent: "İçerik bul",
                findAllContentBy(arg) {
                    return `${ arg } tarafından gönderilen tüm içeriği arattır`;
                },
                findAllThreadsBy(arg) {
                    return `${ arg } tarafından açılan tüm konuları arattır`;
                },
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

    const BASE = new Proxy(
        {
            baseTooltipReport: (() => {
                var text = dom.ce("span");
                dom.text(text, STR.report);

                var button = dom.ce("a");
                dom.cl.add(button, "button button--link");
                dom.attr(button, "data-xf-click", "overlay");
                button.append(text);

                var element = dom.ce("div");
                dom.cl.add(element, "memberTooltip-report");
                element.append(button);

                return element;
            })(),

            baseTooltipNote: (() => {
                var input = dom.ce("input");
                dom.cl.add(input, "input");
                input.placeholder = STR.addNote;
                input.type = "text";

                var svg = dom.ceNS("http://www.w3.org/2000/svg", "svg");
                dom.attr(svg, "viewBox", "0 0 448 512");
                svg.append(dom.ceNS("http://www.w3.org/2000/svg", "path"));

                var text = dom.ce("span");
                dom.text(text, STR.save);

                var button = dom.ce("a");
                dom.cl.add(button, "button button--link");
                button.append(svg, text);

                var element = dom.ce("div");
                dom.cl.add(element, "memberTooltip-note");
                element.append(input, button);

                return element;
            })(),

            baseTooltipFindMenu: (() => {
                var menuHeader = dom.ce("h4");
                dom.cl.add(menuHeader, "menu-header");
                dom.text(menuHeader, STR.findContent);

                var menuContent = dom.ce("div");
                dom.cl.add(menuContent, "menu-content");
                menuContent.append(menuHeader);

                var element = dom.ce("div");
                dom.cl.add(element, "menu");
                dom.attr(element, "data-menu", "menu");
                element.append(menuContent);

                return element;
            })(),

            baseFindAllContentsBy: (() => {
                var findAllContentsBy = dom.ce("a");
                dom.cl.add(findAllContentsBy, "menu-linkRow");
                dom.attr(findAllContentsBy, "rel", "nofollow");
                dom.attr(findAllContentsBy, "data-xf-click", "overlay");

                return findAllContentsBy;
            })(),

            baseFindAllThreadsBy: (() => {
                var findAllThreadsBy = dom.ce("a");
                dom.cl.add(findAllThreadsBy, "menu-linkRow");
                dom.attr(findAllThreadsBy, "rel", "nofollow");
                dom.attr(findAllThreadsBy, "data-xf-click", "overlay");

                return findAllThreadsBy;
            })(),

            tooltipReport(userId) {
                var tooltipReport = dom.clone(BASE.baseTooltipReport);
                tooltipReport.firstElementChild.href = `/sosyal/uye/${ userId }/report`;

                return tooltipReport;
            },

            tooltipNote(userId) {
                var tooltipNote = dom.clone(BASE.baseTooltipNote);
                dom.attr(tooltipNote, "data-user-id", userId);
                tooltipNote.firstElementChild.value = settings["notes"][userId] || "";
                tooltipNote.lastElementChild.addEventListener("click", noteSaveHandler);

                return tooltipNote;
            },

            tooltipSeperator: (() => {
                var element = dom.ce("hr");
                dom.cl.add(element, "memberTooltip-separator");

                return element;
            })(),

            tooltipFind: (() => {
                var text = dom.ce("span");
                dom.text(text, STR.find);

                var element = dom.ce("button");
                dom.cl.add(element, "button--link menuTrigger button");
                dom.attr(element, "data-xf-click", "menu");
                element.type = "button";
                element.append(text);

                return element;
            })(),

            tooltipFindMenu(userId, userName) {
                var tooltipFindMenu = dom.clone(BASE.baseTooltipFindMenu);
                tooltipFindMenu.firstElementChild.append(
                    BASE.findAllContentBy(userId, userName),
                    BASE.findAllThreadsBy(userId, userName),
                );

                return tooltipFindMenu;
            },

            findAllContentBy(userId, userName) {
                var findAllContentBy = dom.clone(BASE.baseFindAllContentsBy);
                dom.attr(findAllContentBy, "href", `/sosyal/ara/member?user_id=${ userId }`);
                dom.text(findAllContentBy, STR.findAllContentBy(userName));

                return findAllContentBy;
            },

            findAllThreadsBy(userId, userName) {
                var findAllThreadsBy = dom.clone(BASE.baseFindAllThreadsBy);
                dom.attr(findAllThreadsBy, "href", `/sosyal/ara/member?user_id=${ userId }&content=thread`);
                dom.text(findAllThreadsBy, STR.findAllThreadsBy(userName));

                return findAllThreadsBy;
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

    var settings = await chrome.storage.local.get([
        "notes",
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

        var userId = dom.attr(qs(elem, ".memberTooltip-avatar>a"), "data-user-id");

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

        var userName = dom.text(qs(elem, ".memberTooltip-nameWrapper>a"));

        qs(elem, ".memberTooltip-actions").append(
            BASE.tooltipFind,
            BASE.tooltipFindMenu(userId, userName),
        );
    }

    async function addNote(elem, userId) {
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

    async function addProfileNote() {
        var userId = dom.attr(".memberHeader-avatar>.avatarWrapper>:is(a,span)", "data-user-id");

        if (isSelfNote(userId)) {
            return;
        }

        qs(".memberHeader-buttons").append(
            BASE.tooltipNote(userId),
        );
    }

    async function noteSaveHandler(event) {
        var note = event.currentTarget.previousElementSibling.value;
        var userId = dom.attr(event.currentTarget.parentElement, "data-user-id");

        if (note.length) {
            settings["notes"][parseInt(userId, 10)] = note;
        }
        else {
            delete settings["notes"][parseInt(userId, 10)];
        }

        chrome.storage.local.set({
            notes: settings["notes"],
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
        return qs(".p-navgroup--member") && userId === dom.attr("a[href='/sosyal/hesap/']>span", "data-user-id");
    }

    chrome.storage.onChanged.addListener(async changes => {
        Object.entries(changes).forEach(([key, { oldValue, newValue }]) => {
            if (key === "notes") {
                // it might be one of three things
                // 1) a new key and value added => new keys are more
                // 2) an existing key and value deleted => new keys are less
                // 3) an existing key's value changed => new keys are the same

                settings["notes"] = newValue;

                var oldKeys = Object.keys(oldValue);
                var newKeys = Object.keys(newValue);
                var keys = oldKeys.length < newKeys.length ? newKeys : oldKeys;
                var userId = keys.find(key => newValue[key] !== oldValue[key]);
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
