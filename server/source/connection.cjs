const { Pool } = require("pg");

// const dotenv = require("dotenv");
// dotenv.config();
let pool;


if (process.env.NODE_ENV === "production") {
  pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
      rejectUnauthorized: false,
    }
  });
}
else {
  pool = new Pool({
    user: "Khizar",
    host: "localhost",
    database: "VoxaLink",
    password: "123",
    port: 5432,
  });
}

module.exports = pool;
