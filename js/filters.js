(async () => {
	const isMac = window.navigator.userAgent.indexOf("Mac OS") !== -1;
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

	CodeMirror.defineMode("theBlocker-filters", function (config, parserConfig) {
		return {
			token: function (stream) {
				return stream.match(/\d+/) === null
					? "line-cm-error"
					: "filter-keyword";
			}
		};
	});

	const editors = Object.fromEntries(FILTERS.map(value => ([value, new CodeMirror(qs(`#${ value.replace(forum, "") }`), codeMirrorOptions)])));

	/***************************************** MAIN START *****************************************/

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

	renderEditors();

	FILTERS.forEach(value => editors[value].on("beforeChange", beforeEditorChanged));
	FILTERS.forEach(value => editors[value].on("changes", editorChanged));

	editors[userKey].focus();

	chrome.storage.onChanged.addListener(changes => {
		Object.entries(changes).forEach(([key, { oldValue, newValue }]) => {
			if (FILTERS.includes(key)) {
				settings[key] = newValue;
				renderEditor(key);
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
		if (isMac ? event.metaKey : event.ctrlKey && event.key.toLowerCase() === "s") {
			event.preventDefault();

			if (!buttons.save.disabled) {
				buttons.save.click();
			}
		}
	});

	document.addEventListener("keydown", event => {
		if (isMac ? event.metaKey : event.ctrlKey) {
			qsa(".cm-filter-keyword").forEach(elem => elem.classList.add("cm-keyword-link"));
		}
	});

	document.addEventListener("keyup", event => {
		if (!(isMac ? event.metaKey : event.ctrlKey)) {
			qsa(".cm-filter-keyword.cm-keyword-link").forEach(elem => elem.classList.remove("cm-keyword-link"));
		}
	});

	document.addEventListener("mousedown", event => {
		if (event.target.classList.contains("cm-keyword-link")) {
			chrome.tabs.create({ url: `https://${ forum }.net/sosyal/uye/${ event.target.textContent }` });
		}
	});

	var tapped = null;
	document.addEventListener("touchstart", event => {
		if (event.target.classList.contains("cm-filter-keyword")) {
			if (!tapped) {
				tapped = setTimeout(_ => tapped = null, 300);
			}
			else {
				clearTimeout(tapped);
				tapped = null;
				chrome.tabs.create({ url: `https://${ forum }.net/sosyal/uye/${ event.target.textContent }` });
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
		const filePicker = qs("#filePicker");
		filePicker.value = "";
		filePicker.click();
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
					[userKey]: [...new Set([...settings[userKey], ...filters["kullanıcı"]])],
					[avatarKey]: [...new Set([...settings[avatarKey], ...filters["avatar"]])],
					[signatureKey]: [...new Set([...settings[signatureKey], ...filters["imza"]])],
				});
			}
			catch (error) {
				console.error("JSON error: ", error);
			}
		};

		reader.readAsText(selectedFile);
	});

	/****************************************** MAIN END ******************************************/

	function renderEditors() {
		FILTERS.forEach(value => renderEditor(value));
	}

	function renderEditor(editor) {
		cache[editor] = settings[editor].join("\n");
		editors[editor].setValue(cache[editor].length === 0 ? cache[editor] : `${ cache[editor] }\n`);
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
		chrome.storage.local.set(Object.fromEntries(FILTERS.flatMap(value => ([[value, settings[value]], [`${ value }Count`, settings[value].length]]))));
	}

	function getEditorText(editor) {
		return editor.getValue()
			.replace(/\n{2,}/g, "\n")
			.trim();
	}
})();
