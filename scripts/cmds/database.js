const fs = require("fs-extra");
const path = require("path");
const mongoose = require("mongoose");

const commandAuthor = "Mueid Mursalin Rifat";

const TIMEOUT_MS = 8000;
const SWITCH_TEST_TIMEOUT_MS = 20000;
const RELOAD_TIMEOUT_MS = 90000;

const SUPPORTED_TYPES = ["mongodb", "neon", "sqlite"];

function withTimeout(promise, ms, fallback) {
	return Promise.race([
		Promise.resolve(promise).catch(() => fallback),
		new Promise((resolve) => setTimeout(() => resolve(fallback), ms))
	]);
}

async function countDocuments(model, dataLayer) {
	try {
		if (model && typeof model.count === "function") {
			const count = await withTimeout(model.count(), TIMEOUT_MS, null);
			if (typeof count === "number")
				return count;
		}
	} catch (_) {}

	try {
		if (dataLayer && typeof dataLayer.getAll === "function") {
			const all = await withTimeout(dataLayer.getAll(), TIMEOUT_MS, null);
			if (Array.isArray(all))
				return all.length;
		}
	} catch (_) {}

	return null;
}

function mask(value, max = 40) {
	if (!value)
		return "Unknown";
	const text = String(value);
	return text.length > max ? `${text.slice(0, max)}…` : text;
}

function getMongoUri(config) {
	return process.env.MONGODB_URI
		|| process.env.MONGO_URL
		|| process.env.MONGO_URI
		|| (config.database && config.database.uriMongodb);
}

function getNeonUri(config) {
	return process.env.NEON_DATABASE_URL
		|| process.env.DATABASE_URL
		|| (config.database && config.database.uriNeon);
}

function getMongoStatus() {
	const conn = mongoose.connection;
	const ready = conn.readyState;

	const stateMap = {
		0: { text: "Disconnected", ok: false },
		1: { text: "Connected", ok: true },
		2: { text: "Connecting", ok: false },
		3: { text: "Disconnecting", ok: false }
	};

	const state = stateMap[ready] || { text: "Unknown", ok: false };

	return {
		type: "MongoDB",
		state: state.text,
		ok: state.ok,
		host: mask(conn.host),
		port: conn.port || "Unknown",
		name: mask(conn.name),
		driver: `Mongoose v${mongoose.version}`
	};
}

async function getSequelizeStatus(sequelize, type) {
	const started = Date.now();

	let alive = false;
	try {
		alive = await withTimeout(sequelize.authenticate(), TIMEOUT_MS, false);
	} catch (_) {}

	const latency = Date.now() - started;
	const connected = alive !== false;

	const cfg = (sequelize && (sequelize.config || sequelize.options)) || {};

	if (type === "sqlite") {
		const storage = cfg.storage || "Unknown";
		let sizeText = "Unknown";

		try {
			if (fs.existsSync(storage)) {
				const bytes = fs.statSync(storage).size;
				sizeText = bytes >= 1048576
					? `${(bytes / 1048576).toFixed(2)} MB`
					: `${(bytes / 1024).toFixed(2)} KB`;
			}
		} catch (_) {}

		return {
			type: "SQLite",
			state: connected ? "Connected" : "Disconnected",
			ok: connected,
			host: "Local file",
			port: "—",
			name: mask(storage),
			extra: `Size: ${sizeText}`,
			latency,
			driver: `Sequelize v${require("sequelize/package.json").version}`
		};
	}

	return {
		type: "Neon (PostgreSQL)",
		state: connected ? "Connected" : "Disconnected",
		ok: connected,
		host: mask(cfg.host),
		port: cfg.port || (type === "neon" ? "5432 (default)" : "Unknown"),
		name: mask(cfg.database),
		latency,
		driver: `Sequelize v${require("sequelize/package.json").version}`
	};
}

async function getStatus(dbType, db) {
	if (dbType === "mongodb")
		return getMongoStatus();

	if (dbType === "neon" || dbType === "sqlite") {
		if (!db || !db.sequelize) {
			return {
				type: dbType === "neon" ? "Neon (PostgreSQL)" : "SQLite",
				state: "Not initialized",
				ok: false,
				host: "Unknown",
				port: "Unknown",
				name: "Unknown",
				driver: "Unknown"
			};
		}
		return await getSequelizeStatus(db.sequelize, dbType);
	}

	return {
		type: dbType || "Unknown",
		state: "Unsupported type",
		ok: false,
		host: "Unknown",
		port: "Unknown",
		name: "Unknown",
		driver: "Unknown"
	};
}

async function buildStatus(getLang) {
	const { config } = global.GoatBot;
	const dbType = config.database ? config.database.type : "unknown";
	const db = global.db || {};

	const status = await getStatus(dbType, db);

	if (dbType === "mongodb" && status.ok) {
		const started = Date.now();
		try {
			await withTimeout(mongoose.connection.db.admin().ping(), TIMEOUT_MS, null);
			status.latency = Date.now() - started;
		} catch (_) {
			status.latency = null;
		}
	}

	const na = getLang("notAvailable");

	const [
		threadsCount,
		usersCount,
		dashBoardCount,
		globalCount
	] = await Promise.all([
		countDocuments(db.threadModel, db.threadsData),
		countDocuments(db.userModel, db.usersData),
		countDocuments(db.dashBoardModel, db.dashBoardData),
		countDocuments(db.globalModel, db.globalData)
	]);

	const dot = status.ok ? "🟢" : "🔴";
	const latencyText = status.latency != null
		? `${status.latency} ms`
		: na;

	return [
		getLang("header"),
		"",
		`${getLang("engine")}: ${status.type}`,
		`${getLang("state")}: ${dot} ${status.state}`,
		`${getLang("host")}: ${status.host}`,
		`${getLang("port")}: ${status.port}`,
		`${getLang("name")}: ${status.name}`,
		`${getLang("driver")}: ${status.driver}`,
		status.extra ? status.extra : null,
		`${getLang("latency")}: ${latencyText}`,
		"",
		getLang("collections"),
		`   • ${getLang("threads")}: ${threadsCount == null ? na : threadsCount}`,
		`   • ${getLang("users")}: ${usersCount == null ? na : usersCount}`,
		`   • ${getLang("dashboard")}: ${dashBoardCount == null ? na : dashBoardCount}`,
		`   • ${getLang("global")}: ${globalCount == null ? na : globalCount}`,
		"",
		getLang("footer")
	].filter(Boolean).join("\n");
}

async function testConnection(type, config) {
	if (type === "mongodb") {
		const uri = getMongoUri(config);
		if (!uri || !String(uri).trim())
			throw new Error("No MongoDB URI configured");

		const result = await withTimeout(
			(async () => {
				await mongoose.connect(uri, { serverSelectionTimeoutMS: SWITCH_TEST_TIMEOUT_MS });
				await mongoose.connection.db.admin().ping();
				await mongoose.disconnect();
				return "ok";
			})(),
			SWITCH_TEST_TIMEOUT_MS,
			"timeout"
		);

		if (result !== "ok")
			throw new Error(`MongoDB connection timed out after ${SWITCH_TEST_TIMEOUT_MS / 1000}s`);

		return;
	}

	if (type === "neon") {
		const uri = getNeonUri(config);
		if (!uri || !String(uri).trim())
			throw new Error("Missing Neon connection string");

		const net = require("net");
		if (typeof net.setDefaultAutoSelectFamily === "function")
			net.setDefaultAutoSelectFamily(false);

		const { Sequelize } = require("sequelize");

		const result = await withTimeout(
			(async () => {
				const seq = new Sequelize(uri, {
					dialect: "postgres",
					logging: false,
					dialectOptions: { ssl: true },
					pool: { max: 1, min: 0 }
				});
				await seq.authenticate();
				await seq.close();
				return "ok";
			})(),
			SWITCH_TEST_TIMEOUT_MS,
			"timeout"
		);

		if (result !== "ok")
			throw new Error(`Neon connection timed out after ${SWITCH_TEST_TIMEOUT_MS / 1000}s`);

		return;
	}

	const storage = path.join(
		path.dirname(global.client.dirConfig),
		"database", "data", "data.sqlite"
	);

	const { Sequelize } = require("sequelize");

	const result = await withTimeout(
		(async () => {
			const seq = new Sequelize({
				dialect: "sqlite",
				storage,
				logging: false,
				pool: { max: 1, min: 0 }
			});
			await seq.authenticate();
			await seq.close();
			return "ok";
		})(),
		SWITCH_TEST_TIMEOUT_MS,
		"timeout"
	);

	if (result !== "ok")
		throw new Error(`SQLite connection timed out after ${SWITCH_TEST_TIMEOUT_MS / 1000}s`);
}

function flushDatabaseRequireCache() {
	const root = path.dirname(global.client.dirConfig);
	const dbDir = path.join(root, "database");

	for (const key of Object.keys(require.cache)) {
		if (key === dbDir || key.startsWith(dbDir + path.sep))
			delete require.cache[key];
	}
}

function forgetMongooseModels() {
	for (const name of ["thread", "user", "userDashBoard", "global"]) {
		try {
			mongoose.deleteModel(name);
		} catch (_) {}
	}
}

async function closeOldEngine(oldType) {
	if (oldType === "mongodb") {
		try {
			await mongoose.disconnect();
		} catch (_) {}
		return;
	}

	const seq = global.db && global.db.sequelize;
	if (seq && typeof seq.close === "function") {
		try {
			await seq.close();
		} catch (_) {}
	}
}

async function switchDatabase({ message, args, getLang, event }) {
	const { config } = global.GoatBot;
	const { threadID, messageID } = event;

	const current = config.database ? config.database.type : null;
	const target = String(args[1] || "").toLowerCase();

	if (!SUPPORTED_TYPES.includes(target)) {
		return message.reply(
			getLang("switchInvalid")
				.replace("{types}", SUPPORTED_TYPES.join(" | "))
		);
	}

	if (target === current) {
		return message.reply(getLang("switchSameType").replace("{type}", target));
	}

	if (target === "mongodb" && !getMongoUri(config))
		return message.reply(getLang("missingUriMongo"));

	if (target === "neon" && !getNeonUri(config))
		return message.reply(getLang("missingUriNeon"));

	await message.reply(getLang("switchTesting").replace("{type}", target));

	try {
		await testConnection(target, config);
	}
	catch (err) {
		return message.reply(
			getLang("switchTestFail")
				.replace("{type}", target)
				.replace("{error}", err && err.message ? err.message : String(err))
				.replace("{current}", current || "unknown")
		);
	}

	try {
		const rawConfig = JSON.parse(fs.readFileSync(global.client.dirConfig, "utf8"));
		rawConfig.database.type = target;
		fs.writeFileSync(global.client.dirConfig, JSON.stringify(rawConfig, null, 2));
		config.database.type = target;
	}
	catch (err) {
		return message.reply(
			getLang("switchSaveFail").replace("{error}", err && err.message ? err.message : String(err))
		);
	}

	if (target === "mongodb")
		forgetMongooseModels();

	flushDatabaseRequireCache();

	let reloadError = null;

	try {
		await withTimeout(
			global.GoatBot.reLoginBot(),
			RELOAD_TIMEOUT_MS,
			"timeout"
		);
	}
	catch (err) {
		reloadError = err && err.message ? err.message : String(err);
	}

	if (reloadError) {
		return message.reply(
			getLang("switchReloadFail")
				.replace("{type}", target)
				.replace("{error}", reloadError)
		);
	}

	await closeOldEngine(current);

	let body;
	try {
		body = await buildStatus(getLang);
	}
	catch (_) {
		body = getLang("switchOk").replace("{type}", target);
	}

	const api = global.GoatBot.fcaApi;
	const sendApi = api && typeof api.sendMessage === "function" ? api : message;

	return sendApi.sendMessage(
		`${getLang("switchOk").replace("{type}", target)}\n\n${body}`,
		threadID,
		messageID
	);
}

module.exports = {
	config: {
		name: "database",
		aliases: ["dbstatus", "db"],
		version: "1.1",
		author: commandAuthor,
		countDown: 5,
		role: 1,
		description: {
			en: "Show live database status, or switch engine: {pn} switch <mongodb | neon | sqlite>",
			vi: "Hiển thị trạng thái database, hoặc đổi engine: {pn} switch <mongodb | neon | sqlite>"
		},
		category: "system",
		guide: {
			en: "   {pn}\n   {pn} switch <mongodb | neon | sqlite>",
			vi: "   {pn}\n   {pn} switch <mongodb | neon | sqlite>"
		}
	},

	langs: {
		en: {
			header: "┏━━━━━━━━━━━━━━━━━━━━━━━━━━┓\n┃  🗄️ DATABASE STATUS  ┃\n┗━━━━━━━━━━━━━━━━━━━━━━━━━━┛",
			engine: "⚙️ Engine",
			state: "📡 State",
			host: "🌐 Host",
			port: "🔌 Port",
			name: "📦 Database",
			driver: "🧩 Driver",
			latency: "⚡ Latency",
			collections: "📊 Records",
			threads: "Threads",
			users: "Users",
			dashboard: "Dashboard",
			global: "Global",
			notAvailable: "N/A",
			footer: "© Mueid Mursalin Rifat • SHADOWX-BOT",
			switchInvalid: "⚠️ Invalid database type.\nUsage: database switch <{types}>\nNote: this build does not support the \"json\" engine.",
			switchSameType: "ℹ️ The bot is already using \"{type}\".",
			missingUriMongo: "❌ No MongoDB URI configured.\nSet database.uriMongodb in config.json (or MONGODB_URI env) first.",
			missingUriNeon: "❌ No Neon connection string configured.\nSet database.uriNeon in config.json (or NEON_DATABASE_URL env) first.",
			switchTesting: "⏳ Testing connection to {type}...",
			switchTestFail: "❌ Connection test to {type} failed:\n{error}\n\nConfig unchanged — still using {current}.",
			switchSaveFail: "❌ Connection worked but config.json could not be saved:\n{error}",
			switchReloadFail: "⚠️ Config saved to {type}, but the in-process reload failed:\n{error}\nThe old database is still active until the next restart.",
			switchOk: "✅ Database switched to {type}. Connection OK."
		},
		vi: {
			header: "┏━━━━━━━━━━━━━━━━━━━━━━━━━━┓\n┃  🗄️ TRẠNG THÁI DATABASE  ┃\n┗━━━━━━━━━━━━━━━━━━━━━━━━━━┛",
			engine: "⚙️ Engine",
			state: "📡 Trạng thái",
			host: "🌐 Host",
			port: "🔌 Port",
			name: "📦 Database",
			driver: "🧩 Driver",
			latency: "⚡ Độ trễ",
			collections: "📊 Bản ghi",
			threads: "Nhóm",
			users: "Người dùng",
			dashboard: "Dashboard",
			global: "Global",
			notAvailable: "N/A",
			footer: "© Mueid Mursalin Rifat • SHADOWX-BOT",
			switchInvalid: "⚠️ Loại database không hợp lệ.\nCú pháp: database switch <{types}>\nLưu ý: bản này không hỗ trợ engine \"json\".",
			switchSameType: "ℹ️ Bot đang dùng \"{type}\".",
			missingUriMongo: "❌ Chưa cấu hình URI MongoDB.\nHãy đặt database.uriMongodb trong config.json (hoặc env MONGODB_URI).",
			missingUriNeon: "❌ Chưa cấu hình chuỗi kết nối Neon.\nHãy đặt database.uriNeon trong config.json (hoặc env NEON_DATABASE_URL).",
			switchTesting: "⏳ Đang kiểm tra kết nối tới {type}...",
			switchTestFail: "❌ Kiểm tra kết nối tới {type} thất bại:\n{error}\n\nConfig không đổi — vẫn dùng {current}.",
			switchSaveFail: "❌ Kết nối OK nhưng không lưu được config.json:\n{error}",
			switchReloadFail: "⚠️ Đã lưu config sang {type}, nhưng nạp lại trong process thất bại:\n{error}\nDatabase cũ vẫn dùng đến khi khởi động lại.",
			switchOk: "✅ Đã chuyển database sang {type}. Kết nối OK."
		}
	},

	onStart: async function ({ message, args, getLang, event }) {
		const action = String(args[0] || "").toLowerCase();

		if (action === "switch")
			return switchDatabase({ message, args, getLang, event });

		return message.reply(await buildStatus(getLang));
	}
};
