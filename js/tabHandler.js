chrome.runtime.sendMessage({
    type: "tabHandlerCSS"
});

var tabWrapper = document.querySelector(`.tab-wrapper.widget-group`);
var buttons = tabWrapper.firstElementChild.firstElementChild.firstElementChild.children;
var cloneMenuHandler = tabWrapper.firstElementChild.cloneNode(true);
var cloneButtons = cloneMenuHandler.firstElementChild.firstElementChild.children;
cloneMenuHandler.style = "margin-top:-12px;margin-bottom:20px;border-bottom:none;border-top:1px solid #414141";
cloneMenuHandler.id = "cloneMenuHandler";


init();


async function init() {
    var result = await chrome.storage.local.get("settingsBottomWidget");

    if (!result["settingsBottomWidget"]) {
        return;
    }

    for (let i = 0; i < cloneButtons.length; ++i) {
        cloneButtons[i].removeAttribute("href");
    
        cloneButtons[i].addEventListener("click", (event) => {
            buttons[i].click();
            buttons[i].scrollIntoView();
            clearIsActive();
            cloneButtons[i].classList.add("is-active");
        });
    }
    
    tabWrapper.appendChild(cloneMenuHandler);

    observe();
}

function clearIsActive() {
    for (const child of cloneButtons) {
        child.classList.remove("is-active");
    }
}

function observe() {
    const targetNode = tabWrapper.firstElementChild.firstElementChild.firstElementChild;
    const config = { attributes: true, childList: true, subtree: true };
    const callback = async (mutationList, observer) => {
        clearIsActive();

        for (let i = 0; i < buttons.length; ++i) {
            if (buttons[i].classList.contains("is-active")) {
                cloneButtons[i].classList.add("is-active");
            }
        }
    };
    const observer = new MutationObserver(callback);
    if (targetNode) {
        observer.observe(targetNode, config);
    }
    //observer.disconnect();
}
