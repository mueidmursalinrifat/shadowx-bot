module.exports = {
	config: {
		name: "checkwarn",
		version: "1.4",
		author: "NTKhang & Modified by mueid mursalin Rifat ",
		category: "events"
	},

	langs: {
		vi: {
			warn: "🚨 ᴄᴀ̉ɴʜ ʙᴀ́ᴏ ɢɪᴏ̛́ɪ ʜᴀ̣ɴ ᴠᴜ̛̉ᴏ̛̣ᴛ Qᴜᴀ́\n" +
				"├─ ᴛᴇ̂ɴ: %1\n" +
				"├─ ᴜɪᴅ: %2\n" +
				"├─ ᴛʀᴀ̣ɴɢ ᴛʜᴀ́ɪ: ʙɪ̣ ᴄᴀ̂́ᴍ ᴋʜᴏ̉ɪ ɴʜᴏ́ᴍ\n" +
				"└─ ʟᴇ̣̂ɴʜ ɢᴏ̛̃ ʙᴀɴ: \"%3ᴡᴀʀɴ ᴜɴʙᴀɴ %2\"",
			needPermission: "🛡️ ʙᴏᴛ ᴄᴀ̂̀ɴ Qᴜʏᴇ̂̀ɴ Qᴜᴀ̉ɴ ᴛʀɪ̣ ᴠɪᴇ̂ɴ\n" +
				"ᴅᴇ̂̉ ᴛʜᴜ̛̣ᴄ ʜɪᴇ̣̂ɴ ʟᴇ̣̂ɴʜ ᴋɪᴄᴋ ᴛʜᴀ̀ɴʜ ᴠɪᴇɴ ʙɪ̣ ᴄᴀ̂́ᴍ"
		},
		en: {
			warn: "🚨 ᴡᴀʀɴɪɴɢ ʟɪᴍɪᴛ ᴇxᴄᴇᴇᴅᴇᴅ\n" +
				"├─ ɴᴀᴍᴇ: %1\n" +
				"├─ ᴜꜱᴇʀ ɪᴅ: %2\n" +
				"├─ ꜱᴛᴀᴛᴜꜱ: ʙᴀɴɴᴇᴅ ꜰʀᴏᴍ ᴄʜᴀᴛ\n" +
				"└─ ᴜɴʙᴀɴ ᴄᴏᴍᴍᴀɴᴅ: %3ᴡᴀʀɴ ᴜɴʙᴀɴ %2",
			needPermission: "🛡️ ᴀᴅᴍɪɴɪꜱᴛʀᴀᴛɪᴠᴇ ᴘᴇʀᴍɪꜱꜱɪᴏɴꜱ ʀᴇQᴜɪʀᴇᴅ\n" +
				"ʙᴏᴛ ɴᴇᴇᴅꜱ ᴋɪᴄᴋ ᴘᴇʀᴍɪꜱꜱɪᴏɴꜱ ᴛᴏ ʀᴇᴍᴏᴠᴇ ᴡᴀʀɴᴇᴅ ᴍᴇᴍʙᴇʀꜱ"
		}
	},

	onStart: async ({ threadsData, message, event, api, client, getLang }) => {
		if (event.logMessageType == "log:subscribe")
			return async function () {
				const { threadID } = event;
				const { data } = await threadsData.get(event.threadID);
				const { warn: warnList } = data;
				if (!warnList)
					return;
				const { addedParticipants } = event.logMessageData;
				for (const user of addedParticipants) {
					const findUser = warnList.find(u => u.userID == user.userFbId);
					if (findUser && findUser.list >= 3) {
						const userName = user.fullName;
						const uid = user.userFbId;
						const prefix = client.getPrefix(threadID);
						
						console.log(`⚠️ ᴡᴀʀɴɪɴɢ ᴄʜᴇᴄᴋ: ${userName} (${uid}) ʜᴀꜱ 3+ ᴡᴀʀɴꜱ`);
						
						message.send({
							body: getLang("warn", userName, uid, prefix),
							mentions: [{
								tag: userName,
								id: uid
							}]
						}, function () {
							api.removeUserFromGroup(uid, threadID, (err) => {
								if (err) {
									console.log(`❌ ꜰᴀɪʟᴇᴅ ᴛᴏ ʀᴇᴍᴏᴠᴇ ${userName}: ɴᴏ ᴘᴇʀᴍɪꜱꜱɪᴏɴꜱ`);
									return message.send(getLang("needPermission"));
								} else {
									console.log(`✅ ꜱᴜᴄᴄᴇꜱꜱꜰᴜʟʟʏ ʀᴇᴍᴏᴠᴇᴅ ${userName} ꜰʀᴏᴍ ɢʀᴏᴜᴘ`);
								}
							});
						});
					}
				}
			};
	}
};