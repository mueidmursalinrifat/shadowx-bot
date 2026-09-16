const { getTime, drive } = global.utils;
const axios = require("axios");

module.exports = {
	config: {
		name: "leave",
		version: "1.7",
		author: "NTKhang + Modified by mueid mursalin Rifat",
		category: "events"
	},

	langs: {
		vi: {
			session1: "🌅 ꜱᴀ́ɴɢ",
			session2: "☀️ ᴛʀᴜ̛ᴀ",
			session3: "🌇 ᴄʜɪᴇ̂̀ᴜ",
			session4: "🌙 ᴛᴏ̂́ɪ",
			leaveType1: "ᴛᴜ̛̣ ʀᴏ̛̀ɪ",
			leaveType2: "ʙɪ̣ ʀᴇᴍᴏᴠᴇᴅ",
			defaultLeaveMessage: "👋 {userName} ᴋᴇᴛ ᴛʜᴜ́ᴄ ᴄᴜᴏ̣̂ᴄ ʜᴀ̀ɴʜ ᴛʀɪ̀ɴʜ ᴄᴜ̀ɴɢ ɴʜᴏ́ᴍ"
		},
		en: {
			session1: "🌅 ᴍᴏʀɴɪɴɢ",
			session2: "☀️ ɴᴏᴏɴ",
			session3: "🌇 ᴀꜰᴛᴇʀɴᴏᴏɴ",
			session4: "🌙 ᴇᴠᴇɴɪɴɢ",
			leaveType1: "👋 ʟᴇꜰᴛ",
			leaveType2: "🚫 ᴡᴀꜱ ʀᴇᴍᴏᴠᴇᴅ ꜰʀᴏᴍ",
			defaultLeaveMessage: "✨ {userName} ʜᴀꜱ ʟᴇꜰᴛ ᴛʜᴇ ɢʀᴏᴜᴘ\n╰┈➤ ᴘᴇᴀᴄᴇ ᴏᴜᴛ! ᴛᴀᴋᴇ ᴄᴀʀᴇ! 🌟"
		}
	},

	onStart: async ({ threadsData, message, event, api, usersData, getLang }) => {
		if (event.logMessageType !== "log:unsubscribe") return;

		const { threadID } = event;
		const threadData = await threadsData.get(threadID);

		if (!threadData?.settings?.sendLeaveMessage) return;

		const { leftParticipantFbId } = event.logMessageData;
		if (leftParticipantFbId == api.getCurrentUserID()) return;

		const hours = getTime("HH");
		const threadName = threadData.threadName;
		const userName = await usersData.getName(leftParticipantFbId);

		// 🎯 ᴀᴠᴀɪʟᴀʙʟᴇ ᴠᴀʀɪᴀʙʟᴇꜱ:
		// {userName}    : ɴᴀᴍᴇ ᴏꜰ ᴛʜᴇ ᴜꜱᴇʀ ᴡʜᴏ ʟᴇꜰᴛ ᴛʜᴇ ɢʀᴏᴜᴘ
		// {userNameTag} : ᴍᴇɴᴛɪᴏɴ ᴛᴀɢ ᴏꜰ ᴛʜᴇ ᴜꜱᴇʀ
		// {type}        : ᴛʏᴘᴇ ᴏꜰ ʟᴇᴀᴠᴇ (ᴠᴏʟᴜɴᴛᴀʀʏ/ʀᴇᴍᴏᴠᴇᴅ)
		// {boxName}     : ɴᴀᴍᴇ ᴏꜰ ᴛʜᴇ ɢʀᴏᴜᴘ
		// {threadName}  : ɴᴀᴍᴇ ᴏꜰ ᴛʜᴇ ɢʀᴏᴜᴘ
		// {time}        : ᴄᴜʀʀᴇɴᴛ ᴛɪᴍᴇ
		// {session}     : ᴛɪᴍᴇ ꜱᴇꜱꜱɪᴏɴ (ᴍᴏʀɴɪɴɢ/ɴᴏᴏɴ/ᴇᴛᴄ.)

		let { leaveMessage = getLang("defaultLeaveMessage") } = threadData.data;
		const form = {};

		leaveMessage = leaveMessage
			.replace(/\{userName\}|\{userNameTag\}/g, userName)
			.replace(/\{type\}/g, leftParticipantFbId == event.author ? getLang("leaveType1") : getLang("leaveType2"))
			.replace(/\{threadName\}|\{boxName\}/g, threadName)
			.replace(/\{time\}/g, hours)
			.replace(/\{session\}/g, hours <= 10 ? getLang("session1")
				: hours <= 12 ? getLang("session2")
				: hours <= 18 ? getLang("session3")
				: getLang("session4"));

		form.body = leaveMessage;

		if (leaveMessage.includes("{userNameTag}")) {
			form.mentions = [{
				id: leftParticipantFbId,
				tag: userName
			}];
		}

		// 📁 ᴀᴛᴛᴀᴄʜᴍᴇɴᴛꜱ ᴘʀᴏᴄᴇꜱꜱɪɴɢ
		let attachments = [];
		
		// ɢᴇᴛ ʟᴏᴄᴀʟ ᴀᴛᴛᴀᴄʜᴍᴇɴᴛꜱ ꜰʀᴏᴍ ᴅʀɪᴠᴇ
		if (threadData.data.leaveAttachment) {
			const files = threadData.data.leaveAttachment;
			const results = await Promise.allSettled(files.map(file => drive.getFile(file, "stream")));
			attachments = results.filter(r => r.status === "fulfilled").map(r => r.value);
		}

		// 🌟 ᴀᴜᴛᴏᴍᴀᴛɪᴄ ʟᴇᴀᴠᴇ ɢɪꜰ
		try {
			const gifRes = await axios.get("https://files.catbox.moe/c54xac.jpg", { 
				responseType: "stream",
				timeout: 10000 
			});
			attachments.push(gifRes.data);
			console.log("✅ ʟᴇᴀᴠᴇ ɢɪꜰ ʟᴏᴀᴅᴇᴅ ꜱᴜᴄᴄᴇꜱꜱꜰᴜʟʟʏ");
		} catch (e) {
			console.log("⚠️ ɢɪꜰ ʟᴏᴀᴅɪɴɢ ꜰᴀɪʟᴇᴅ:", e.message);
			// ʙᴀᴄᴋᴜᴘ ɢɪꜰ
			try {
				const backupGifRes = await axios.get("https://files.catbox.moe/t9yfob.gif", {
					responseType: "stream",
					timeout: 5000
				});
				attachments.push(backupGifRes.data);
				console.log("✅ ʙᴀᴄᴋᴜᴘ ɢɪꜰ ʟᴏᴀᴅᴇᴅ");
			} catch (backupErr) {
				console.log("❌ ʙᴀᴄᴋᴜᴘ ɢɪꜰ ᴀʟꜱᴏ ꜰᴀɪʟᴇᴅ");
			}
		}

		if (attachments.length > 0) {
			form.attachment = attachments;
		}

		// 📤 ꜱᴇɴᴅɪɴɢ ᴍᴇꜱꜱᴀɢᴇ ᴡɪᴛʜ ʀᴇʟɪᴀʙʟᴇ ᴀᴘɪ ᴄᴀʟʟ
		try {
			await api.sendMessage(form, threadID);
			console.log(`📤 ʟᴇᴀᴠᴇ ᴍᴇꜱꜱᴀɢᴇ ꜱᴇɴᴛ ꜰᴏʀ ${userName}`);
		} catch (sendError) {
			console.error("❌ ꜰᴀɪʟᴇᴅ ᴛᴏ ꜱᴇɴᴅ ʟᴇᴀᴠᴇ ᴍᴇꜱꜱᴀɢᴇ:", sendError.message);
			
			// ꜰᴀʟʟʙᴀᴄᴋ: ꜱᴇɴᴅ ᴛᴇxᴛ-ᴏɴʟʏ ᴍᴇꜱꜱᴀɢᴇ
			try {
				await api.sendMessage({
					body: form.body,
					mentions: form.mentions
				}, threadID);
			} catch (finalError) {
				console.error("❌ ꜰᴀʟʟʙᴀᴄᴋ ᴀʟꜱᴏ ꜰᴀɪʟᴇᴅ");
			}
		}
	}
};