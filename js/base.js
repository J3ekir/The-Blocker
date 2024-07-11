self.forum = self.forum || window.location.hostname.replace(/(?:www.)?(.*).net/, "$1");

self.BASE = self.BASE || new Proxy(
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

        userButton(users, userId) {
            const element = dom.clone(BASE.baseUserButton);

            if (users.includes(userId)) {
                element.title = STR.userUnblock;
                dom.text(element, STR.userUnblock);
            }

            dom.attr(element, "data-user-id", userId);
            element.addEventListener("click", blockHandler);

            return element;
        },

        avatarButton(avatars, userId) {
            const element = dom.clone(BASE.baseAvatarButton);

            if (avatars.includes(userId)) {
                element.title = STR.avatarUnblock;
                dom.text(element, STR.avatarUnblock);
            }

            dom.attr(element, "data-user-id", userId);
            element.addEventListener("click", blockHandler);

            return element;
        },

        signatureButton(signatures, userId) {
            const element = dom.clone(BASE.baseSignatureButton);

            if (signatures.includes(userId)) {
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

        tooltipNote(notes, userId) {
            const element = dom.clone(BASE.baseTooltipNote);
            dom.attr(element, "data-user-id", userId);
            element.firstElementChild.value = notes[userId] || "";
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
