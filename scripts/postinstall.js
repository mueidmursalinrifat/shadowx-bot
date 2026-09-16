const path = require("path");
const { execFileSync } = require("child_process");

const NATIVE_MODULES = ["canvas", "sqlite3", "bcrypt"];
const ROOT = path.join(__dirname, "..");
const FORCE = process.argv.includes("--force");

function log(message) {
	console.log(`[native-fix] ${message}`);
}

function canLoad(moduleName) {
	try {
		require(moduleName);
		return true;
	}
	catch (err) {
		return false;
	}
}

function rebuild() {
	log(`Rebuilding: ${NATIVE_MODULES.join(", ")}`);
	try {
		execFileSync("npm", ["rebuild", ...NATIVE_MODULES, "--foreground-scripts"], {
			cwd: ROOT,
			stdio: "inherit",
			shell: process.platform === "win32",
			env: { ...process.env, npm_config_ignore_scripts: "false" }
		});
		log("Rebuild command finished.");
		return true;
	}
	catch (err) {
		log("Automatic rebuild failed.");
		log(`Run manually: npm rebuild ${NATIVE_MODULES.join(" ")} --foreground-scripts`);
		return false;
	}
}

function main() {
	log(`Node ${process.version}`);

	if (!FORCE) {
		const broken = NATIVE_MODULES.filter((name) => !canLoad(name));

		if (broken.length === 0) {
			log("canvas is working. No fix needed.");
			return;
		}

		log(`Problem detected: ${broken.join(", ")}`);
	}
	else {
		log("Force mode: rebuilding all native modules.");
	}

	if (!rebuild()) {
		process.exitCode = 1;
		return;
	}

	const stillBroken = NATIVE_MODULES.filter((name) => !canLoad(name));

	if (stillBroken.length === 0) {
		log("canvas is fixed and working.");
		return;
	}

	log(`Still broken: ${stillBroken.join(", ")}`);
	log("Install build tools, then retry: apt-get install -y python3 make g++");
	process.exitCode = 1;
}

main();
