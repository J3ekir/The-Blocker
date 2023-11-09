var baseMemberTooltipNote;
var baseInputNote;
var baseButtonNote;
var baseSVGNote;


init();


async function init() {
    await storage.init();

    if (storage.settings["settingsNotes"]) {
        initBaseButtons();
        baseInputNote.placeholder = i18n.get("contentScriptNotesPlaceholder");
        baseButtonNote.lastElementChild.textContent = i18n.get("contentScriptNotesSave");

        var meta = dom.ce("meta");
        dom.attr(meta, "name", "noteSaveMessage");
        dom.attr(meta, "content", i18n.get("contentScriptNotesSavedMessage"));
        document.head.append(meta);

        waitForElementToExist(".p-body-pageContent").then(elem => {
            addProfileNote();
        });
    }
}

function initBaseButtons() {
    baseMemberTooltipNote = dom.ce("div");
    baseInputNote = dom.ce("input");
    baseButtonNote = dom.ce("a");
    baseSVGNote = dom.ceNS("http://www.w3.org/2000/svg", "svg");
    baseSVGNote.append(dom.ceNS("http://www.w3.org/2000/svg", "path"));
    baseButtonNote.append(baseSVGNote, dom.ce("span"));
    baseMemberTooltipNote.append(baseInputNote, baseButtonNote);

    baseMemberTooltipNote.className = "memberTooltip-note";
    baseInputNote.className = "input";
    baseButtonNote.className = "button button--link";
    baseInputNote.type = "text";
    dom.attr(baseSVGNote, "viewBox", "0 0 448 512");

    baseSeparator = dom.ce("hr");
    dom.cl.add(baseSeparator, "memberTooltip-separator");
}

async function addProfileNote() {
    // hidden profile
    if (!qs(".memberHeader")) {
        return;
    }

    var userId = dom.attr(".memberHeader-avatar>.avatarWrapper>a", "data-user-id");

    if (selfNoteCheck(userId)) {
        return;
    }

    var tooltipNote = dom.clone(baseMemberTooltipNote);
    dom.attr(tooltipNote, "data-user-id", userId);

    if (storage.settings["notes"][userId]) {
        tooltipNote.firstElementChild.value = storage.settings["notes"][userId];
    }

    tooltipNote.lastElementChild.addEventListener("click", async event => {
        var note = event.currentTarget.previousElementSibling.value;
        var userId = dom.attr(event.currentTarget.parentElement, "data-user-id");

        if (note.length) {
            storage.settings["notes"][userId] = note;
        }
        else {
            delete storage.settings["notes"][userId];
        }

        storage.set({ notes: storage.settings["notes"] });

        qsa(`.memberTooltip-note[data-user-id="${ userId }"]>.input`).forEach(elem => {
            elem.value = note;
        });

        chrome.runtime.sendMessage({
            type: "noteSavedMessage",
        });
    });

    qs(".memberHeader-buttons").append(tooltipNote);
}

function selfNoteCheck(userId) {
    // if not member
    return qs(".p-navgroup--member") && userId === dom.attr(`a[href="/sosyal/hesap/"]>span`, "data-user-id");
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
