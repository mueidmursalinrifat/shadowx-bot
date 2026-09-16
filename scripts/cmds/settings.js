module.exports = {
 config: {
 name: "settings",
 version: "1.0.4",
 author: "Chitron Bhattacharjee",
 countDown: 5,
 role: 2, // Only bot owner can use
 shortDescription: {
 vi: "Bảng điều khiển cài đặt bot",
 en: "Bot configuration panel"
 },
 longDescription: {
 vi: "Bảng điều khiển cài đặt và quản lý bot",
 en: "Configuration and management panel for the bot"
 },
 category: "admin",
 guide: {
 vi: "Gửi lệnh để xem bảng điều khiển",
 en: "Send command to view control panel"
 }
 },

 langs: {
 vi: {
 panelTitle: "🛠 | Bảng Điều Khiển Bot | 🛠",
 settingsTitle: "=== Quản Lý Cài Đặt ===",
 activityTitle: "=== Quản Lý Hoạt Động ===",
 option1: "[1] Tiền tố lệnh",
 option2: "[2] Tên bot",
 option3: "[3] Danh sách admin",
 option4: "[4] Ngôn ngữ",
 option5: "[5] Tự động khởi động lại",
 option6: "[6] Kiểm tra phiên bản",
 option7: "[7] Danh sách người dùng bị cấm",
 option8: "[8] Danh sách nhóm bị cấm",
 option9: "[9] Gửi thông báo tới tất cả nhóm",
 option10: "[10] Tìm UID theo tên",
 option11: "[11] Tìm ID nhóm theo tên",
 option12: "[12] Đổi biểu tượng nhóm",
 option13: "[13] Đổi tên nhóm",
 option14: "[14] Xem thông tin nhóm",
 selectPrompt: "-> Để chọn, phản hồi tin nhắn này với số tương ứng <-",
 autoRestart: "[⚜️] Bot sẽ tự động khởi động lại lúc 12:00 trưa",
 currentVersion: "[⚜️] Phiên bản hiện tại: ",
 bannedUsers: "[⚜️] Hiện có %1 người dùng bị cấm\n\n%2",
 bannedThreads: "[⚜️] Hiện có %1 nhóm bị cấm\n\n%2",
 announcementPrompt: "[⚜️] Phản hồi với nội dung bạn muốn gửi tới tất cả nhóm",
 findUidPrompt: "[⚜️] Phản hồi với tên người dùng để tìm UID",
 findThreadPrompt: "[⚜️] Phản hồi với tên nhóm để tìm ID",
 emojiPrompt: "[⚜️] Phản hồi với biểu tượng bạn muốn đổi",
 namePrompt: "[⚜️] Phản hồi với tên nhóm mới",
 announcementSent: "[⚜️] Đã gửi thông báo tới: %1 nhóm\n\n[⚜️] Thất bại: %2 nhóm",
 threadInfo: "✨ Tên: %1\n🤖 ID nhóm: %2\n👀 Chế độ phê duyệt: %3\n🧠 Biểu tượng: %4\n👉 Thông tin: %5 thành viên\n👦 Nam: %6 thành viên\n👩‍🦰 Nữ: %7 thành viên\nVới %8 quản trị viên\n🕵️‍♀️ Tổng số tin nhắn: %9\n",
 noResult: "Không tìm thấy kết quả nào phù hợp"
 },
 en: {
 panelTitle: "🛠 | Bot Configuration Panel | 🛠",
 settingsTitle: "=== Settings Management ===",
 activityTitle: "=== Activity Management ===",
 option1: "[1] Prefix",
 option2: "[2] Bot name",
 option3: "[3] Admin list",
 option4: "[4] Language",
 option5: "[5] Auto-restart",
 option6: "[6] Check updates",
 option7: "[7] Banned users list",
 option8: "[8] Banned groups list",
 option9: "[9] Send announcement to all groups",
 option10: "[10] Find UID by username",
 option11: "[11] Find group ID by name",
 option12: "[12] Change group emoji",
 option13: "[13] Change group name",
 option14: "[14] View group info",
 selectPrompt: "-> To select, reply to this message with a number <-",
 autoRestart: "[⚜️] Bot will auto-restart at 12:00 PM",
 currentVersion: "[⚜️] Current bot version: ",
 bannedUsers: "[⚜️] Currently %1 banned users\n\n%2",
 bannedThreads: "[⚜️] Currently %1 banned groups\n\n%2",
 announcementPrompt: "[⚜️] Reply with the message you want to send to all groups",
 findUidPrompt: "[⚜️] Reply with the username to find UID",
 findThreadPrompt: "[⚜️] Reply with the group name to find ID",
 emojiPrompt: "[⚜️] Reply with the emoji to change",
 namePrompt: "[⚜️] Reply with the new group name",
 announcementSent: "[⚜️] Successfully sent to: %1 groups\n\n[⚜️] Failed: %2 groups",
 threadInfo: "✨ Name: %1\n🤖 Group ID: %2\n👀 Approval: %3\n🧠 Emoji: %4\n👉 Info: %5 members\n👦 Male: %6 members\n👩‍🦰 Female: %7 members\nWith %8 admins\n🕵️‍♀️ Total messages: %9\n",
 noResult: "There is no result with your input"
 }
 },

 onStart: async function ({ api, event, message, args, threadsData, usersData, getLang }) {
 if (!args[0]) {
 const panelMessage = [
 getLang("panelTitle"),
 getLang("settingsTitle"),
 getLang("option1"),
 getLang("option2"),
 getLang("option3"),
 getLang("option4"),
 getLang("option5"),
 getLang("activityTitle"),
 getLang("option6"),
 getLang("option7"),
 getLang("option8"),
 getLang("option9"),
 getLang("option10"),
 getLang("option11"),
 getLang("option12"),
 getLang("option13"),
 getLang("option14"),
 getLang("selectPrompt")
 ].join("\n");

 return message.reply(panelMessage, (err, info) => {
 global.GoatBot.onReply.set(info.messageID, {
 commandName: this.config.name,
 author: event.senderID,
 type: "choose"
 });
 });
 }
 },

 onReply: async function ({ api, event, message, Reply, args, threadsData, usersData, getLang }) {
 const { type, author } = Reply;
 if (author != event.senderID) return;

 switch (type) {
 case "choose":
 const choice = event.body;
 switch (choice) {
 case "1":
 return message.reply(`Bot prefix: ${global.GoatBot.config.prefix}`);
 case "2":
 return message.reply(`Bot name: ${global.GoatBot.config.botName}`);
 case "3": {
 const admins = global.GoatBot.config.adminBot;
 let adminList = [];
 for (const adminID of admins) {
 const name = await usersData.getName(adminID);
 adminList.push(`${name} - ${adminID}`);
 }
 return message.reply(`[⚜️] Admin List [⚜️]\n\n${adminList.join("\n")}`);
 }
 case "4":
 return message.reply(`Language: ${global.GoatBot.config.language}`);
 case "5":
 return message.reply(getLang("autoRestart"));
 case "6":
 return message.reply(getLang("currentVersion") + this.config.version);
 case "7": {
 const bannedUsers = global.GoatBot.bannedUsers;
 let bannedList = [];
 let count = 1;
 for (const [id, reason] of bannedUsers) {
 const name = await usersData.getName(id);
 bannedList.push(`${count++}. ${name}\n[⚜️] UID: ${id}\nReason: ${reason}`);
 }
 return message.reply(getLang("bannedUsers", bannedUsers.size, bannedList.join("\n\n")));
 }
 case "8": {
 const bannedThreads = global.GoatBot.bannedThreads;
 let bannedList = [];
 let count = 1;
 for (const [id, reason] of bannedThreads) {
 const threadInfo = await threadsData.get(id);
 bannedList.push(`${count++}. ${threadInfo.threadName}\n[⚜️] TID: ${id}\nReason: ${reason}`);
 }
 return message.reply(getLang("bannedThreads", bannedThreads.size, bannedList.join("\n\n")));
 }
 case "9":
 return message.reply(getLang("announcementPrompt"), (err, info) => {
 global.GoatBot.onReply.set(info.messageID, {
 commandName: this.config.name,
 author: event.senderID,
 type: "sendAnnouncement"
 });
 });
 case "10":
 return message.reply(getLang("findUidPrompt"), (err, info) => {
 global.GoatBot.onReply.set(info.messageID, {
 commandName: this.config.name,
 author: event.senderID,
 type: "findUid"
 });
 });
 case "11":
 return message.reply(getLang("findThreadPrompt"), (err, info) => {
 global.GoatBot.onReply.set(info.messageID, {
 commandName: this.config.name,
 author: event.senderID,
 type: "findThread"
 });
 });
 case "12":
 return message.reply(getLang("emojiPrompt"), (err, info) => {
 global.GoatBot.onReply.set(info.messageID, {
 commandName: this.config.name,
 author: event.senderID,
 type: "changeEmoji"
 });
 });
 case "13":
 return message.reply(getLang("namePrompt"), (err, info) => {
 global.GoatBot.onReply.set(info.messageID, {
 commandName: this.config.name,
 author: event.senderID,
 type: "changeName"
 });
 });
 case "14": {
 const threadInfo = await threadsData.get(event.threadID);
 const participants = threadInfo.members.length;
 let maleCount = 0;
 let femaleCount = 0;
 
 for (const member of threadInfo.members) {
 const userInfo = await usersData.get(member.userID);
 if (userInfo.gender === "MALE") maleCount++;
 else if (userInfo.gender === "FEMALE") femaleCount++;
 }
 
 const approvalMode = threadInfo.approvalMode ? "on" : "off";
 
 return message.reply(getLang("threadInfo", 
 threadInfo.threadName,
 event.threadID,
 approvalMode,
 threadInfo.emoji,
 participants,
 maleCount,
 femaleCount,
 threadInfo.adminIDs.length,
 threadInfo.messageCount
 ));
 }
 default:
 return message.reply(getLang("noResult"));
 }
 break;
 
 case "sendAnnouncement": {
 const allThreads = await threadsData.getAll();
 const senderName = await usersData.getName(event.senderID);
 let successCount = 0;
 let failedThreads = [];
 
 for (const thread of allThreads) {
 if (thread.threadID !== event.threadID) {
 try {
 await message.send(
 `[⚜️] Announcement from admin ${senderName}\n\n${event.body}`,
 thread.threadID
 );
 successCount++;
 await new Promise(resolve => setTimeout(resolve, 500));
 } catch (e) {
 failedThreads.push(thread.threadID);
 }
 }
 }
 
 return message.reply(getLang("announcementSent", successCount, failedThreads.length));
 }
 
 case "findUid": {
 try {
 const name = event.body;
 const users = await api.searchUsers(name);
 let result = "";
 for (const user of users) {
 result += `Name: ${user.name}\nUID: ${user.userID}\n\n`;
 }
 return message.reply(result || getLang("noResult"));
 } catch (e) {
 return message.reply(getLang("noResult"));
 }
 }
 
 case "findThread": {
 try {
 const name = event.body;
 const allThreads = await threadsData.getAll();
 let foundThreads = [];
 
 for (const thread of allThreads) {
 if (thread.threadName.toLowerCase().includes(name.toLowerCase())) {
 foundThreads.push({
 name: thread.threadName,
 id: thread.threadID
 });
 }
 }
 
 if (foundThreads.length > 0) {
 let result = foundThreads.map((t, i) => `${i + 1}. ${t.name} - ${t.id}`).join("\n");
 return message.reply(result);
 } else {
 return message.reply(getLang("noResult"));
 }
 } catch (e) {
 return message.reply(getLang("noResult"));
 }
 }
 
 case "changeEmoji": {
 try {
 await api.changeThreadEmoji(event.body, event.threadID);
 return message.reply(`[⚜️] Successfully changed emoji to: ${event.body}`);
 } catch (e) {
 return message.reply("[⚜️] An error occurred");
 }
 }
 
 case "changeName": {
 try {
 await api.setTitle(event.body, event.threadID);
 return message.reply(`[⚜️] Changed group name to ${event.body}`);
 } catch (e) {
 return message.reply("[⚜️] An error occurred");
 }
 }
 }
 }
};