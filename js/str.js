self.STR = self.STR || new Proxy(
    {
        "LANGUAGE": dom.attr("html", "lang"),
        "en-US": {
            userBlock: "Block",
            avatarBlock: "Block avatar",
            signatureBlock: "Block signature",
            userUnblock: "-",
            avatarUnblock: "Unblock avatar",
            signatureUnblock: "Unblock signature",
            report: "Report",
            actionBarMenu: "More options",
            combinedTabName: "New threads and messages",
            save: "Save",
            addNote: "Add note",
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
            combinedTabName: "Yeni konular ve mesajlar",
            save: "Kaydet",
            addNote: "Not ekle",
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
            if (!target.LANGUAGE) { return null; }

            return typeof target[target.LANGUAGE][prop] === "string"
                ? target[target.LANGUAGE][prop]
                : target[target.LANGUAGE][prop].bind(target);
        },
    },
);
