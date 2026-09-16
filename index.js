/**
 * @author NTKhang
 * ! The source code is written by NTKhang, please don't change the author's name everywhere. Thank you for using
 * ! Official source code: https://github.com/ntkhang03/Goat-Bot-V2
 * ! If you do not download the source code from the above address, you are using an unknown version and at risk of having your account hacked
 */

const { spawn } = require("child_process");
const path = require("path");
const fs = require("fs");
const log = require("./logger/log.js");
const express = require("express");
const app = express();
const config = require("./config.json");
const configCommands = require("./configCommands.json");

const PORT = process.env.PORT || 4000;
const dirDashboard = path.join(__dirname, "dashboard");
const dirAccount = path.join(__dirname, "account.txt");

let botProcess = null;
let restartRequested = false;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use("/images", express.static(path.join(dirDashboard, "images")));

// Mirrors bot/login/loadScripts.js: top-level .js files only, skipping
// example (eg.js), dev-only and explicitly unloaded scripts.
function countScripts(dir, unloadList) {
	if (!fs.existsSync(dir))
		return 0;
	const blocked = unloadList || [];
	return fs.readdirSync(dir).filter(file =>
		file.endsWith(".js") &&
		!file.endsWith("eg.js") &&
		(process.env.NODE_ENV == "development" ? true : !file.match(/(dev)\.js$/g)) &&
		!blocked.includes(file)
	).length;
}

function readVersion(p) {
	try {
		return require(p).version || "unknown";
	}
	catch (e) {
		return "unknown";
	}
}

function resolveDbType() {
	const db = config.database || {};
	const type = (db.type || "").toLowerCase();
	if (type === "neon")
		return "Neon";
	if (type === "mongodb")
		return "MongoDB";
	if (type === "json")
		return "JSON";
	if (type === "sqlite")
		return "SQLite";
	const uri = process.env.MONGODB_URI || process.env.MONGO_URL || db.uriMongodb || "";
	return uri ? "MongoDB" : "SQLite";
}

// Health check — required for Render, Railway, Koyeb, VPS uptime monitors
app.get(["/health", "/ping", "/alive"], (req, res) => {
	res.status(200).json({
		status: "ok",
		bot: config.nameBot || "SHADOWX-BOT",
		uptime: Math.floor(process.uptime()),
		timestamp: new Date().toISOString()
	});
});

// Stats API - JSON data
app.get("/stats", (req, res) => {
	res.json({
		fcaVersion: readVersion(path.join(__dirname, "node_modules", "shadowx-fca", "package.json")),
		botVersion: readVersion(path.join(__dirname, "package.json")),
		totalThread: 0,
		totalUser: 0,
		uptimeSecond: process.uptime(),
		commandsCount: countScripts(path.join(__dirname, "scripts", "cmds"), configCommands.commandUnload),
		eventsCount: countScripts(path.join(__dirname, "scripts", "events"), configCommands.commandEventUnload),
		isConnected: !!botProcess,
		botID: null,
		prefix: config.prefix || ".",
		language: config.language || "en",
		nameBot: config.nameBot || "SHADOWX-BOT",
		dbType: resolveDbType(),
		nodeVersion: process.version
	});
});

// Public setup-session endpoint — protected by adminKey from config
app.post("/api/setup-session", (req, res) => {
	const { fbstate, adminKey } = req.body || {};
	const configKey = config.dashBoard?.adminKey;

	if (!adminKey || adminKey !== configKey)
		return res.json({ status: "error", message: "Wrong admin key. Check config.json → dashBoard.adminKey" });

	if (!fbstate || !fbstate.trim())
		return res.json({ status: "error", message: "fbstate cannot be empty" });

	try {
		fs.writeFileSync(dirAccount, fbstate.trim());
		res.json({ status: "success", message: "Session saved! Bot is restarting now..." });
		res.on("finish", () => setTimeout(() => {
			if (botProcess) {
				restartRequested = true;
				botProcess.kill("SIGTERM");
			}
			else
				startProject();
		}, 500));
	}
	catch (err) {
		res.json({ status: "error", message: "Failed to write session: " + err.message });
	}
});

// Home route - serve SHADOWX dashboard
app.get(["/", "/home", "/dashboard"], (req, res) => {
	res.sendFile(path.join(dirDashboard, "shadowx.html"));
});

// Render MUST detect a running web server
app.listen(PORT, () => {
	console.log(`[SHADOWX] Web dashboard running on port: ${PORT}`);
});

function startProject() {
	const child = spawn("node", ["Goat.js"], {
		cwd: __dirname,
		stdio: "inherit",
		shell: true
	});

	botProcess = child;

	child.on("close", (code) => {
		botProcess = null;
		if (code == 2 || restartRequested) {
			restartRequested = false;
			log.info("Restarting Project...");
			startProject();
		}
	});
}

startProject();
