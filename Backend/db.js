require("dotenv").config();
// debug
// console.log("DB_USER:", process.env.DB_USER);
// console.log("DB_NAME:", process.env.DB_NAME);
// console.log("DB_PASSWORD exists:", !!process.env.DB_PASSWORD);
// console.log("DB_PASSWORD type:", typeof process.env.DB_PASSWORD);

const { Pool } = require("pg");

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT
});

module.exports = pool;  