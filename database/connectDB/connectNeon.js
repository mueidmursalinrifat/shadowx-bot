module.exports = async function () {
	const net = require("net");
	// Some hosts (including several Neon endpoints) advertise unreachable IPv6
	// records. Node's Happy-Eyeballs (autoSelectFamily) can stall on them and
	// surface as an empty ETIMEDOUT, so force classic IPv4-first behaviour.
	if (typeof net.setDefaultAutoSelectFamily === "function")
		net.setDefaultAutoSelectFamily(false);

	const { Sequelize } = require("sequelize");
	const { config } = global.GoatBot;

	const uriConnect = process.env.NEON_DATABASE_URL
		|| process.env.DATABASE_URL
		|| config.database.uriNeon;

	if (!uriConnect || typeof uriConnect !== "string" || !uriConnect.trim())
		throw new Error("Missing Neon connection string. Set database.uriNeon in config.json or the NEON_DATABASE_URL environment variable.");

	const sequelize = new Sequelize(uriConnect, {
		dialect: "postgres",
		logging: false,
		dialectOptions: {
			ssl: true
		},
		pool: {
			max: 5,
			min: 0,
			acquire: 60000,
			idle: 10000
		},
		retry: {
			max: 3
		}
	});

	const threadModel = require("../models/sqlite/thread.js")(sequelize);
	const userModel = require("../models/sqlite/user.js")(sequelize);
	const dashBoardModel = require("../models/sqlite/userDashBoard.js")(sequelize);
	const globalModel = require("../models/sqlite/global.js")(sequelize);

	await sequelize.authenticate();
	await sequelize.sync({ force: false });

	return {
		threadModel,
		userModel,
		dashBoardModel,
		globalModel,
		sequelize
	};
};
