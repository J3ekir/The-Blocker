const FORUMS = [
    "techolay",
    "technopat",
];
const VALUE_TYPES = [
    "UserCount",
    "AvatarCount",
    "SignatureCount",
];
const VALUES = FORUMS.flatMap(forum => VALUE_TYPES.map(type => `${ forum }${ type }`));

chrome.storage.local.get().then(settings => {
    VALUES.forEach(value => {
        dom.text(`#${ value }`, settings[value]);
    });

    chrome.tabs.query({
        active: true,
        currentWindow: true,
    }, tabs => {
        const forum = tabs[0]?.url
            ? new URL(tabs[0].url).hostname.replace(/(?:www.)?(.*).net/, "$1")
            : settings["lastForum"];

        if (qs(`[data-forum="${ forum }"]`)) {
            settings["lastForum"] = forum;
        }

        dom.cl.add(`[data-forum="${ settings["lastForum"] }"]`, "active");

        chrome.storage.local.set({
            lastForum: settings["lastForum"],
        });
    });
});

chrome.storage.onChanged.addListener(changes => {
    Object.entries(changes).forEach(([key, { oldValue, newValue }]) => {
        if (VALUES.includes(key)) {
            dom.text(`#${ key }`, newValue);
        }
    });
});

qsa(".tabButton").forEach(elem => {
    elem.addEventListener("click", event => {
        const forum = dom.attr(event.currentTarget, "data-forum");

        dom.cl.remove(".active", "active");
        dom.cl.add(`[data-forum="${ forum }"]`, "active");

        chrome.storage.local.set({
            lastForum: forum,
        });
    });
});
