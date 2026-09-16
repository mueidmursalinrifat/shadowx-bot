const COUNTRIES = [
 { n: "Bangladesh", c: "BD" }, { n: "India", c: "IN" }, { n: "Pakistan", c: "PK" },
 { n: "United States", c: "US" }, { n: "United Kingdom", c: "GB" }, { n: "Canada", c: "CA" },
 { n: "Australia", c: "AU" }, { n: "Brazil", c: "BR" }, { n: "Japan", c: "JP" },
 { n: "China", c: "CN" }, { n: "South Korea", c: "KR" }, { n: "Germany", c: "DE" },
 { n: "France", c: "FR" }, { n: "Italy", c: "IT" }, { n: "Spain", c: "ES" },
 { n: "Netherlands", c: "NL" }, { n: "Russia", c: "RU" }, { n: "Turkey", c: "TR" },
 { n: "Saudi Arabia", c: "SA" }, { n: "United Arab Emirates", c: "AE" }, { n: "Qatar", c: "QA" },
 { n: "Indonesia", c: "ID" }, { n: "Malaysia", c: "MY" }, { n: "Philippines", c: "PH" },
 { n: "Thailand", c: "TH" }, { n: "Vietnam", c: "VN" }, { n: "Nepal", c: "NP" },
 { n: "Sri Lanka", c: "LK" }, { n: "Afghanistan", c: "AF" }, { n: "Iran", c: "IR" },
 { n: "Iraq", c: "IQ" }, { n: "Egypt", c: "EG" }, { n: "Morocco", c: "MA" },
 { n: "Nigeria", c: "NG" }, { n: "South Africa", c: "ZA" }, { n: "Kenya", c: "KE" },
 { n: "Mexico", c: "MX" }, { n: "Argentina", c: "AR" }, { n: "Chile", c: "CL" },
 { n: "Colombia", c: "CO" }, { n: "Peru", c: "PE" }, { n: "Sweden", c: "SE" },
 { n: "Norway", c: "NO" }, { n: "Denmark", c: "DK" }, { n: "Finland", c: "FI" },
 { n: "Poland", c: "PL" }, { n: "Ukraine", c: "UA" }, { n: "Greece", c: "GR" },
 { n: "Portugal", c: "PT" }, { n: "Switzerland", c: "CH" }, { n: "Austria", c: "AT" },
 { n: "Belgium", c: "BE" }, { n: "Ireland", c: "IE" }, { n: "New Zealand", c: "NZ" },
 { n: "Singapore", c: "SG" }, { n: "Hong Kong", c: "HK" }, { n: "Taiwan", c: "TW" },
 { n: "Israel", c: "IL" }, { n: "Jordan", c: "JO" }, { n: "Lebanon", c: "LB" },
 { n: "Kuwait", c: "KW" }, { n: "Bahrain", c: "BH" }, { n: "Oman", c: "OM" },
 { n: "Algeria", c: "DZ" }, { n: "Tunisia", c: "TN" }, { n: "Libya", c: "LY" },
 { n: "Sudan", c: "SD" }, { n: "Ethiopia", c: "ET" }, { n: "Ghana", c: "GH" },
 { n: "Zimbabwe", c: "ZW" }, { n: "Cuba", c: "CU" }, { n: "Jamaica", c: "JM" },
 { n: "Panama", c: "PA" }, { n: "Venezuela", c: "VE" }, { n: "Iceland", c: "IS" },
 { n: "Croatia", c: "HR" }, { n: "Serbia", c: "RS" }, { n: "Romania", c: "RO" },
 { n: "Hungary", c: "HU" }, { n: "Czech Republic", c: "CZ" }, { n: "Slovakia", c: "SK" },
 { n: "Bulgaria", c: "BG" }, { n: "Albania", c: "AL" }, { n: "Mongolia", c: "MN" },
 { n: "Cambodia", c: "KH" }, { n: "Myanmar", c: "MM" }, { n: "Maldives", c: "MV" },
 { n: "Bhutan", c: "BT" }, { n: "Uzbekistan", c: "UZ" }, { n: "Kazakhstan", c: "KZ" }
];

const EXPIRE_MS = 30000;

const flagEmoji = code => code
  .toUpperCase()
  .split("")
  .map(ch => String.fromCodePoint(0x1F1E6 + (ch.charCodeAt(0) - 65)))
  .join("");

const shuffle = arr => {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

const unsendSafe = async (message, messageID) => {
  try { await message.unsend(messageID); } catch (e) {}
};

module.exports = {
  config: {
    name: "flagquiz",
    aliases: ["fq", "flag2"],
    version: "1.1",
    author: "SHADOWX",
    countDown: 5,
    role: 0,
    description: "Guess the country by its flag (offline, no API). Question auto-deletes.",
    category: "GAMES",
    guide: "Type {pn} to start. Reply A/B/C/D to answer."
  },

  onStart: async function ({ event, message }) {
    const { senderID } = event;
    const pool = shuffle(COUNTRIES);
    const correct = pool[0];
    const options = shuffle(pool.slice(0, 4));
    const correctIndex = options.findIndex(o => o.n === correct.n);
    const labels = ["A", "B", "C", "D"];

    const body =
      "🚩 Guess the Country\n\n" +
      `${flagEmoji(correct.c)}\n\n` +
      options.map((o, i) => `${labels[i]}. ${o.n}`).join("\n") +
      `\n\n⏳ Reply with A, B, C, or D (auto-delete in ${EXPIRE_MS / 1000}s)`;

    return message.reply(body, (err, info) => {
      if (err) return;
      const messageID = info.messageID;
      const replyData = {
        commandName: this.config.name,
        messageID,
        author: senderID,
        correctIndex,
        options: options.map(o => o.n),
        unsendTimeout: setTimeout(() => {
          global.GoatBot.onReply.delete(messageID);
          unsendSafe(message, messageID);
        }, EXPIRE_MS)
      };
      global.GoatBot.onReply.set(messageID, replyData);
    });
  },

  onReply: async function ({ event, Reply, message, usersData }) {
    const { senderID, body } = event;
    if (senderID !== Reply.author) return;

    const input = (body || "").trim().toUpperCase();
    const labels = ["A", "B", "C", "D"];
    const index = labels.indexOf(input);
    if (index === -1) return;

    if (Reply.unsendTimeout) clearTimeout(Reply.unsendTimeout);
    const questionID = Reply.messageID;
    const correct = Reply.options[Reply.correctIndex];
    global.GoatBot.onReply.delete(questionID);

    if (index === Reply.correctIndex) {
      const reward = 300;
      const userData = await usersData.get(senderID);
      const money = parseInt(userData.money || 0) + reward;
      await usersData.set(senderID, { money });
      message.reply(`✅ Correct! It's ${correct}\n💰 +$${reward}`);
    } else {
      message.reply(`❌ Wrong! The correct answer was: ${correct}`);
    }

    await unsendSafe(message, questionID);
  }
};
