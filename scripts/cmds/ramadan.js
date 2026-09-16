const axios = require('axios');

module.exports = {
  config: {
    name: "ramadan",
    aliases: ["roza", "ifter", "iftertime"],
    version: "2.0",
    author: "xalman",
    countDown: 5,
    role: 0,
    shortDescription: "Schedules for Sehri and Iftar based on city",
    longDescription: "Get real-time Ramadan timings (Sehri and Iftar) for any city.",
    category: "Islamic",
    guide: "{pn} [city_name]"
  },

  onStart: async ({ api, event, args }) => {
    const { threadID, messageID } = event;
    const city = args.join(" ") || "Dhaka";

    try {
      const res = await axios.get(`http://api.aladhan.com/v1/timingsByCity`, {
        params: {
          city: city,
          country: "Bangladesh",
          method: 1 
        }
      });

      const { timings, date } = res.data.data;

      const infoMsg = `┏━━━━━✦ 🌙 ✦━━━━━┓
     Ramadan Calendar 
┗━━━━━━━━━━━━━━━┛

📍 City: ${city.toUpperCase()}
📅 Date: ${date.readable}
🕋 Hijri: ${date.hijri.date}

━━━━━━━━━━━━━━━━
⚪ Sehri Ends: ${timings.Fajr}
🟠 Iftar Time: ${timings.Maghrib}
━━━━━━━━━━━━━━━━

✨ Dua (Iftar): "Allahumma laka sumtu wa ala rizqika aftartu."

May Allah accept your fasts. 🤲`;

      return api.sendMessage(infoMsg, threadID, messageID);

    } catch (error) {
      return api.sendMessage(`❌ Information for '${city}' not found. Please type the city name correctly in English (e.g., !ramadan Dhaka)`, threadID, messageID);
    }
  }
};
