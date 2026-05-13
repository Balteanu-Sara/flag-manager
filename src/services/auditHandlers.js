import { db } from "../config/createPool.js";
import { v4 as uuidv4 } from "uuid";
import { sendData, serverErr, isLogged, sendResponse } from "../middlewares.js";

function parseParameters(url) {
  const params = new URL(url, "http://localhost").searchParams;
  let conditions = ``;
  const variables = [];

  try {
    if (params.get("flag_name")) {
      conditions += `AND flag_name LIKE ?`;
      variables.push(`%${params.get("flag_name")}%`);
    }
    if (params.get("user")) {
      console.log("vedem");
    }
    if (params.get("action")) {
      conditions += `AND action LIKE ?`;
      variables.push(`%${params.get("action")}%`);
    }
    if (params.get("changed_at")) {
      condtions += `AND changed_at LIKE ?`;
      variables.push(`%${params.get("changed_at")}%`);
    }
  } catch (err) {
    console.error("Error encountered when parsing parameters: ", err);
    return;
  } finally {
    return { conditions, variables };
  }
}

async function createLog(user, feature, action, res) {
  try {
    await db.query(
      `
        INSERT INTO audit_log(id, flag_name, user_id, action) VALUES ('${uuidv4()}', ?, ?, ?);
      `,
      [feature, user.id, action],
    );

    console.log(`Log has been created with the '${feature}' feature flag.`);
  } catch (err) {
    return serverErr(err, res);
  }
}

async function showLogs(req, res) {
  const user = await isLogged(req);

  try {
    if (!user) {
      const [rows] = await db.query(`
                SELECT flag_name, user_id, action, changed_at FROM audit_log WHERE user_id = 'admin' ORDER BY changed_at DESC;
                `);
      return sendData(rows, res);
    }

    const [rows] = await db.query(
      `
        SELECT flag_name, action, changed_at FROM audit_log WHERE user_id = ?;
      `,
      [user.id],
    );

    return sendData(rows, res);
  } catch (err) {
    serverErr(err, res);
  }
}

async function filterLogs(req, res, forUsers = false) {
  const user = await isLogged(req);

  const { conditions, variables } = parseParameters(req.url);

  try {
    if (!user) {
      const [rows] = await db.query(
        `
          SELECT flag_name, user_id, action, changed_at FROM audit_log WHERE ${conditions} ORDER BY changed_at DESC;
        `,
        variables,
      );

      return sendData(rows, res);
    }

    if (forUsers) {
      if (!user.admin) return sendResponse("Unauthorized", 401, res);
      console.log("vedem");
    } else {
      variables.unshift(user.id);
      const [rows] = await db.query(
        `
        SELECT flag_name, action, changed_at FROM audit_log WHERE user_id = ? ${conditions} ORDER BY changed_at DESC;
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
