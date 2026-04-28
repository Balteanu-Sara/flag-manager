import mysql from "mysql2/promise";
import dotenv from "dotenv";
import { v4 as uuidv4 } from "uuid";

dotenv.config();

async function createDefaultFlags() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    multipleStatements: true,
  });

  try {
    await connection.query(`
            INSERT INTO flags (id, feature, user_id) VALUES ('${uuidv4()}', 'dark_mode', 'admin');
            INSERT INTO audit_log (id, flag_name, user_id, action) VALUES ('${uuidv4()}', 'dark_mode', 'admin', 'created');

            INSERT INTO flags (id, feature, user_id) VALUES ('875fa649-2fbc-4e2b-a04f-e7bc4e783a59', 'new_dashboard', 'admin');
            INSERT INTO audit_log (id, flag_name, user_id, action) VALUES ('${uuidv4()}', 'new_dashboard', 'admin', 'created');

            INSERT INTO flags (id, feature, user_id) VALUES ('a9898b30-ec08-417b-b101-ef295fd8113f', 'sidebar_navigation','admin');
            INSERT INTO audit_log (id, flag_name, user_id, action) VALUES ('${uuidv4()}', 'sidebar_navigation', 'admin', 'created');

            INSERT INTO flags (id, feature, user_id) VALUES ('${uuidv4()}', 'new_checkout_flow','admin');
            INSERT INTO audit_log (id, flag_name, user_id, action) VALUES ('${uuidv4()}', 'new_checkout_flow','admin', 'created');

            INSERT INTO flags (id, feature, user_id) VALUES ('${uuidv4()}', 'applepay_integration','admin');
            INSERT INTO audit_log (id, flag_name, user_id, action) VALUES ('${uuidv4()}', 'applepay_integration', 'admin', 'created');

            INSERT INTO flags (id, feature, user_id) VALUES ('3e162130-2801-48ef-a41f-aa66a29c675f', 'ai_recommandations','admin');
            INSERT INTO audit_log (id, flag_name, user_id, action) VALUES ('${uuidv4()}', 'ai_recommandations', 'admin', 'created');

            INSERT INTO flags (id, feature, user_id) VALUES ('${uuidv4()}', 'language_switcher','admin');
            INSERT INTO audit_log (id, flag_name, user_id, action) VALUES ('${uuidv4()}', 'language_switcher','admin', 'created');

            INSERT INTO flags (id, feature, user_id) VALUES ('9e81533c-96b0-4cd7-8e6b-c2aaed9b4571', 'image_search','admin');
            INSERT INTO audit_log (id, flag_name, user_id, action) VALUES ('${uuidv4()}', 'image_search', 'admin', 'created');

            INSERT INTO flags (id, feature, user_id) VALUES ('1eecaf4d-ee14-4d7b-ba09-fa8d8098d3c2', 'export_to_csv','admin');
            INSERT INTO audit_log (id, flag_name, user_id, action) VALUES ('${uuidv4()}', 'export_to_csv', 'admin', 'created');

            INSERT INTO flags (id, feature, user_id) VALUES ('${uuidv4()}', 'cache_enabled','admin');
            INSERT INTO audit_log (id, flag_name, user_id, action) VALUES ('${uuidv4()}', 'cache_enabled','admin', 'created');

            INSERT INTO flags (id, feature, user_id) VALUES ('${uuidv4()}', 'lazy_loading','admin');
            INSERT INTO audit_log (id, flag_name, user_id, action) VALUES ('${uuidv4()}', 'lazy_loading','admin', 'created');

            INSERT INTO flags (id, feature, user_id) VALUES ('${uuidv4()}', 'maintenance_mode','admin');
            INSERT INTO audit_log (id, flag_name, user_id, action) VALUES ('${uuidv4()}', 'maintenance_mode','admin', 'created');

            INSERT INTO flags (id, feature, user_id) VALUES ('edfa5509-5283-4532-a5bf-d291ce9dbe21', 'read_only_mode','admin');
            INSERT INTO audit_log (id, flag_name, user_id, action) VALUES ('${uuidv4()}', 'read_only_mode','admin', 'created');
            `);

    await connection.query(`
            UPDATE flags SET enabled=true, environment='production' WHERE id='875fa649-2fbc-4e2b-a04f-e7bc4e783a59';
            INSERT INTO audit_log (id, flag_name, user_id, action) VALUES ('${uuidv4()}', 'new_dashboard', 'admin', 'toggled_on');

            UPDATE flags SET environment='staging' WHERE id='a9898b30-ec08-417b-b101-ef295fd8113f';

            UPDATE flags SET enabled=true, environment='staging' WHERE id='3e162130-2801-48ef-a41f-aa66a29c675f';
            INSERT INTO audit_log (id, flag_name, user_id, action) VALUES ('${uuidv4()}', 'ai_recommandations', 'admin', 'toggled_on');

            UPDATE flags SET environment='staging' WHERE id='9e81533c-96b0-4cd7-8e6b-c2aaed9b4571';

            UPDATE flags SET enabled=true, environment='production' WHERE id='1eecaf4d-ee14-4d7b-ba09-fa8d8098d3c2';
            INSERT INTO audit_log (id, flag_name, user_id, action) VALUES ('${uuidv4()}', 'export_to_csv', 'admin', 'toggled_on');

            UPDATE flags  SET enabled=true, environment='staging' WHERE id='edfa5509-5283-4532-a5bf-d291ce9dbe21';
            INSERT INTO audit_log (id, flag_name, user_id, action) VALUES ('${uuidv4()}', 'read_only_mode', 'admin', 'toggled_on');
            `);
  } catch (err) {
    console.error("Error encountered at data migration: ", err);
  } finally {
    console.log("\nSuccesfully integrated data into tables!");
    await connection.end();
  }
}

createDefaultFlags();
