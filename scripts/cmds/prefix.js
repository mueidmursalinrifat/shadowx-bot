const fs = require("fs-extra");
const { utils } = global;

module.exports = {
	config: {
		name: "prefix",
		version: "1.6",
		author: "Mueid Mursalin Rifat",
		countDown: 5,
		role: 0,
		description: "ᴄʜᴀɴɢᴇ ᴛʜᴇ ʙᴏᴛ'ꜱ ᴘʀᴇꜰɪx ɪɴ ʏᴏᴜʀ ᴄʜᴀᴛ ᴏʀ ɢʟᴏʙᴀʟʟʏ (ᴀᴅᴍɪɴ ᴏɴʟʏ)",
		category: "ᴄᴏɴꜰɪɢ",
		guide: {
			en:
				"🔸 {pn} <ɴᴇᴡ ᴘʀᴇꜰɪx>\n" +
				"   ╰─ ᴄʜᴀɴɢᴇ ᴘʀᴇꜰɪx ꜰᴏʀ ʏᴏᴜʀ ɢʀᴏᴜᴘ\n" +
				"   ┗─ ᴇxᴀᴍᴘʟᴇ: {pn} #\n\n" +
				"🔸 {pn} <ɴᴇᴡ ᴘʀᴇꜰɪx> -ɢ\n" +
				"   ╰─ ᴄʜᴀɴɢᴇ ɢʟᴏʙᴀʟ ᴘʀᴇꜰɪx (ᴀᴅᴍɪɴ ᴏɴʟʏ)\n" +
				"   ┗─ ᴇxᴀᴍᴘʟᴇ: {pn} ! -ɢ\n\n" +
				"🔸 {pn} ʀᴇꜱᴇᴛ\n" +
				"   ╰─ ʀᴇꜱᴇᴛ ʏᴏᴜʀ ɢʀᴏᴜᴘ ᴘʀᴇꜰɪx ᴛᴏ ᴅᴇꜰᴀᴜʟᴛ"
		}
	},

	langs: {
		en: {
			reset: "✅ ʏᴏᴜʀ ᴘʀᴇꜰɪx ʜᴀꜱ ʙᴇᴇɴ ʀᴇꜱᴇᴛ ᴛᴏ ᴛʜᴇ ᴅᴇꜰᴀᴜʟᴛ: %1",
			onlyAdmin: "⚠️ ᴏɴʟʏ ʙᴏᴛ ᴀᴅᴍɪɴꜱ ᴄᴀɴ ᴄʜᴀɴɢᴇ ᴛʜᴇ ɢʟᴏʙᴀʟ ᴘʀᴇꜰɪx",
			confirmGlobal: "⚠️ ᴘʟᴇᴀꜱᴇ ʀᴇᴀᴄᴛ ᴛᴏ ᴛʜɪꜱ ᴍᴇꜱꜱᴀɢᴇ ᴛᴏ ᴄᴏɴꜰɪʀᴍ ᴄʜᴀɴɢɪɴɢ ᴛʜᴇ *ɢʟᴏʙᴀʟ ᴘʀᴇꜰɪx* ᴛᴏ: %1",
			confirmThisThread: "⚠️ ᴘʟᴇᴀꜱᴇ ʀᴇᴀᴄᴛ ᴛᴏ ᴛʜɪꜱ ᴍᴇꜱꜱᴀɢᴇ ᴛᴏ ᴄᴏɴꜰɪʀᴍ ᴄʜᴀɴɢɪɴɢ ᴛʜᴇ *ɢʀᴏᴜᴘ ᴘʀᴇꜰɪx* ᴛᴏ: %1",
			successGlobal: "✅ ɢʟᴏʙᴀʟ ᴘʀᴇꜰɪx ꜱᴜᴄᴄᴇꜱꜱꜰᴜʟʟʏ ᴄʜᴀɴɢᴇᴅ ᴛᴏ: %1",
			successThisThread: "✅ ɢʀᴏᴜᴘ ᴘʀᴇꜰɪx ꜱᴜᴄᴄᴇꜱꜱꜰᴜʟʟʏ ᴄʜᴀɴɢᴇᴅ ᴛᴏ: %1",
			myPrefix:
				"📊 ᴘʀᴇꜰɪx ɪɴꜰᴏʀᴍᴀᴛɪᴏɴ\n" +
				"├─ 🌐 ɢʟᴏʙᴀʟ ᴘʀᴇꜰɪx: `%1`\n" +
				"└─ 🛸 ɢʀᴏᴜᴘ ᴘʀᴇꜰɪx: `%2`\n\n" +
				"🔗 ʟɪɴᴋꜱ & ꜱᴜᴘᴘᴏʀᴛ\n" +
				"├─ ✅ ᴜꜱᴇ `.supportgc` ᴛᴏ ᴊᴏɪɴ ᴛʜᴇ ᴏꜰꜰɪᴄɪᴀʟ ꜱᴜᴘᴘᴏʀᴛ ɢʀᴏᴜᴘ\n" +
				"└─ 🎀 ᴄᴏɴɴᴇᴄᴛ ᴡɪᴛʜ ᴛʜᴇ ᴅᴇᴠᴇʟᴏᴘᴇʀ: https://www.facebook.com/mueid.mursalin.rifat1"
		}
	},

	onStart: async function ({ message, role, args, commandName, event, threadsData, getLang }) {
		if (!args[0]) return message.SyntaxError();

		if (args[0].toLowerCase() === "reset") {
			await threadsData.set(event.threadID, null, "data.prefix");
			console.log(`🔄 ᴘʀᴇꜰɪx ʀᴇꜱᴇᴛ ɪɴ ᴛʜʀᴇᴀᴅ ${event.threadID}`);
			return message.reply(getLang("reset", global.GoatBot.config.prefix));
		}

		const newPrefix = args[0];
		const setGlobal = args[1]?.toLowerCase() === "-ɢ" || args[1]?.toLowerCase() === "-g";

		if (setGlobal && role < 2) {
			console.log(`🚫 ᴜɴᴀᴜᴛʜᴏʀɪᴢᴇᴅ ɢʟᴏʙᴀʟ ᴘʀᴇꜰɪx ᴄʜᴀɴɢᴇ ᴀᴛᴛᴇᴍᴘᴛ ʙʏ ${event.senderID}`);
			return message.reply(getLang("onlyAdmin"));
		}

		const confirmationMsg = setGlobal
			? getLang("confirmGlobal", newPrefix)
			: getLang("confirmThisThread", newPrefix);

		const formSet = {
			commandName,
			author: event.senderID,
			newPrefix,
			setGlobal
		};

		console.log(`🔧 ᴘʀᴇꜰɪx ᴄʜᴀɴɢᴇ ʀᴇQᴜᴇꜱᴛ: ${newPrefix} (${setGlobal ? 'ɢʟᴏʙᴀʟ' : 'ɢʀᴏᴜᴘ'}) ʙʏ ${event.senderID}`);

		return message.reply(confirmationMsg, (err, info) => {
			if (err) return;
			formSet.messageID = info.messageID;
			global.GoatBot.onReaction.set(info.messageID, formSet);
		});
	},

	onReaction: async function ({ message, threadsData, event, Reaction, getLang }) {
		const { author, newPrefix, setGlobal } = Reaction;
		if (event.userID !== author) return;

		if (setGlobal) {
			global.GoatBot.config.prefix = newPrefix;
			fs.writeFileSync(global.client.dirConfig, JSON.stringify(global.GoatBot.config, null, 2));
			console.log(`🌐 ɢʟᴏʙᴀʟ ᴘʀᴇꜰɪx ᴄʜᴀɴɢᴇᴅ ᴛᴏ: ${newPrefix} ʙʏ ${author}`);
			return message.reply(getLang("successGlobal", newPrefix));
		} else {
			await threadsData.set(event.threadID, newPrefix, "data.prefix");
			console.log(`🛸 ɢʀᴏᴜᴘ ᴘʀᴇꜰɪx ᴄʜᴀɴɢᴇᴅ ᴛᴏ: ${newPrefix} ɪɴ ᴛʜʀᴇᴀᴅ ${event.threadID} ʙʏ ${author}`);
			return message.reply(getLang("successThisThread", newPrefix));
		}
	},

	onChat: async function ({ event, message, getLang }) {
		if (event.body && event.body.toLowerCase() === "prefix") {
			const threadPrefix = utils.getPrefix(event.threadID);
			console.log(`ℹ️ ᴘʀᴇꜰɪx ɪɴꜰᴏ ʀᴇQᴜᴇꜱᴛᴇᴅ ɪɴ ᴛʜʀᴇᴀᴅ ${event.threadID}`);
			return () => message.reply(
				getLang("myPrefix", global.GoatBot.config.prefix, threadPrefix)
			);
		}
	}
};