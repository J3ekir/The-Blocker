(async () => {
	const isMac = window.navigator.userAgent.includes("Mac OS");
	const ctrlKey = isMac ? "metaKey" : "ctrlKey";
	const isMobile = /\bMobile\b/.test(window.navigator.userAgent);
	const forum = parent.document.documentElement.dataset.forum;
	const userKey = `${ forum }User`;
	const avatarKey = `${ forum }Avatar`;
	const signatureKey = `${ forum }Signature`;
	const cache = {
		[userKey]: "",
		[avatarKey]: "",
		[signatureKey]: "",
	};
	const FILTERS = Object.keys(cache);
	const settings = await chrome.storage.local.get([
		"hideDoubleTapHint",
		...FILTERS,
	]);
	const buttons = {
		save: qs("#apply-button"),
		import: qs("#import-button"),
		export: qs("#export-button"),
		filePicker: qs("#file-picker"),
	};
	const codeMirrorOptions = {
		autofocus: true,
		configureMouse: _ => ({ addNew: false }),
		extraKeys: { Enter: cm => cm.replaceSelection("\n") },
		foldGutter: true,
		gutters: ["CodeMirror-foldgutter", "CodeMirror-linenumbers"],
		lineNumbers: true,
		lineWiseCopyCut: true,
		scrollbarStyle: "overlay",
		styleActiveLine: { nonEmpty: true },
	};
	CodeMirror.defineMode("theBlocker-filters", theBlockerFilters);
	const editors = Object.fromEntries(FILTERS.map(value => [value, new CodeMirror(qs(`#${ value.replace(forum, "") }`), codeMirrorOptions)]));
	document.documentElement.classList.toggle("mobile", isMobile);
	qs("#double-tap-hint").classList.toggle("hidden", settings["hideDoubleTapHint"]);
	qs("#double-tap-hint>b").addEventListener("click", hideDoubleTapHint);
	renderEditors();
	FILTERS.forEach(value => editors[value].on("beforeChange", beforeEditorChanged));
	FILTERS.forEach(value => editors[value].on("changes", editorChanged));

	editors[userKey].focus();

	chrome.storage.local.onChanged.addListener(changes => {
		Object.keys(changes).forEach(key => {
			if (FILTERS.includes(key)) {
				storageChangedFilters(key, changes[key]);
			}
		});
	});

	function storageChangedFilters(key, { oldValue, newValue }) {
		// https://github.com/J3ekir/The-Blocker/issues/5
		if (isFirefox && JSON.stringify(oldValue) === JSON.stringify(newValue)) { return; }

		settings[key] = newValue;
		renderEditor(key);
	}

	window.addEventListener("beforeunload", event => {
		if (buttons.save.disabled) { return; }

		event.preventDefault();
	});

	window.addEventListener("pagehide", event => {
		parent.postMessage({
			type: "tab",
		}, "*");
	});

	document.addEventListener("keydown", event => {
		if (event[ctrlKey] && event.key.toLowerCase() === "s") {
			event.preventDefault();

			if (!buttons.save.disabled) {
				buttons.save.click();
			}
		}
	});

	document.addEventListener("keydown", event => {
		if (event[ctrlKey]) {
			qsa(".cm-filter-keyword").forEach(elem => elem.classList.add("cm-keyword-link"));
		}
	});

	document.addEventListener("keyup", event => {
		if (!event[ctrlKey]) {
			qsa(".cm-filter-keyword.cm-keyword-link").forEach(elem => elem.classList.remove("cm-keyword-link"));
		}
	});

	document.addEventListener("mousedown", event => {
		if (event.target.classList.contains("cm-keyword-link")) {
			openUserProfile(event.target.textContent);
		}
	});

	let tapped = null;
	document.addEventListener("touchstart", event => {
		if (event.target.classList.contains("cm-filter-keyword")) {
			if (!tapped) {
				tapped = setTimeout(_ => tapped = null, 300);
			}
			else {
				clearTimeout(tapped);
				tapped = null;
				openUserProfile(event.target.textContent);
			}

			event.preventDefault();
		}
	});

	buttons.save.addEventListener("click", event => {
		saveEditorText();
		renderEditors();
		buttons.save.disabled = true;
	});

	buttons.import.addEventListener("click", event => {
		buttons.filePicker.value = "";
		buttons.filePicker.click();
	});

	buttons.export.addEventListener("click", event => {
		if (FILTERS.every(value => settings[value].length === 0)) { return; }

		const object = {};
		object["kullanıcı"] = settings[userKey];
		object["avatar"] = settings[avatarKey];
		object["imza"] = settings[signatureKey];
		const text = JSON.stringify(object, null, 4);

		const now = new Date(Date.now() - (new Date()).getTimezoneOffset() * 60000);
		const time = now.toISOString()
			.replace(/\.\d+Z$/, "")
			.replace(/:/g, ".")
			.replace("T", "_");
		const fileName = `the-blocker-filtreler-${ forum }_${ time }.txt`;

		const downloadLink = document.createElement("a");
		const uriComponent = encodeURIComponent(text + "\n");
		downloadLink.href = "data:text/plain;charset=utf-8," + uriComponent;
		downloadLink.download = fileName;
		downloadLink.type = "text/plain";
		downloadLink.click();
	});

	buttons.filePicker.addEventListener("change", event => {
		const fileInput = event.target;

		if (fileInput.files.length === 0) {
			console.log("No file selected");
			return;
		}

		const selectedFile = fileInput.files[0];
		const reader = new FileReader();

		reader.onload = event => {
			const fileContent = event.target.result;

			try {
				const filters = JSON.parse(fileContent);
				const user = [...new Set([...settings[userKey], ...filters["kullanıcı"]])];
				const avatar = [...new Set([...settings[avatarKey], ...filters["avatar"]])];
				const signature = [...new Set([...settings[signatureKey], ...filters["imza"]])];

				chrome.storage.local.set({
					[userKey]: user,
					[avatarKey]: avatar,
					[signatureKey]: signature,
					[`${ userKey }Count`]: user.length,
					[`${ avatarKey }Count`]: avatar.length,
					[`${ signatureKey }Count`]: signature.length,
				});
			}
			catch (error) {
				console.error("JSON error: ", error);
			}
		};

		reader.readAsText(selectedFile);
	});

	function theBlockerFilters(config, parserConfig) {
		return {
			token: stream => stream.match(/\d+/) === null ? "line-cm-error" : "filter-keyword"
		};
	}

	function hideDoubleTapHint(event) {
		event.currentTarget.parentElement.classList.add("hidden");
		chrome.storage.local.set({ hideDoubleTapHint: true });
	}

	function renderEditors() {
		FILTERS.forEach(value => renderEditor(value));
	}

	function renderEditor(editor) {
		cache[editor] = settings[editor].join("\n");
		const value = cache[editor] + (cache[editor].length ? "\n" : "");
		editors[editor].setValue(value);
		editors[editor].clearHistory();
		editors[editor].setCursor(editors[editor].lineCount(), 0);
	}

	function beforeEditorChanged(editor, changeObj) {
		if (/[^\d]/g.test(changeObj.text.join(""))) {
			changeObj.cancel();
		}
	}

	function editorChanged(editor, changes) {
		buttons.save.disabled = FILTERS.every(value => cache[value] === getEditorText(editors[value]));
	}

	function saveEditorText() {
		FILTERS.forEach(value => settings[value] = [...new Set(getEditorText(editors[value]).split("\n").map(id => parseInt(id, 10)).filter(Boolean))]);
		chrome.storage.local.set(Object.fromEntries(FILTERS.flatMap(value => [[value, settings[value]], [`${ value }Count`, settings[value].length]])));
	}

	function getEditorText(editor) {
		return editor.getValue()
			.replace(/\n{2,}/g, "\n")
			.trim();
	}

	function openUserProfile(userId) {
		chrome.tabs.create({ url: `https://${ forum }.net/sosyal/uye/${ userId }` });
	}
})();
