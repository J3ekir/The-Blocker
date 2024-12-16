(async () => {
	const isMac = window.navigator.userAgent.includes("Mac OS");
	const isMobile = /\bMobile\b/.test(window.navigator.userAgent);
	const forum = parent.document.documentElement.dataset.forum;
	const notesKey = `${ forum }Notes`;
	const settings = await chrome.storage.local.get([
		notesKey,
		"hideDoubleTapHint",
	]);
	settings.notes = new Map(Object.entries(settings[notesKey]).map(([key, value]) => [parseInt(key, 10), value]));

	let cache = "";

	const buttons = {
		save: qs("#applyButton"),
		import: qs("#importButton"),
		export: qs("#exportButton"),
		filePicker: qs("#filePicker"),
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

	CodeMirror.defineMode("theBlocker-notes", (config, parserConfig) => {
		let lastUserId = "";

		return {
			token(stream) {
				if (stream.sol()) {
					if (!stream.match(/^\s*\d+[ ].+$/, false)) {
						stream.skipToEnd();
						return "line-cm-error";
					}

					if (stream.match(/\s+/, false)) {
						stream.eatSpace();
						return null;
					}
				}

				if (stream.match(/\d+/, false)) {
					lastUserId = parseInt(stream.match(/\d+/)[0], 10);
					return "keyword";
				}

				const note = stream.match(/[ ].+/)[0];
				if (note.trim() !== settings.notes.get(lastUserId)) {
					return "line-cm-strong";
				}

				return null;
			}
		};
	});

	const noteEditor = new CodeMirror(qs("#note"), codeMirrorOptions);

	if (settings["hideDoubleTapHint"]) {
		qs("#doubleTapHint").style.display = "none";
	}
	else {
		qs("#doubleTapHint").style.display = "flex";
		qs("#doubleTapHint>b").addEventListener("click", event => {
			event.currentTarget.parentElement.style.display = "none";
			chrome.storage.local.set({ hideDoubleTapHint: true });
		});
	}

	if (isMobile) {
		document.documentElement.classList.add("mobile");
	}

	renderNotes();

	noteEditor.on("changes", editorChanged);

	chrome.storage.local.onChanged.addListener(changes => {
		Object.entries(changes).forEach(([key, { oldValue, newValue }]) => {
			switch (key) {
				case notesKey:
					settings.notes = new Map(Object.entries(newValue).map(([key, value]) => [parseInt(key, 10), value]));
					renderNotes();
			}
		});
	});

	window.addEventListener("beforeunload", event => {
		if (buttons.save.disabled) { return; }

		event.preventDefault();
		event.returnValue = "";
	});

	window.addEventListener("unload", event => {
		parent.postMessage({
			type: "tab",
		}, "*");
	});

	document.addEventListener("keydown", event => {
		const isCtrl = isMac ? event.metaKey : event.ctrlKey;
		if (isCtrl && event.key.toLowerCase() === "s") {
			event.preventDefault();

			if (!buttons.save.disabled) {
				buttons.save.click();
			}
		}
	});

	document.addEventListener("keydown", event => {
		const isCtrl = isMac ? event.metaKey : event.ctrlKey;
		if (isCtrl) {
			qsa(".cm-keyword").forEach(elem => elem.classList.add("cm-keyword-link"));
		}
	});

	document.addEventListener("keyup", event => {
		const isCtrl = isMac ? event.metaKey : event.ctrlKey;
		if (!isCtrl) {
			qsa(".cm-keyword.cm-keyword-link").forEach(elem => elem.classList.remove("cm-keyword-link"));
		}
	});

	document.addEventListener("mousedown", event => {
		if (event.target.classList.contains("cm-keyword-link")) {
			openUserProfile(event.target.textContent.trimStart());
		}
	});

	let tapped = null;
	document.addEventListener("touchstart", event => {
		if (event.target.classList.contains("cm-keyword")) {
			if (!tapped) {
				tapped = setTimeout(_ => tapped = null, 300);
			}
			else {
				clearTimeout(tapped);
				tapped = null;
				openUserProfile(event.target.textContent.trimStart());
			}

			event.preventDefault();
		}
	});

	buttons.save.addEventListener("click", event => {
		saveEditorText();
		noteEditor.clearHistory();
		buttons.save.disabled = true;
	});

	buttons.import.addEventListener("click", event => {
		const filePicker = qs("#filePicker");
		filePicker.value = "";
		filePicker.click();
	});

	buttons.export.addEventListener("click", event => {
		if (settings.notes.size === 0) { return; }

		const object = { notlar: Object.fromEntries(settings.notes) };
		const text = JSON.stringify(object, null, 4);

		const now = new Date(Date.now() - (new Date()).getTimezoneOffset() * 60000);
		const time = now.toISOString()
			.replace(/\.\d+Z$/, "")
			.replace(/:/g, ".")
			.replace("T", "_");
		const fileName = `the-blocker-notlar-${ forum }_${ time }.txt`;

		const downloadLink = document.createElement("a");
		downloadLink.href = `data:text/plain;charset=utf-8,${ encodeURIComponent(`${ text }\n`) }`;
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

				chrome.storage.local.set({
					[notesKey]: { ...Object.fromEntries(settings.notes), ...filters["notlar"] },
				});
			}
			catch (error) {
				console.error("JSON error: ", error);
			}
		};

		reader.readAsText(selectedFile);
	});

	function renderNotes() {
		const lines = [];
		const cacheLines = [];
		const notes = [...settings.notes.entries()].map(([userId, note]) => [userId.toString(), note]);
		const maxUserIdLength = notes.length && notes.reduce((prev, curr) => (prev && prev[0].length > curr[0].length ? prev : curr))[0].length;

		notes.forEach(([userId, note]) => {
			lines.push(`${ " ".repeat(maxUserIdLength - userId.length) }${ userId } ${ note }`);
			cacheLines.push(`${ userId } ${ note }`);
		});

		lines.push("");
		cache = cacheLines.join("\n");
		noteEditor.setValue(lines.join("\n"));
		noteEditor.clearHistory();
	}

	function editorChanged(editor, changes) {
		buttons.save.disabled = cache === getEditorText();
	}

	function saveEditorText() {
		const text = getEditorText();
		const lines = text.split("\n");
		const notes = new Map();

		lines.forEach(elem => {
			const match = /^(\d+) (.+)$/gm.exec(elem);

			if (match !== null) {
				notes.set(parseInt(match[1], 10), match[2]);
			}
		});

		chrome.storage.local.set({
			[notesKey]: Object.fromEntries(notes),
		});
	}

	function getEditorText() {
		return noteEditor.getValue()
			.replace(/\s*\n\s*/g, "\n")
			.replace(/(\n\d+)\s+/g, "$1 ")
			.trim();
	}

	function openUserProfile(userId) {
		chrome.tabs.create({ url: `https://${ forum }.net/sosyal/uye/${ userId }` });
	}
})();
