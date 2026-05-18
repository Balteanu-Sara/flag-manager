import { db } from "../config/createPool.js";
import { v4 as uuidv4 } from "uuid";
import {
  sendData,
  serverErr,
  isLogged,
  sendResponse,
  authenticate,
} from "../middlewares.js";

function parseParameters(url, forUsers) {
  const params = new URL(url, "http://localhost").searchParams;
  let conditions = ``;
  const variables = [];
  let userParam;

  try {
    if (params.get("flag_name")) {
      conditions += `flag_name LIKE ?`;
      variables.push(`%${params.get("flag_name").trim()}%`);
    }
    if (params.get("user") && forUsers) {
      userParam = params.get("user").trim();
    }
    if (params.get("action")) {
      conditions += `${conditions.length > 0 ? " AND " : ""}action LIKE ?`;
      variables.push(`%${params.get("action").trim()}%`);
    }
    if (params.get("changed_at")) {
      conditions += `${conditions.length > 0 ? " AND " : ""}changed_at LIKE ?`;
      variables.push(`%${params.get("changed_at").trim()}%`);
    }

    return { conditions, variables, userParam };
  } catch (err) {
    console.error("Error encountered when parsing parameters: ", err);
    return;
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

  let { conditions, variables, userParam } = parseParameters(req.url, forUsers);

  try {
    if (!user) {
      if (conditions.length > 0) conditions = "WHERE " + conditions;
      const [rows] = await db.query(
        `
          SELECT flag_name, user_id, action, changed_at FROM audit_log ${conditions} ORDER BY changed_at DESC;
        `,
        variables,
      );

      return sendData(rows, res);
    }

    if (forUsers) {
      if (!user.admin) return sendResponse("Unauthorized", 401, res);

      //no user parameter
      if (!userParam) {
        if (conditions.length > 0) conditions += " AND ";

        const [rows] = await db.query(
          `
          SELECT flag_name, email, action, changed_at FROM audit_log JOIN users ON audit_log.user_id = users.id WHERE ${conditions} user_id <> 'admin' ORDER BY changed_at DESC;
        `,
          variables,
        );
        return sendData(rows, res);
      }

      //with user parameter
      conditions += `${conditions.length ? " AND " : ""} (email LIKE ? OR name LIKE ?)`;
      variables.push(`%${userParam}%`);
      variables.push(`%${userParam}%`);
      const [rows] = await db.query(
        `
          SELECT flag_name, email, action, changed_at FROM audit_log JOIN users ON audit_log.user_id = users.id WHERE ${conditions} ORDER BY changed_at DESC;
      `,
        variables,
      );

      return sendData(rows, res);
    }

    variables.push(user.id);
    if (conditions.length > 0) conditions += " AND ";
    const [rows] = await db.query(
      `
      SELECT flag_name, action, changed_at FROM audit_log WHERE ${conditions} user_id = ? ORDER BY changed_at DESC;
      `,
      variables,
    );

    return sendData(rows, res);
  } catch (err) {
    serverErr(err, res);
  }
}

async function showUsersLogs(req, res) {
  const user = await authenticate(req, res);
  if (!user) return;

  if (user.admin !== 1) return sendResponse("Unauthorized", 401, res);

  try {
    const [rows] = await db.query(`
        SELECT flag_name, email, action, changed_at FROM audit_log JOIN users ON audit_log.user_id = users.id WHERE user_id <> 'admin' ORDER BY changed_at DESC;
      `);

    sendData(rows, res);
  } catch (err) {
    serverErr(err, res);
  }
}

export { createLog, showLogs, filterLogs, showUsersLogs };
