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

let botProcess = null;
let botStats = { totalThread: 0, totalUser: 0 };

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

function readPackage(p) {
	try {
		return require(p);
	}
	catch (e) {
		return { name: "unknown", version: "unknown" };
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
		bot: "SHADOWX-BOT",
		uptime: Math.floor(process.uptime()),
		timestamp: new Date().toISOString()
	});
});

// Public stats API - live data reported by the bot process over IPC
app.get("/stats", (req, res) => {
	const fcaPkg = readPackage(path.join(__dirname, "node_modules", "shadowx-fca", "package.json"));
	res.json({
		fcaName: fcaPkg.name || "shadowx-fca",
		fcaVersion: fcaPkg.version || "unknown",
		botVersion: readPackage(path.join(__dirname, "package.json")).version || "unknown",
		totalThread: botStats.totalThread,
		totalUser: botStats.totalUser,
		uptimeSecond: process.uptime(),
		commandsCount: countScripts(path.join(__dirname, "scripts", "cmds"), configCommands.commandUnload),
		eventsCount: countScripts(path.join(__dirname, "scripts", "events"), configCommands.commandEventUnload),
		isConnected: !!botProcess,
		botID: null,
		prefix: config.prefix || ".",
		language: config.language || "en",
		nameBot: "SHADOWX-BOT",
		dbType: resolveDbType(),
		nodeVersion: process.version
	});
});

// Home route - serve SHADOWX public dashboard
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
		stdio: ["inherit", "inherit", "inherit", "ipc"]
	});

	botProcess = child;

	child.on("message", (msg) => {
		if (msg && msg.type === "shadowx:stats") {
			botStats = {
				totalThread: msg.totalThread || 0,
				totalUser: msg.totalUser || 0
			};
		}
	});

	child.on("close", (code) => {
		botProcess = null;
		if (code == 2) {
			log.info("Restarting Project...");
			startProject();
		}
	});
}

startProject();
