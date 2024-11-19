self.STR = self.STR || new Proxy(
	{
		LANGUAGE: document.documentElement.getAttribute("lang"),
		"en-US": {
			userBlock: "Block",
			avatarBlock: "Block avatar",
			signatureBlock: "Block signature",
			userUnblock: "-",
			avatarUnblock: "Unblock avatar",
			signatureUnblock: "Unblock signature",
			report: "Report",
			actionBarMenu: "More options",
			combinedTabConjunction: " and",
			save: "Save",
			addNote: "Add note",
			noteSavedMessage: "Note has been saved.",
			report: "Report",
			find: "Find",
			findContent: "Find content",
			findAllContentBy(userName) {
				return `Find all content by ${ userName }`;
			},
			findAllThreadsBy(userName) {
				return `Find all threads by ${ userName }`;
			},
		},
		"tr-TR": {
			userBlock: "Engelle",
			avatarBlock: "Avatar engelle",
			signatureBlock: "İmza engelle",
			userUnblock: "-",
			avatarUnblock: "Avatarı göster",
			signatureUnblock: "İmzayı göster",
			report: "Rapor",
			actionBarMenu: "Detaylar",
			combinedTabConjunction: " ve",
			save: "Kaydet",
			addNote: "Not ekle",
			noteSavedMessage: "Not kaydedildi.",
			report: "Rapor",
			find: "Bul",
			findContent: "İçerik bul",
			findAllContentBy(userName) {
				return `${ userName } tarafından gönderilen tüm içeriği arattır`;
			},
			findAllThreadsBy(userName) {
				return `${ userName } tarafından açılan tüm konuları arattır`;
			},
		},
	},
	{
		get(target, prop) {
			const value = target[target.LANGUAGE]?.[prop];
			return typeof value === "function" ? value.bind(target) : value;
		},
	},
);
