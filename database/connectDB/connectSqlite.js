module.exports = async function () {
	const { Sequelize } = require("sequelize");
	const path = __dirname + "/../data/data.sqlite";
	const fs = require("fs");
	
	// Ensure data directory exists
	const dataDir = path.substring(0, path.lastIndexOf('/'));
	if (!fs.existsSync(dataDir)) {
		fs.mkdirSync(dataDir, { recursive: true });
	}
	
	const sequelize = new Sequelize({
		dialect: "sqlite",
		storage: path,
		logging: false,
		pool: {
			max: 5,
			min: 0,
			acquire: 30000,
			idle: 10000
		}
	});

	const threadModel = require("../models/sqlite/thread.js")(sequelize);
	const userModel = require("../models/sqlite/user.js")(sequelize);
	const dashBoardModel = require("../models/sqlite/userDashBoard.js")(sequelize);
	const globalModel = require("../models/sqlite/global.js")(sequelize);

	await sequelize.sync({ force: false });

	return {
		threadModel,
		userModel,
		dashBoardModel,
		globalModel,
		sequelize
	};
};