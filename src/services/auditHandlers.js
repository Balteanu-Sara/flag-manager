import { db } from "../config/createPool.js";
import { sendData, serverErr } from "../middlewares.js";

function createLog() {}

async function showLogs(req, res) {
  console.log("in showLogs");
  let isLogged = false;

  try {
    if (!isLogged) {
      const [rows] = await db.query(`
                SELECT flag_name, user_id, action, changed_at FROM audit_log WHERE user_id = 'admin';
                `);
      return sendData(rows, res);
    }
  } catch (err) {
    console.error("Error encountered showing logs: ", err);
    return serverErr(err, res);
  }
}

async function filterLogs(req, res, params) {
  let isLogged = false;

  try {
    if (!isLogged) {
    }
  } catch (err) {
    serverErr(err);
  }
}

async function showUsersLogs(req, res) {}

export { createLog, showLogs, filterLogs, showUsersLogs };
