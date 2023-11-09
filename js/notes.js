var baseMemberTooltipNote;
var baseInputNote;
var baseButtonNote;
var baseSVGNote;
var baseSeparator;


init();


async function init() {
    await storage.init();

    if (storage.settings["settingsNotes"]) {
        initBaseButtons();
        baseInputNote.placeholder = i18n.get("settingsNotesPlaceholder");
        baseButtonNote.lastElementChild.textContent = i18n.get("settingsNotesSave");

        waitForElementToExist("body").then(elem => {
            observe();
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

function addNote(elem) {
    var userId = dom.attr(qs(elem, ".memberTooltip-avatar>a"), "data-user-id");

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
    });

    qs(elem, ".memberTooltip-info").before(
        tooltipNote,
        dom.clone(baseSeparator)
    );
}

function selfNoteCheck(userId) {
    // if not member
    return qs(".p-navgroup--member") && userId === dom.attr(`a[href="/sosyal/hesap/"]>span`, "data-user-id");
}

function observe() {
    const targetNode = document.body;
    new MutationObserver(async (mutationList, observer) => {
        mutationList.forEach(mutation => {
            mutation.addedNodes.forEach(elem => {
                if (elem.nodeType === Node.ELEMENT_NODE
                    && qs(elem, ".memberTooltip")
                    && !qs(elem, ".memberTooltip-note")
                ) {
                    addNote(elem);
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
