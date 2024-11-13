const STATS = [
    "techolay",
    "technopat",
].flatMap(forum => [
    "UserCount",
    "AvatarCount",
    "SignatureCount",
].map(type => `${ forum }${ type }`));

chrome.storage.local.get(["theme", "lastForum", ...STATS]).then(settings => {
    document.documentElement.setAttribute("theme", settings["theme"]);

    chrome.tabs.query({ active: true, currentWindow: true }, tabs => {
        const forum = tabs[0]?.url
            ? new URL(tabs[0].url).hostname.replace(/(?:www.)?(.*).net/, "$1")
            : settings["lastForum"];

        if (qs(`[data-forum="${ forum }"]`)) {
            settings["lastForum"] = forum;
        }

        qsa(`[data-forum="${ settings["lastForum"] }"]`).forEach(elem => elem.classList.add("active"));

        chrome.storage.local.set({
            lastForum: settings["lastForum"],
        });
    });

    STATS.forEach(value => {
        qs(`#${ value }`).textContent = settings[value];
    });
});

chrome.storage.onChanged.addListener(changes => {
    Object.entries(changes).forEach(([key, { oldValue, newValue }]) => {
        if (STATS.includes(key)) {
            qs(`#${ key }`).textContent = newValue;
        }
        if (key === "theme") {
            document.documentElement.setAttribute(key, newValue);
        }
    });
});

qsa(".tabButton").forEach(elem => {
    elem.addEventListener("click", event => {
        const forum = event.currentTarget.getAttribute("data-forum");

        qsa(".active").forEach(elem => elem.classList.remove("active"));
        qsa(`[data-forum="${ forum }"]`).forEach(elem => elem.classList.add("active"));

        chrome.storage.local.set({
            lastForum: forum,
        });
    });
});
