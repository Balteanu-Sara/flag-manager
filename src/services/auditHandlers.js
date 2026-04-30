import { db } from "../config/createPool.js";
import { sendData, serverErr } from "../middlewares.js";

function parseParameters(url) {
  const params = new URL(url, "http://localhost").searchParams;
  let conditions = ``;
  const variables = [];

  try {
    if (params.get("flag_name")) {
      conditions += `flag_name LIKE ?`;
      variables.push(`%${params.get("flag_name")}%`);
    }
    if (params.get("user")) {
      console.log("vedem");
    }
    if (params.get("action")) {
      conditions += `${conditions.length > 0 ? " AND " : ""}action LIKE ?`;
      variables.push(`%${params.get("action")}%`);
    }
    if (params.get("changed_at")) {
      condtions += `${conditions.length > 0 ? " AND " : ""}changed_at LIKE ?`;
      variables.push(`%${params.get("changed_at")}%`);
    }
  } catch (err) {
    console.error("Error encountered when parsing parameters: ", err);
    return;
  } finally {
    return { conditions, variables };
  }
}

function createLog() {}

async function showLogs(req, res) {
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

async function filterLogs(req, res) {
  let isLogged = false;

  const { conditions, variables } = parseParameters(req.url);

  try {
    if (!isLogged) {
      const [rows] = await db.query(
        `
          SELECT flag_name, user_id, action, changed_at FROM audit_log WHERE ${conditions} ORDER BY changed_at DESC;
        `,
        variables,
      );

      return sendData(rows, res);
    }
  } catch (err) {
    serverErr(err);
  }
}

async function showUsersLogs(req, res) {}

export { createLog, showLogs, filterLogs, showUsersLogs };
