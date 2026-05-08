import mysql from "mysql2/promise";
import dotenv from "dotenv";

dotenv.config();

async function migrateSchema() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
  });

  try {
    await connection.query(
      `CREATE DATABASE IF NOT EXISTS \`${process.env.DB_NAME}\`;`,
    );
    await connection.query(`USE \`${process.env.DB_NAME}\`;`);

    await connection.query(`
                CREATE TABLE IF NOT EXISTS users(
                    id VARCHAR(36) PRIMARY KEY,
                    name VARCHAR(50) NOT NULL,
                    admin BOOL NOT NULL DEFAULT 0,
                    email VARCHAR(100) NOT NULL UNIQUE,
                    password VARCHAR(255) NOT NULL,
                    created_at DATETIME DEFAULT current_timestamp
                );
            `);

    await connection.query(`
                CREATE TABLE IF NOT EXISTS flags(
                    id VARCHAR(36) PRIMARY KEY,
                    feature VARCHAR(100) NOT NULL,
                    user_id VARCHAR(36),
                    environment VARCHAR(20) NOT NULL DEFAULT 'development',
                    enabled BOOL not null DEFAULT false,
                    created_at DATETIME DEFAULT current_timestamp,
                    updated_at DATETIME DEFAULT current_timestamp ON UPDATE current_timestamp,
                    UNIQUE(user_id, feature)
                );
            `);

    await connection.query(`
                CREATE TABLE IF NOT EXISTS audit_log(
                    id VARCHAR(36) PRIMARY KEY,
                    flag_name VARCHAR(100) NOT NULL,
                    user_id VARCHAR(36),
                    action VARCHAR(50) NOT NULL,
                    changed_at DATETIME DEFAULT current_timestamp
                );
            `);
  } catch (err) {
    console.error("Error encountered at schema migration: ", err);
  } finally {
    console.log("\nSuccessfully created database and tables!");
    await connection.end();
  }
}

migrateSchema();
