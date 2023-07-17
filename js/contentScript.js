i18n.init();

const buttonArray = ["User", "Avatar", "Signature"];
const CSS_HIDE = "theBlocker-hide";
const CSS_SHOW = "theBlocker-show";

var cloneInternal = dom.ce("div");
cloneInternal.className = "actionBar-set actionBar-set--internal";

var cloneReportButton = dom.ce("a");
cloneReportButton.className = "actionBar-action actionBar-action--report";
dom.attr(cloneReportButton, "data-xf-click", "overlay");

self.cloneUserButton = dom.ce("a");
var cloneSvg = dom.ceNS("http://www.w3.org/2000/svg", "svg");
dom.attr(cloneSvg, "viewBox", "0 0 512 512");
cloneSvg.appendChild(dom.ceNS("http://www.w3.org/2000/svg", "path"));
self.cloneUserButton.append(cloneSvg, dom.ce("span"));

self.cloneAvatarButton = self.cloneUserButton.cloneNode(true);
self.cloneSignatureButton = self.cloneUserButton.cloneNode(true);

self.cloneUserButton.className = "actionBar-action actionBar-action--block userButton";
self.cloneAvatarButton.className = "actionBar-action actionBar-action--block avatarButton";
self.cloneSignatureButton.className = "actionBar-action actionBar-action--block signatureButton";

(async () => {
    var settings = await storage.get(null);

    var postIds;
    var userIds;
    var messages;

    initCloneButtons();
    blockButtons();
    observe();
    
    function initCloneButtons() {
        cloneReportButton.textContent = i18n.get("contentScriptReportButtonText");

        self.cloneUserButton.title = i18n.get("contentScriptUserButtonTitle");
        self.cloneAvatarButton.title = i18n.get("contentScriptAvatarButtonTitle");
        self.cloneSignatureButton.title = i18n.get("contentScriptSignatureButtonTitle");
        
        self.cloneUserButton.lastElementChild.textContent = i18n.get("contentScriptUserButtonText");
        self.cloneAvatarButton.lastElementChild.textContent = i18n.get("contentScriptAvatarButtonText");
        self.cloneSignatureButton.lastElementChild.textContent = i18n.get("contentScriptSignatureButtonText");
    }

    function blockButtons() {
        postIds = Array.prototype.map.call(dom.qsa(".message-userContent.lbContainer.js-lbContainer"), node => dom.attr(node, "data-lb-id").slice(5));
        userIds = Array.prototype.map.call(dom.qsa(".message-name>:is(a, span)"), node => dom.attr(node, "data-user-id"));
        messages = dom.qsa(".message-actionBar.actionBar");

        // if article
        if (userIds.length === postIds.length - 1) {
            userIds.splice(0, 0, dom.attr(dom.qs(".message-articleUserName>a"), "data-user-id"));
        }

        // report ban and reaction ban
        if (messages.length === 0) {
            var cloneActionBar = dom.ce("div");
            cloneActionBar.className = "message-actionBar actionBar";

            dom.qsa(".message-footer").forEach((elem) => {
                elem.prepend(cloneActionBar.cloneNode(true));
            });

            messages = dom.qsa(".message-actionBar.actionBar");
        }

        messages.forEach((elem, i) => {
            // no report and no edit
            if (!elem.querySelector(".actionBar-set.actionBar-set--internal")) {
                elem.append(cloneInternal.cloneNode(true));
            }

            // no report
            if (!elem.querySelector(".actionBar-action.actionBar-action--report")) {
                var reportButton = cloneReportButton.cloneNode(true);
                dom.attr(reportButton, "href", `/sosyal/mesaj/${postIds[i]}/report`);
                elem.lastElementChild.prepend(reportButton);
            }

            if (!elem.querySelector(".actionBar-action--block")) {
                elem.lastElementChild.append(...makeBlockButtons(userIds[i]));
            }
        });
    }

    function makeBlockButtons(userId) {
        return buttonArray.map((elem) => {
            if (settings[`settingsButtons${elem}`]) {
                var button = window[`clone${elem}Button`].cloneNode(true);

                if (selfBlockCheck(userId)) {
                    button.classList.add(CSS_HIDE);
                }
                else {
                    if (settings[`${elem.toLowerCase()}Array`].includes(userId)) {
                        button.title = i18n.get(`contentScript${elem}ButtonUnblockTitle`);
                        button.lastElementChild.textContent = i18n.get(`contentScript${elem}ButtonUnblockText`);
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
        var typeCapital = `${type[0].toUpperCase()}${type.slice(1)}`;
        var buttons = dom.qsa(`.actionBar-action--block.${type}Button`);
        var query;

        settings = await storage.get(null);

        switch (type) {
            case "user":
                query = dom.qsa(`:is(article:has(a[data-user-id="${userId}"]),blockquote[data-attributes="member: ${userId}"],.block-row:has(a[data-user-id="${userId}"]))`);
                break;
            case "avatar":
                query = dom.qsa(`a[data-user-id="${userId}"]>img`);
                break;
            case "signature":
                query = dom.qsa(`.message-signature:has(.js-userSignature-${userId})`);
                break;
            default:
                break;
        }

        var isBlocked = settings[`${type}Array`].includes(userId);
        var blockFunction = isBlocked ? unblock : block;
        var title = isBlocked
            ? i18n.get(`contentScript${typeCapital}ButtonTitle`)
            : i18n.get(`contentScript${typeCapital}ButtonUnblockTitle`);
        var textContent = isBlocked
            ? i18n.get(`contentScript${typeCapital}ButtonText`)
            : i18n.get(`contentScript${typeCapital}ButtonUnblockText`);

        blockFunction(type, userId);

        query.forEach((elem) => {
            elem.classList.toggle(CSS_HIDE, !isBlocked);
            elem.classList.toggle(CSS_SHOW, isBlocked);
        });

        userIds.forEach((elem, i) => {
            if (elem === userId) {
                buttons[i].title = title;
                buttons[i].lastElementChild.textContent = textContent;
            }
        });
    }

    function block(buttonType, userId) {
        chrome.runtime.sendMessage({
            type: "block",
            buttonType: buttonType,
            userId: userId
        });
    }

    function unblock(buttonType, userId) {
        chrome.runtime.sendMessage({
            type: "unblock",
            buttonType: buttonType,
            userId: userId
        });
    }

    function selfBlockCheck(userId) {
        // if not member
        if (!dom.qs(".p-navgroup--member")) {
            return false;
        }

        return userId === dom.attr(dom.qs(`a[href="/sosyal/hesap/"]>span`), "data-user-id");
    }

    async function observe() {
        // const targetNode = dom.qs(`.p-body-pageContent`);
        const targetNode = dom.qs(`.block-body.js-replyNewMessageContainer`);
        const config = { attributes: false, childList: true, subtree: true };
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
})();
