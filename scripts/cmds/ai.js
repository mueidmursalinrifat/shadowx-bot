const axios = require('axios');

// Memory storage (per user)
let memory = {};  // { threadID: { userID: [ {role, content}, ... ] } }

module.exports = {
  config: {
    name: "gpt",
    aliases: ["ai", "openai"],
    version: "1.0",
    author: "Mueid Mursalin Rifat",
    countDown: 2,
    role: 0,
    shortDescription: { en: "Advanced AI with history + reply support" },
    longDescription: { en: "OpenAI GPT3.5 with 50-message memory per user" },
    category: "ai"
  },

  onStart: async function ({ message, args, event }) {
    handleAI(message, args, event);
  },

  onReply: async function ({ Reply, message, args, event }) {
    handleAI(message, args, event, true);
  }
};


// MAIN AI FUNCTION
async function handleAI(message, args, event, isReply = false) {
  const { threadID, senderID, body, messageReply } = event;

  const userText = args.join(" ") || body;

  if (!userText)
    return message.reply("❌ Please enter a message.");

  // Initialize memory
  if (!memory[threadID]) memory[threadID] = {};
  if (!memory[threadID][senderID]) memory[threadID][senderID] = [];

  // Add user message to memory
  memory[threadID][senderID].push({
    role: "user",
    content: userText
  });

  // Keep only last 50 messages
  memory[threadID][senderID] =
    memory[threadID][senderID].slice(-50);

  // Build full chat history for API
  const chatHistory = memory[threadID][senderID];

  let data = JSON.stringify({
    model: "gpt-3.5-turbo",
    numCompletions: 1,
    messages: chatHistory
  });

  let config = {
    method: "POST",
    url: "https://api.appexlabs.io/v1/chat/openai/completions",
    headers: {
      "User-Agent": "Bonsai/29 CFNetwork/3860.200.71 Darwin/25.1.0",
      "Content-Type": "application/json",
      "x-user-id": "02B6DACA-2725-4B5A-A620-993C62C746EC",
      "x-app-id": "com.joinappex.bonsai-1.3",
      "priority": "u=3",
      "x-api-key": "nnS0zfWRuC4yeYAp0jagT9IyX8qj5kwNh0Tqfo56",
      "accept-language": "en-US,en;q=0.9"
    },
    data: data
  };

  try {
    const res = await axios.request(config);

    // Extract content from "completions"
    const text =
      res.data?.completions?.[0]?.content ||
      res.data?.completions?.[0]?.message?.content ||
      "⚠️ No response received.";

    // Save assistant reply to memory
    memory[threadID][senderID].push({
      role: "assistant",
      content: text
    });

    // Keep memory last 50
    memory[threadID][senderID] =
      memory[threadID][senderID].slice(-50);

    return message.reply(text, (err, info) => {
      // Enable reply-based conversation
      global.GoatBot.onReply.set(info.messageID, {
        commandName: module.exports.config.name,
        messageID: info.messageID,
        author: senderID
      });
    });

  } catch (error) {
    console.log(error);
    return message.reply("❌ API Error: " + error.message);
  }
}