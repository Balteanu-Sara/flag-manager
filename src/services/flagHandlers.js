import { db } from "../config/createPool.js";
import { v4 as uuidv4 } from "uuid";
import {
  authenticate,
  isLogged,
  notFoundErr,
  sendData,
  serverErr,
  parseBody,
  sendResponse,
  badRequestErr,
} from "../middlewares.js";
import { createLog } from "./auditHandlers.js";

function parseParameters(url, forUsers = false) {
  const params = new URL(url, "http://localhost").searchParams;
  let conditions = ``;
  const variables = [];

  try {
    if (params.get("feature")) {
      conditions += `feature LIKE ?`;
      variables.push(`%${params.get("feature").trim()}%`);
    }
    if (params.get("user") && forUsers) {
      userParam = params.get("user").trim();
    }
    if (params.get("environment")) {
      conditions += `${conditions.length > 0 ? " AND " : ""}environment LIKE ?`;
      variables.push(`%${params.get("environment").trim()}%`);
    }
    if (params.has("enabled")) {
      conditions += `${conditions.length > 0 ? " AND " : ""}enabled = ?`;
      if (
        params.get("enabled").trim() === "true" ||
        params.get("enabled").trim() === "1"
      )
        variables.push(1);
      else if (
        params.get("enabled").trim() === "false" ||
        params.get("enabled").trim() === "0"
      )
        variables.push(0);
      else variables.push(params.get("enabled"));
    }
    if (params.get("created_at")) {
      conditions += `${conditions.length > 0 ? " AND " : ""}created_at LIKE ?`;
      variables.push(`%${params.get("created_at").trim()}%`);
    }
    if (params.get("updated_at")) {
      conditions += `${conditions.length > 0 ? " AND " : ""}updated_at LIKE ?`;
      variables.push(`%${params.get("updated_at").trim()}%`);
    }
  } catch (err) {
    console.error("Error encountered when parsing parameters: ", err);
    return;
  } finally {
    return { conditions, variables };
  }
}

async function showFlags(req, res) {
  const user = await isLogged(req);

  try {
    if (!user) {
      const [rows] = await db.query(`
                SELECT feature, user_id, environment, enabled, created_at, updated_at FROM flags WHERE user_id = 'admin' ORDER BY created_at DESC LIMIT 50; 
                    `);
      const [[{ total_flags }]] = await db.query(`
            SELECT COUNT(*) as total_flags FROM flags WHERE user_id = 'admin';
        `);

      return sendData({ total: total_flags, data: rows }, res);
    }

    if (user.admin) {
      const [rows] = await db.query(
        `
          SELECT feature, user_id, environment, enabled, created_at, updated_at FROM flags ORDER BY created_at DESC LIMIT 50;
        `,
      );
      const [[{ total_flags }]] = await db.query(`
          SELECT COUNT(*) as total_flags FROM flags;
        `);

      return sendData({ total: total_flags, data: rows }, res);
    }

    const [rows] = await db.query(
      `
        SELECT feature, environment, enabled, created_at, updated_at FROM flags where user_id = ? ORDER BY created_at DESC LIMIT 50;
      `,
      [user.id],
    );
    const [[{ total_flags }]] = await db.query(
      `
          SELECT COUNT(*) as total_flags FROM flags where user_id = ?;
        `,
      [user.id],
    );

    sendData({ total: total_flags, data: rows }, res);
  } catch (err) {
    serverErr(err, res);
  }
}

async function filterFlags(req, res) {
  const user = await isLogged(req);

  try {
    if (!user) {
      let { conditions, variables } = parseParameters(req.url);
      if (conditions.length > 0) conditions = conditions + " AND";
      const [rows] = await db.query(
        `
        SELECT feature, user_id, environment, enabled, created_at, updated_at FROM flags WHERE ${conditions} user_id='admin' ORDER BY created_at DESC LIMIT 75; 
        `,
        variables,
      );
      const [[{ total_flags }]] = await db.query(
        `
          SELECT COUNT(*) as total_flags FROM flags WHERE ${conditions} user_id='admin';
        `,
        variables,
      );

      return sendData({ total: total_flags, data: rows }, res);
    }

    if (user.admin) {
      let { conditions, variables } = parseParameters(req.url, true);
      if (conditions.length) conditions = "WHERE " + conditions;
      const [rows] = await db.query(
        `
        SELECT feature, user_id, environment, enabled, created_at, updated_at FROM flags ${conditions} ORDER BY updated_at DESC LIMIT 75; 
        `,
        variables,
      );
      const [[{ total_flags }]] = await db.query(
        `
          SELECT COUNT(*) as total_flags FROM flags ${conditions};
        `,
        variables,
      );

      return sendData({ total: total_flags, data: rows }, res);
    }

    let { conditions, variables } = parseParameters(req.url);
    variables.unshift(user.id);
    if (conditions.length > 0) conditions = "AND " + conditions;
    const [rows] = await db.query(
      `
      SELECT feature, environment, enabled, created_at, updated_at FROM flags WHERE user_id = ? ${conditions} ORDER BY updated_at DESC LIMIT 75;
      `,
      variables,
    );
    const [[{ total_flags }]] = await db.query(
      `
          SELECT COUNT(*) as total_flags FROM flags WHERE user_id = ? ${conditions};
        `,
      variables,
    );

    sendData({ total: total_flags, data: rows }, res);
  } catch (err) {
    serverErr(err, res);
  }
}

async function createFlag(req, res) {
  const user = await authenticate(req, res);

  if (!user) return;

  try {
    const body = await parseBody(req);
    if (!body) return sendResponse("Invalid JSON body", 400, res);
    if (!body.hasOwnProperty("feature"))
      return sendResponse("Feature key is required!", 404, res);
    const variables = [body.feature, user.id];
    let columns = "";
    if (body.hasOwnProperty("environment")) {
      if (
        body.environment !== "development" &&
        body.environment !== "staging" &&
        body.environment !== "production"
      )
        return sendResponse(
          "Environment must be development, staging or production.",
          400,
          res,
        );
      variables.push(body.environment);
      columns = columns + ", environment";
    }
    if (body.hasOwnProperty("enabled")) {
      if (body.enabled !== true && body.enabled !== false)
        return sendResponse("Enabled must be true or false.", 400, res);
      variables.push(body.enabled);
      columns = columns + ", enabled";
    }
    const parameters = new Array(Object.keys(body).length + 1)
      .fill(", ?")
      .join("");

    await db.query(
      `
          INSERT INTO flags (id, feature, user_id${columns} ) VALUES ('${uuidv4()}'${parameters});
          `,
      variables,
    );

    await createLog(user, body.feature, "created", res);

    sendResponse(
      "Flag has been created! Check it by accessing /flags/:name",
      201,
      res,
    );
  } catch (err) {
    if (err.sqlMessage && err.sqlMessage.startsWith("Duplicate entry '"))
      sendResponse("This flag already exists.", 400, res);
    else serverErr(err, res);
  }
}

async function showFlag(req, res, name) {
  const user = await isLogged(req);

  try {
    if (!user) {
      const [rows] = await db.query(
        `
          SELECT feature, user_id, environment, enabled, created_at, updated_at FROM flags WHERE feature LIKE ?;
          `,
        [`%${name}%`],
      );

      return sendData(rows, res);
    }

    if (user.admin) {
      const [rows] = await db.query(
        `
          SELECT feature, user_id, environment, enabled, created_at, updated_at from flags WHERE feature LIKE ?; 
        `,
        [`%${name}%`],
      );

      return sendData(rows, res);
    }

    const [rows] = await db.query(
      `
        SELECT feature, environment, enabled, created_at, updated_at from flags WHERE feature LIKE ? AND user_id = ?; 
      `,
      [`%${name}%`, `${user.id}`],
    );

    sendData(rows, res);
  } catch (err) {
    serverErr(err, res);
  }
}

async function changeMetadata(req, res, name) {
  const user = await authenticate(req, res);
  const body = await parseBody(req);

  if (!user) return;
  if (!body) return sendResponse("Invalid JSON body", 400, res);

  try {
    const [rows] = await db.query(
      `SELECT * FROM flags WHERE feature = ? AND user_id = ? ;`,
      [name, user.id],
    );

    if (!rows.length) return notFoundErr(res);
    if (
      !body.hasOwnProperty("feature") &&
      !body.hasOwnProperty("environment") &&
      !body.hasOwnProperty("enabled")
    )
      return sendResponse("No valid column provided for update.", 400, res);
    let columns = ``;
    const variables = [];
    let action = `updated`;
    if (body.hasOwnProperty("feature")) {
      const [rows] = await db.query(
        `SELECT * FROM flags WHERE feature = ? AND user_id = ? ;`,
        [body.feature, user.id],
      );

      if (rows.length > 0)
        return sendResponse(
          "Flag with provided name already exists!",
          400,
          res,
        );
      action += ` (${name})`;
      columns += "feature = ?";
      variables.push(body.feature);
    }

    if (body.hasOwnProperty("environment")) {
      if (
        body.environment !== "development" &&
        body.environment !== "staging" &&
        body.environment !== "production"
      )
        return sendResponse(
          "Valid values for environment are development, staging or production.",
          400,
          res,
        );

      columns += columns.length ? ", environment = ?" : "environment = ?";
      variables.push(body.environment);
    }

    if (body.hasOwnProperty("enabled")) {
      if (body.enabled !== false && body.enabled !== true)
        return sendResponse(
          "Valid values for enabled are true or false.",
          400,
          res,
        );

      if (
        !body.hasOwnProperty("feature") &&
        !body.hasOwnProperty("environment")
      )
        if (body.enabled) action = "toggled_on";
        else action = "toggled_off";
      columns += columns.length ? ", enabled = ?" : "enabled = ?";
      variables.push(body.enabled);
    }
    variables.push(user.id);
    variables.push(name);

    await db.query(
      `
      UPDATE flags SET ${columns} WHERE user_id = ? AND feature = ?;
      `,
      variables,
    );

    if (body.hasOwnProperty("feature")) name = body.feature;
    await createLog(user, name, action, res);

    sendResponse("Flag has been updated! Check /flags/:name", 200, res);
  } catch (err) {
    if (err.sqlMessage && err.sqlMessage.startsWith("Duplicate entry '"))
      sendResponse("This flag already exists.", 400, res);
    else serverErr(err, res);
  }
}

async function deleteFlag(req, res, name) {
  const user = await authenticate(req, res);
  if (!user) return;

  try {
    if (user.admin) {
      const body = await parseBody(req);
      if (!body) return sendResponse("Invalid JSON body", 400, res);

      if (!body.get("user_info")) return badRequestErr(res);

      const variables = [];
      variables.push(name);
      variables.push(body.get("user_info").trim());
      variables.push(`%${body.get("user_info").trim().toLowerCase()}%`);

      const [rows] = await db.query(
        `SELECT * FROM flags join users on flags.user_id=users.id WHERE feature = ? AND (user_id = ? OR email LIKE ?) ;`,
        variables,
      );

      if (!rows.length) return notFoundErr(res);

      await db.query(`DELETE FROM flags WHERE feature = ? ;`, [name]);

      return sendResponse(`Flag ${name} has been removed!`, 200, res);
    }
    const [rows] = await db.query(
      `SELECT * FROM flags WHERE feature = ? AND user_id = ? ;`,
      [name, user.id],
    );

    if (!rows.length) return notFoundErr(res);

    await db.query(`DELETE FROM flags WHERE user_id = ? AND feature = ? ;`, [
      user.id,
      name,
    ]);
    await createLog(user, name, "deleted", res);

    sendResponse(`Flag ${name} has been removed!`, 200, res);
  } catch (err) {
    serverErr(err, res);
  }
}

async function toggleFlag(req, res, name) {
  const user = await authenticate(req, res);

  if (!user) return;

  try {
    const [rows] = await db.query(
      `SELECT * FROM flags WHERE feature = ? AND user_id = ?;`,
      [name, user.id],
    );

    if (!rows.length) return notFoundErr(res);

    const action = rows[0].enabled ? "toggled_off" : "toggled_on";

    await db.query(
      `
        UPDATE flags SET enabled = NOT enabled WHERE user_id = ? AND feature = ?
      `,
      [user.id, name],
    );

    await createLog(user, name, action, res);
    sendResponse(
      "Flag has been toggled! Check it by accessing /flags/:name",
      200,
      res,
    );
  } catch (err) {
    serverErr(err, res);
  }
}

export {
  showFlag,
  filterFlags,
  createFlag,
  showFlags,
  changeMetadata,
  deleteFlag,
  toggleFlag,
};
