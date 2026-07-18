import pg from "pg";
import { get_maintenance_admin_config } from "../config/maintenance-database.config";
import { quote_database_identifier } from "./identifier";

const dbName = process.env.DB_NAME;

if (!dbName) {
    console.error("❌ DB_NAME is not set in environment variables");
    process.exit(1);
}

const database_name = dbName;

const client = new pg.Client(get_maintenance_admin_config());

async function run() {
    try {
        await client.connect();

        const result = await client.query(
            "SELECT 1 FROM pg_database WHERE datname = $1",
            [database_name]
        );

        if (result.rowCount && result.rowCount > 0) {
            console.log(`✅ Database "${database_name}" already exists`);
        } else {
            await client.query(`CREATE DATABASE ${quote_database_identifier(database_name)}`);
            console.log(`✅ Database "${database_name}" created successfully`);
        }
    } catch (error) {
        console.error("❌ Error creating database:", error);
        process.exit(1);
    } finally {
        await client.end();
    }
}

run();
