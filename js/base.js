self.forum = self.forum || window.location.hostname.replace(/(?:www.)?(.*).net/, "$1");

self.BASE = self.BASE || new Proxy(
    {
        baseReportButton: (() => {
            const element = document.createElement("a");
            element.className = "actionBar-action actionBar-action--report";
            element.textContent = STR.report;
            element.setAttribute("data-xf-click", "overlay");

            return element;
        })(),

        baseUserButton: (() => {
            const element = document.createElement("a");
            element.className = "actionBar-action actionBar-action--menuItem";
            element.textContent = STR.userBlock;
            element.setAttribute("blocktype", `${ forum }User`);
            element.title = STR.userBlock;

            return element;
        })(),

        baseAvatarButton: (() => {
            const element = document.createElement("a");
            element.className = "actionBar-action actionBar-action--menuItem";
            element.textContent = STR.avatarBlock;
            element.setAttribute("blocktype", `${ forum }Avatar`);
            element.title = STR.avatarBlock;

            return element;
        })(),

        baseSignatureButton: (() => {
            const element = document.createElement("a");
            element.className = "actionBar-action actionBar-action--menuItem";
            element.textContent = STR.signatureBlock;
            element.setAttribute("blocktype", `${ forum }Signature`);
            element.title = STR.signatureBlock;

            return element;
        })(),

        actionBar: (() => {
            const element = document.createElement("div");
            element.className = "message-actionBar actionBar";

            return element;
        })(),

        internalActionBar: (() => {
            const element = document.createElement("div");
            element.className = "actionBar-set actionBar-set--internal";

            return element;
        })(),

        reportButton(postId) {
            const element = BASE.baseReportButton;
            element.setAttribute("href", `/sosyal/mesaj/${ postId }/report`);

            return element;
        },

        userButton(userId, isBlocked) {
            const element = BASE.baseUserButton;

            if (isBlocked) {
                element.title = STR.userUnblock;
                element.textContent = STR.userUnblock;
            }

            element.setAttribute("data-user-id", userId);
            element.addEventListener("click", blockHandler);

            return element;
        },

        avatarButton(userId, isBlocked) {
            const element = BASE.baseAvatarButton;

            if (isBlocked) {
                element.title = STR.avatarUnblock;
                element.textContent = STR.avatarUnblock;
            }

            element.setAttribute("data-user-id", userId);
            element.addEventListener("click", blockHandler);

            return element;
        },

        signatureButton(userId, isBlocked) {
            const element = BASE.baseSignatureButton;

            if (isBlocked) {
                element.title = STR.signatureUnblock;
                element.textContent = STR.signatureUnblock;
            }

            element.setAttribute("data-user-id", userId);
            element.addEventListener("click", blockHandler);

            return element;
        },

        actionBarMenu: (() => {
            const element = document.createElement("a");
            element.className = "actionBar-action actionBar-action--menuTrigger";
            element.setAttribute("data-xf-click", "menu");
            element.setAttribute("title", STR.actionBarMenu);
            element.setAttribute("role", "button");
            element.setAttribute("tabindex", "0");
            element.setAttribute("aria-expanded", "false");
            element.setAttribute("aria-haspopup", "true");
            element.textContent = "•••";

            return element;
        })(),

        actionBarMenuList: (() => {
            const menuHeader = document.createElement("h4");
            menuHeader.className = "menu-header";
            menuHeader.textContent = STR.actionBarMenu;

            const menuBuilderTarget = document.createElement("div");
            menuBuilderTarget.className = "js-menuBuilderTarget";

            const menuContent = document.createElement("div");
            menuContent.className = "menu-content";
            menuContent.append(menuHeader, menuBuilderTarget);

            const element = document.createElement("div");
            element.className = "menu";
            element.setAttribute("data-menu", "menu");
            element.setAttribute("aria-hidden", "true");
            element.setAttribute("data-menu-builder", "actionBar");
            element.append(menuContent);

            return element;
        })(),

        baseTooltipReport: (() => {
            const text = document.createElement("span");
            text.textContent = STR.report;

            const button = document.createElement("a");
            button.className = "button button--link";
            button.setAttribute("data-xf-click", "overlay");
            button.append(text);

            const element = document.createElement("div");
            element.className = "memberTooltip-report";
            element.append(button);

            return element;
        })(),

        baseTooltipNote: (() => {
            const input = document.createElement("input");
            input.className = "input";
            input.placeholder = STR.addNote;
            input.type = "text";

            const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
            svg.setAttribute("viewBox", "0 0 448 512");
            svg.append(document.createElementNS("http://www.w3.org/2000/svg", "path"));

            const text = document.createElement("span");
            text.textContent = STR.save;

            const button = document.createElement("a");
            button.className = "button button--link";
            button.append(svg, text);

            const element = document.createElement("div");
            element.className = "memberTooltip-note";
            element.append(input, button);

            return element;
        })(),

        baseTooltipFindMenu: (() => {
            const menuHeader = document.createElement("h4");
            menuHeader.className = "menu-header";
            menuHeader.textContent = STR.findContent;

            const menuContent = document.createElement("div");
            menuContent.className = "menu-content";
            menuContent.append(menuHeader);

            const element = document.createElement("div");
            element.className = "menu";
            element.setAttribute("data-menu", "menu");
            element.append(menuContent);

            return element;
        })(),

        baseFindAllContentsBy: (() => {
            const element = document.createElement("a");
            element.className = "menu-linkRow";
            element.setAttribute("rel", "nofollow");
            element.setAttribute("data-xf-click", "overlay");

            return element;
        })(),

        baseFindAllThreadsBy: (() => {
            const element = document.createElement("a");
            element.className = "menu-linkRow";
            element.setAttribute("rel", "nofollow");
            element.setAttribute("data-xf-click", "overlay");

            return element;
        })(),

        tooltipReport(userId) {
            const element = BASE.baseTooltipReport;
            element.firstElementChild.setAttribute("href", `/sosyal/uye/${ userId }/report`);

            return element;
        },

        tooltipNote(userId, notes) {
            const element = BASE.baseTooltipNote;
            element.setAttribute("data-user-id", userId);
            element.firstElementChild.value = notes[userId] || "";
            element.firstElementChild.addEventListener("keydown", noteEnterHandler);
            element.lastElementChild.addEventListener("click", noteSaveHandler);

            return element;
        },

        tooltipSeperator: (() => {
            const element = document.createElement("hr");
            element.className = "memberTooltip-separator";

            return element;
        })(),

        tooltipActions: (() => {
            const element = document.createElement("div");
            element.className = "memberTooltip-actions";

            return element;
        })(),

        tooltipFind: (() => {
            const text = document.createElement("span");
            text.textContent = STR.find;

            const element = document.createElement("button");
            element.className = "button--link menuTrigger button";
            element.setAttribute("data-xf-click", "menu");
            element.type = "button";
            element.append(text);

            return element;
        })(),

        tooltipFindMenu(userId, userName) {
            const element = BASE.baseTooltipFindMenu;
            element.firstElementChild.append(
                BASE.findAllContentBy(userId, userName),
                BASE.findAllThreadsBy(userId, userName),
            );

            return element;
        },

        findAllContentBy(userId, userName) {
            const element = BASE.baseFindAllContentsBy;
            element.setAttribute("href", `/sosyal/ara/member?user_id=${ userId }`);
            element.textContent = STR.findAllContentBy(userName);

            return element;
        },

        findAllThreadsBy(userId, userName) {
            const element = BASE.baseFindAllThreadsBy;
            element.setAttribute("href", `/sosyal/ara/member?user_id=${ userId }&content=thread`);
            element.textContent = STR.findAllThreadsBy(userName);

            return element;
        },
    },
    {
        get(target, prop) {
            return target[prop] instanceof Element
                ? target[prop].cloneNode(true)
                : target[prop].bind(target);
        },
    },
);
