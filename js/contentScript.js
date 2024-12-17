(async () => {
	if (!window.location.pathname.startsWith("/sosyal/konu/")) { return; }

	const userKey = `${ forum }User`;
	const avatarKey = `${ forum }Avatar`;
	const signatureKey = `${ forum }Signature`;
	let settings;

	waitForElement(".blockMessage--none").then(main);

	async function main() {
		createBlockButtons();
		observeForNewActionBars();
		observeForNewBlockMenus();

		async function createBlockButtons() {
			const postIds = Array.from(qsa(":is(.message--post,.message--article)"), node => node.dataset.content.slice(5));
			const userIds = Array.from(qsa(":is(.message-name,.message-articleUserName)>:is(a,span)"), node => parseInt(node.dataset.userId, 10));
			let messages = qsa(".message-actionBar.actionBar");

			// report ban and reaction ban
			if (messages.length === 0) {
				qsa(".message-footer").forEach(elem => {
					elem.prepend(BASE.actionBar);
				});

				messages = qsa(".message-actionBar.actionBar");
			}

			settings = await chrome.storage.local.get([
				userKey,
				avatarKey,
				signatureKey,
				`${ userKey }Count`,
				`${ avatarKey }Count`,
				`${ signatureKey }Count`,
				"settingUserButton",
				"settingAvatarButton",
				"settingSignatureButton",
			]);
			settings.user = new Set(settings[userKey]);
			settings.avatar = new Set(settings[avatarKey]);
			settings.signature = new Set(settings[signatureKey]);

			messages.forEach((elem, i) => {
				// no report and no edit
				if (!qs(elem, ".actionBar-set.actionBar-set--internal")) {
					elem.append(BASE.internalActionBar);
				}

				// no report
				if (!qs(elem, ".actionBar-action.actionBar-action--report")) {
					elem.lastElementChild.prepend(BASE.reportButton(postIds[i]));
				}

				if (!qs(elem, "[blocktype]")) {
					elem.lastElementChild.append(...makeBlockButtons(userIds[i]));
				}
				if (!qs(elem, ".actionBar-action.actionBar-action--menuTrigger")) {
					elem.lastElementChild.append(BASE.actionBarMenu, BASE.actionBarMenuList);
				}
			});
		}

		function makeBlockButtons(userId) {
			const buttonArray = [];

			if (!userId || isSelfUserId(userId)) {
				buttonArray.push(
					BASE.baseUserButton,
					BASE.baseAvatarButton,
					BASE.baseSignatureButton,
				);

				buttonArray.forEach(elem => {
					elem.classList.add("theBlocker-hide");
				});

				return buttonArray;
			}

			if (settings["settingUserButton"]) {
				buttonArray.push(BASE.userButton(userId, settings.user.has(userId)));
			}

			if (settings["settingAvatarButton"]) {
				buttonArray.push(BASE.avatarButton(userId, settings.avatar.has(userId)));
			}

			if (settings["settingSignatureButton"]) {
				buttonArray.push(BASE.signatureButton(userId, settings.signature.has(userId)));
			}

			return buttonArray;
		}

		chrome.storage.local.onChanged.addListener(changes => {
			Object.entries(changes).forEach(([key, { oldValue, newValue }]) => {
				switch (key) {
					case userKey:
					case avatarKey:
					case signatureKey:
						// https://github.com/w3c/webextensions/issues/511
						if (isFirefox && JSON.stringify(oldValue) === JSON.stringify(newValue)) { return; }

						// https://issues.chromium.org/issues/40321352
						const oldSet = new Set(oldValue);
						const newSet = new Set(newValue);
						toggleButtonTexts(true, key, [...newSet.difference(oldSet)]);
						toggleButtonTexts(false, key, [...oldSet.difference(newSet)]);

						settings[key.replace(forum, "").toLowerCase()] = newSet;
						settings[`${ key }Count`] = newSet.size;
				}
			});
		});

		function toggleButtonTexts(isBlock, key, userIds) {
			const newText = STR[`${ key.replace(forum, "").toLowerCase() }${ isBlock ? "Unblock" : "Block" }`];
			qsa(`[blocktype="${ key }"]:is([data-user-id="${ userIds.join(`"],[data-user-id="`) }"])`).forEach(elem => {
				elem.textContent = elem.title = newText;
			});
		}

		function addBlockButtonEventListeners(elem) {
			if (!elem.matches?.(".menu[data-menu-builder='actionBar']")) { return; }

			qsa(elem, "[blocktype]").forEach(elem => {
				elem.addEventListener("click", blockHandler);
			});
		}

		function observeForNewActionBars() {
			waitForElement(".block.block--messages[data-href]").then(elem => {
				new MutationObserver(createBlockButtons).observe(elem, { childList: true, subtree: true });
			});
		}

		function observeForNewBlockMenus() {
			new MutationObserver(mutationList => {
				mutationList.forEach(mutation => {
					mutation.addedNodes.forEach(addBlockButtonEventListeners);
				});
			}).observe(document.body, { childList: true });
		}
	}

	self.blockHandler = event => {
		event.currentTarget.closest(".menu[data-menu-builder='actionBar']")?.dispatchEvent(new Event("menu:close"));

		const userId = parseInt(event.currentTarget.dataset.userId, 10);
		const type = event.currentTarget.getAttribute("blocktype");
		const key = type.replace(forum, "").toLowerCase();
		const isBlocked = settings[key].has(userId);

		if (!isUserIdValid(userId)) {
			console.log(`user ID is not a number: ${ userId }`);
			return;
		}

		if (isBlocked) {
			settings[key].delete(userId);
		}
		else {
			settings[key].add(userId);
		}

		settings[type] = [...settings[key]];
		chrome.storage.local.set({
			[type]: settings[type],
			[`${ type }Count`]: settings[type].length,
		});

		console.log(`user ID: ${ userId }, ${ type.replace(forum, "") } ${ !isBlocked ? "blocked" : "unblocked" }`);
	};
})();
