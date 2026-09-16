const { getTime } = global.utils;

module.exports = {
	config: {
		name: "logsbot",
		isBot: true,
		version: "1.5",
		author: "NTKhang&Mueid Mursalin Rifat",
		envConfig: {
			allow: true
		},
		category: "events"
	},

	langs: {
		vi: {
			title: "📊 ɴʜᴀ̣̂ᴛ ᴋʏ́ ʙᴏᴛ",
			added: "\n" +
				"✅ ꜱᴜ̛̣ ᴋɪᴇ̣̂ɴ: ʙᴏᴛ đᴜ̛ᴏ̛̣ᴄ ᴛʜᴇ̂ᴍ ᴠᴀ̀ᴏ ɴʜᴏ́ᴍ\n" +
				"├─ ʜᴀ̀ɴʜ đᴏ̣̂ɴɢ: đᴀ̃ ᴛʜᴇ̂ᴍ ᴠᴀ̀ᴏ ɴʜᴏ́ᴍ ᴍᴏ̛́ɪ\n" +
				"├─ ɴɢᴜ̛ᴏ̛̀ɪ ᴛʜᴇ̂ᴍ: %1\n" +
				"└─ ᴛʀᴀ̣ɴɢ ᴛʜᴀ́ɪ: đᴀ̃ ᴋɪ́ᴄʜ ʜᴏᴀ̣ᴛ",
			kicked: "\n" +
				"❌ ꜱᴜ̛̣ ᴋɪᴇ̣̂ɴ: ʙᴏᴛ ʙɪ̣ ᴠɪᴇ̂̃ɴ ʀᴀ ʜᴏ̂̀ɪ\n" +
				"├─ ʜᴀ̀ɴʜ đᴏ̣̂ɴɢ: đᴀ̃ xᴏ́ᴀ ᴋʜᴏ̉ɪ ɴʜᴏ́ᴍ\n" +
				"├─ ɴɢᴜ̛ᴏ̛̀ɪ ᴛʜᴜ̛̣ᴄ ʜɪᴇ̣̂ɴ: %1\n" +
				"└─ ᴛʀᴀ̣ɴɢ ᴛʜᴀ́ɪ: ᴠᴏ̂ ʜɪᴇ̣̂ᴜ ʜᴏ́ᴀ",
			footer: "\n" +
				"📋 ᴛʜᴏ̂ɴɢ ᴛɪɴ ᴄʜɪ ᴛɪᴇ̂́ᴛ\n" +
				"├─ ɪᴅ ɴɢᴜ̛ᴏ̛̀ɪ ᴅᴜ̀ɴɢ: %1\n" +
				"├─ ᴛᴇ̂ɴ ɴʜᴏ́ᴍ: %2\n" +
				"├─ ɪᴅ ɴʜᴏ́ᴍ: %3\n" +
				"└─ ᴛʜᴏ̛̀ɪ ɢɪᴀɴ: %4"
		},
		en: {
			title: "📊 ʙᴏᴛ ᴀᴄᴛɪᴠɪᴛʏ ʟᴏɢꜱ",
			added: "\n" +
				"✅ ʙᴏᴛ ᴀᴅᴅɪᴛɪᴏɴ ᴇᴠᴇɴᴛ\n" +
				"├─ ᴀᴄᴛɪᴏɴ: ᴀᴅᴅᴇᴅ ᴛᴏ ɴᴇᴡ ɢʀᴏᴜᴘ\n" +
				"├─ ɪɴɪᴛɪᴀᴛᴇᴅ ʙʏ: %1\n" +
				"└─ ꜱᴛᴀᴛᴜꜱ: ᴀᴄᴛɪᴠᴇ",
			kicked: "\n" +
				"❌ ʙᴏᴛ ʀᴇᴍᴏᴠᴀʟ ᴇᴠᴇɴᴛ\n" +
				"├─ ᴀᴄᴛɪᴏɴ: ʀᴇᴍᴏᴠᴇᴅ ꜰʀᴏᴍ ɢʀᴏᴜᴘ\n" +
				"├─ ɪɴɪᴛɪᴀᴛᴇᴅ ʙʏ: %1\n" +
				"└─ ꜱᴛᴀᴛᴜꜱ: ɪɴᴀᴄᴛɪᴠᴇ",
			footer: "\n" +
				"📋 ᴇᴠᴇɴᴛ ᴅᴇᴛᴀɪʟꜱ\n" +
				"├─ ᴜꜱᴇʀ ɪᴅ: %1\n" +
				"├─ ɢʀᴏᴜᴘ ɴᴀᴍᴇ: %2\n" +
				"├─ ɢʀᴏᴜᴘ ɪᴅ: %3\n" +
				"└─ ᴛɪᴍᴇꜱᴛᴀᴍᴘ: %4"
		}
	},

	onStart: async ({ usersData, threadsData, event, api, getLang }) => {
		if (
			(event.logMessageType == "log:subscribe" && event.logMessageData.addedParticipants.some(item => item.userFbId == api.getCurrentUserID()))
			|| (event.logMessageType == "log:unsubscribe" && event.logMessageData.leftParticipantFbId == api.getCurrentUserID())
		) return async function () {
			let msg = getLang("title");
			const { author, threadID } = event;
			if (author == api.getCurrentUserID())
				return;
			let threadName;
			const { config } = global.GoatBot;

			if (event.logMessageType == "log:subscribe") {
				if (!event.logMessageData.addedParticipants.some(item => item.userFbId == api.getCurrentUserID()))
					return;
				threadName = (await api.getThreadInfo(threadID)).threadName;
				const authorName = await usersData.getName(author);
				msg += getLang("added", authorName);
			}
			else if (event.logMessageType == "log:unsubscribe") {
				if (event.logMessageData.leftParticipantFbId != api.getCurrentUserID())
					return;
				const authorName = await usersData.getName(author);
				const threadData = await threadsData.get(threadID);
				threadName = threadData.threadName;
				msg += getLang("kicked", authorName);
			}
			const time = getTime("DD/MM/YYYY HH:mm:ss");
			msg += getLang("footer", author, threadName, threadID, time);

			for (const adminID of config.adminBot)
				api.sendMessage(msg, adminID);
		};
	}
};