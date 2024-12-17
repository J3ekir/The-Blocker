(async () => {
	const notesKey = `${ forum }Notes`;
	const settings = await chrome.storage.local.get([
		notesKey,
		"settingNotes",
	]);
	settings.notes = new Map(Object.entries(settings[notesKey]).map(([key, value]) => [parseInt(key, 10), value]));
	const NOTES = settings["settingNotes"];

	observeForNewTooltips();
	observeForMemberHeader();

	function addTooltipItems(elem) {
		if (!elem.matches?.(".tooltip--member .tooltip-content-inner")) { return; }

		const userId = parseInt(qs(elem, ".memberTooltip-avatar>a").dataset.userId, 10);

		addReportButton(elem, userId);
		addFindButton(elem, userId);
		addNote(elem, userId);
	}

	function addReportButton(elem, userId) {
		if (hasReportButton(elem)) { return; }

		qs(elem, ".memberTooltip-headerInfo").prepend(
			BASE.tooltipReport(userId),
		);
	}

	function addFindButton(elem, userId) {
		if (hasFindButton(elem)) { return; }

		if (!hasActions(elem)) {
			qs(elem, ".memberTooltip").append(
				BASE.tooltipSeperator,
				BASE.tooltipActions,
			);
		}

		const userName = qs(elem, ".memberTooltip-nameWrapper>a").textContent;

		qs(elem, ".memberTooltip-actions").append(
			BASE.tooltipFind,
			BASE.tooltipFindMenu(userId, userName),
		);
	}

	function addNote(elem, userId) {
		if (!NOTES) { return; }
		if (hasNote(elem)) { return; }
		if (isSelfUserId(userId)) { return; }

		qs(elem, ".memberTooltip-info").before(
			BASE.tooltipNote(userId, settings.notes.get(userId)),
			BASE.tooltipSeperator
		);
	}

	function addProfileNote() {
		const userId = parseInt(qs(".memberHeader-avatar>.avatarWrapper>:is(a,span)").dataset.userId, 10);

		if (isSelfUserId(userId)) { return; }

		qs(".memberHeader-buttons").append(
			BASE.tooltipNote(userId, settings.notes.get(userId)),
		);
	}

	self.noteEnterHandler = event => {
		if (event.key === "Enter") {
			event.currentTarget.nextElementSibling.click();
			event.currentTarget.closest(".tooltip.tooltip--member")?.dispatchEvent(new Event("mouseout"));
		}
	};

	self.noteSaveHandler = event => {
		const note = event.currentTarget.previousElementSibling.value;
		const userId = parseInt(event.currentTarget.parentElement.dataset.userId, 10);

		settings.notes.set(userId, note);

		if (!note.length) {
			settings.notes.delete(userId);
		}

		chrome.storage.local.set({
			[notesKey]: Object.fromEntries(settings.notes),
		});

		chrome.runtime.sendMessage({
			type: "noteSavedMessage",
			message: STR.noteSavedMessage,
		});

		event.currentTarget.closest(".tooltip.tooltip--member")?.dispatchEvent(new Event("mouseout"));
	};

	function hasReportButton(elem) {
		return qs(elem, ".button--link[href$='report']");
	}

	function hasActions(elem) {
		return qs(elem, ".memberTooltip .memberTooltip-actions");
	}

	function hasFindButton(elem) {
		return qs(elem, ".memberTooltip .memberTooltip-actions>.menu");
	}

	function hasNote(elem) {
		return qs(elem, ".memberTooltip .memberTooltip-note");
	}

	chrome.storage.local.onChanged.addListener(changes => {
		Object.entries(changes).forEach(([key, { oldValue, newValue }]) => {
			if (key === notesKey) {
				// https://github.com/w3c/webextensions/issues/511
				if (isFirefox && JSON.stringify(oldValue) === JSON.stringify(newValue)) { return; }

				// https://issues.chromium.org/issues/40321352
				const oldNotes = settings.notes;
				settings.notes = new Map(Object.entries(newValue).map(([key, value]) => [parseInt(key, 10), value]));

				const allUserIds = new Set([...oldNotes.keys(), ...settings.notes.keys()]);
				allUserIds.forEach(userId => {
					setNewNoteValue(userId, settings.notes.get(userId));
				});
			}
		});
	});

	function setNewNoteValue(userId, note) {
		qsa(`.memberTooltip-note[data-user-id="${ userId }"]>.input`).forEach(elem => {
			elem.value = note || "";
		});
	}

	function observeForNewTooltips() {
		new MutationObserver(mutationList =>
			mutationList.forEach(mutation =>
				mutation.addedNodes.forEach(addTooltipItems)
			)
		).observe(document, { childList: true, subtree: true });
	}

	function observeForMemberHeader() {
		if (!window.location.pathname.startsWith("/sosyal/uye/")) { return; }
		if (!NOTES) { return; }

		waitForElement(".memberHeader-buttons").then(addProfileNote);
	}
})();
