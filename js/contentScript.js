i18n.init();

const buttonArray = ["User", "Avatar", "Signature"];
const CSS_HIDE = "theBlocker-hide";
const CSS_SHOW = "theBlocker-show";

var settings;

var cloneInternal = dom.ce("div");
cloneInternal.className = "actionBar-set actionBar-set--internal";

var cloneReportButton = dom.ce("a");
cloneReportButton.className = "actionBar-action actionBar-action--report";
dom.attr(cloneReportButton, "data-xf-click", "overlay");

self.cloneUserButton = dom.ce("a");
var cloneSvg = dom.ceNS("http://www.w3.org/2000/svg", "svg");
dom.attr(cloneSvg, "viewBox", "0 0 512 512");
cloneSvg.append(dom.ceNS("http://www.w3.org/2000/svg", "path"));
self.cloneUserButton.append(cloneSvg, dom.ce("span"));

self.cloneAvatarButton = dom.clone(self.cloneUserButton);
self.cloneSignatureButton = dom.clone(self.cloneUserButton);

self.cloneUserButton.className = "actionBar-action actionBar-action--block userButton";
self.cloneAvatarButton.className = "actionBar-action actionBar-action--block avatarButton";
self.cloneSignatureButton.className = "actionBar-action actionBar-action--block signatureButton";


storage.get(null).then(response => {
    settings = response;

    waitForElementToExist(".message-actionBar.actionBar").then(elem => {
        init();
    });
});

async function init() {
    var postIds;
    var userIds;
    var messages;

    initCloneButtons();
    blockButtons();
    observe();

    function initCloneButtons() {
        dom.text(cloneReportButton, i18n.get("contentScriptReportButtonText"));

        self.cloneUserButton.title = i18n.get("contentScriptUserButtonTitle");
        self.cloneAvatarButton.title = i18n.get("contentScriptAvatarButtonTitle");
        self.cloneSignatureButton.title = i18n.get("contentScriptSignatureButtonTitle");

        dom.text(self.cloneUserButton.lastElementChild, i18n.get("contentScriptUserButtonText"));
        dom.text(self.cloneAvatarButton.lastElementChild, i18n.get("contentScriptAvatarButtonText"));
        dom.text(self.cloneSignatureButton.lastElementChild, i18n.get("contentScriptSignatureButtonText"));
    }

    function blockButtons() {
        postIds = Array.from(qsa(".message-userContent.lbContainer.js-lbContainer"), node => dom.attr(node, "data-lb-id").slice(5));
        userIds = Array.from(qsa(".message-name>:is(a, span)"), node => dom.attr(node, "data-user-id"));
        messages = qsa(".message-actionBar.actionBar");

        // if article
        if (userIds.length === postIds.length - 1) {
            userIds.splice(0, 0, dom.attr(".message-articleUserName>a", "data-user-id"));
        }

        // report ban and reaction ban
        if (messages.length === 0) {
            var cloneActionBar = dom.ce("div");
            cloneActionBar.className = "message-actionBar actionBar";

            qsa(".message-footer").forEach((elem) => {
                elem.prepend(dom.clone(cloneActionBar));
            });

            messages = qsa(".message-actionBar.actionBar");
        }

        messages.forEach((elem, i) => {
            // no report and no edit
            if (!elem.querySelector(".actionBar-set.actionBar-set--internal")) {
                elem.append(dom.clone(cloneInternal));
            }

            // no report
            if (!elem.querySelector(".actionBar-action.actionBar-action--report")) {
                var reportButton = dom.clone(cloneReportButton);
                dom.attr(reportButton, "href", `/sosyal/mesaj/${ postIds[i] }/report`);
                elem.lastElementChild.prepend(reportButton);
            }

            if (!elem.querySelector(".actionBar-action--block")) {
                elem.lastElementChild.append(...makeBlockButtons(userIds[i]));
            }
        });
    }

    function makeBlockButtons(userId) {
        return buttonArray.map((elem) => {
            if (settings[`settingsButtons${ elem }`]) {
                var button = dom.clone(window[`clone${ elem }Button`]);

                if (selfBlockCheck(userId)) {
                    dom.cl.add(button, CSS_HIDE);
                }
                else {
                    if (settings[`${ elem.toLowerCase() }Array`].includes(userId)) {
                        button.title = i18n.get(`contentScript${ elem }ButtonUnblockTitle`);
                        dom.text(button.lastElementChild, i18n.get(`contentScript${ elem }ButtonUnblockText`));
                    }

                    button.addEventListener("click", blockToggle);
                }

                return button;
            }
        })
        .filter(Boolean);
    }

    async function blockToggle(event) {
        var userId = dom.attr(event.currentTarget.closest("article").querySelector("a[data-user-id]"), "data-user-id");
        var type = event.currentTarget.classList.item(event.currentTarget.classList.length - 1).replace(/Button$/, "");
        var typeCapital = `${ type[0].toUpperCase() }${ type.slice(1) }`;
        var buttons = qsa(`.actionBar-action--block.${ type }Button`);
        var query;

        settings = await storage.get(null);

        switch (type) {
            case "user":
                query = qsa(`:is(article:has(a[data-user-id="${ userId }"]),blockquote[data-attributes="member: ${ userId }"],.block-row:has(a[data-user-id="${ userId }"]))`);
                break;
            case "avatar":
                query = qsa(`a[data-user-id="${ userId }"]>img`);
                break;
            case "signature":
                query = qsa(`.message-signature:has(.js-userSignature-${ userId })`);
                break;
            default:
                break;
        }

        var isBlocked = settings[`${ type }Array`].includes(userId);
        var blockFunction = isBlocked ? unblock : block;
        var title = isBlocked
            ? i18n.get(`contentScript${ typeCapital }ButtonTitle`)
            : i18n.get(`contentScript${ typeCapital }ButtonUnblockTitle`);
        var textContent = isBlocked
            ? i18n.get(`contentScript${ typeCapital }ButtonText`)
            : i18n.get(`contentScript${ typeCapital }ButtonUnblockText`);

        blockFunction(type, userId);

        query.forEach((elem) => {
            dom.cl.toggle(elem, CSS_HIDE, !isBlocked);
            dom.cl.toggle(elem, CSS_SHOW, isBlocked);
        });

        userIds.forEach((elem, i) => {
            if (elem === userId) {
                buttons[i].title = title;
                dom.text(buttons[i].lastElementChild, textContent);
            }
        });
    }

    function block(buttonType, userId) {
        chrome.runtime.sendMessage({
            type: "block",
            buttonType: buttonType,
            userId: userId,
        });
    }

    function unblock(buttonType, userId) {
        chrome.runtime.sendMessage({
            type: "unblock",
            buttonType: buttonType,
            userId: userId,
        });
    }

    function selfBlockCheck(userId) {
        // if not member
        return qs(".p-navgroup--member") && userId === dom.attr(`a[href="/sosyal/hesap/"]>span`, "data-user-id");
    }

    async function observe() {
        // const targetNode = qs(".p-body-pageContent");
        const targetNode = qs(".block-body.js-replyNewMessageContainer");
        const config = { childList: true, subtree: true };
        const callback = async (mutationList, observer) => {
            for (const mutation of mutationList) {
                if (mutation.type === "childList") {
                    blockButtons();
                    break;
                }
            }
        };
        const observer = new MutationObserver(callback);
        if (targetNode) {
            observer.observe(targetNode, config);
        }
        //observer.disconnect();
    }
}

function waitForElementToExist(selector) {
    return new Promise((resolve) => {
        if (document.querySelector(selector)) {
            return resolve(document.querySelector(selector));
        }
        new MutationObserver((_, observer) => {
            if (document.querySelector(selector)) {
                observer.disconnect();
                return resolve(document.querySelector(selector));
            }
        })
            .observe(
                document, { subtree: true, childList: true }
            );
    });
}
