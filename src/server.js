require("dotenv").config();

const app = require("./app");
const pool = require("./config/db");
const redisClient = require("./config/redis");

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {

    await pool.query("SELECT NOW()");
    console.log("PostgreSQL connected succesfully");

    await redisClient.connect();
    console.log("Redis connected succesfully");

    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  } catch (err) {
    console.error("Server connection failed");
    console.error(err.message);
    process.exit(1);
  }
};


startServer();
