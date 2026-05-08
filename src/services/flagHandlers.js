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
} from "../middlewares.js";
import { createLog } from "./auditHandlers.js";

function parseParameters(url) {
  const params = new URL(url, "http://localhost").searchParams;
  let conditions = ``;
  const variables = [];

  try {
    if (params.get("feature")) {
      conditions += `feature LIKE ?`;
      variables.push(`%${params.get("feature")}%`);
    }
    if (params.get("environment")) {
      conditions += `${conditions.length > 0 ? " AND " : ""}environment LIKE ?`;
      variables.push(params.get("environment"));
    }
    if (params.get("enabled")) {
      conditions += `${conditions.length > 0 ? " AND " : ""}enabled = ?`;
      variables.push(params.get("enabled"));
    }
    if (params.get("created_at")) {
      conditions += `${conditions.length > 0 ? " AND " : ""}created_at LIKE ?`;
      variables.push(`%${params.get("created_at")}%`);
    }
    if (params.get("updated_at")) {
      conditions += `${conditions.length > 0 ? " AND " : ""}updated_at LIKE ?`;
      variables.push(`%${params.get("updated_at")}%`);
    }
  } catch (err) {
    console.error("Error encountered when parsing parameters: ", err);
    return;
  } finally {
    return { conditions, variables };
  }
}

async function showFlags(req, res) {
  const user = isLogged(req);

  try {
    if (!user) {
      const [rows] = await db.query(`
                SELECT feature, user_id, environment, enabled, created_at, updated_at FROM flags WHERE user_id = 'admin'; 
                    `);

      return sendData(rows, res);
    }

    const [rows] = await db.query(
      `
        SELECT feature, environment, enabled, created_at, updated_at FROM flags where user_id = ?;
      `,
      [user.id],
    );

    return sendData(rows, res);
  } catch (err) {
    return serverErr(err, res);
  }
}

async function filterFlags(req, res) {
  const user = isLogged(req);

  const { conditions, variables } = parseParameters(req.url);

  try {
    if (!user) {
      const [rows] = await db.query(
        `
        SELECT feature, user_id, environment, enabled, created_at, updated_at FROM flags WHERE ${conditions} ORDER BY created_at DESC; 
        `,
        variables,
      );

      return sendData(rows, res);
    }

    variables.push(user.id);
    const [rows] = await db.query(
      `
      SELECT feature, environment, enabled, created_at, updated_at FROM flags WHERE ${conditions} AND user_id = ? ORDER BY created_at DESC;
      `,
      variables,
    );

    return sendData(rows, res);
  } catch (err) {
    serverErr(err, res);
  }
}

async function createFlag(req, res) {
  const user = authenticate(req, res);

  if (!user) return;

  try {
    const body = await parseBody(req);
    if (!body.hasOwnProperty("feature"))
      return sendResponse("Feature key is required!", 400, res);
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

    await createLog(user, body.feature, res);

    return sendResponse(
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
  const user = isLogged(req);

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

    const [rows] = await db.query(
      `
        SELECT feature, environment, enabled, created_at, updated_at from flags WHERE feature LIKE ? AND user_id = ?; 
      `,
      [`%${name}%`, `${user.id}`],
    );

    return sendData(rows, res);
  } catch (err) {
    serverErr(err, res);
  }
}

async function changeMetadata(req, res, name) {}

async function deleteFlag(req, res, name) {}

async function toggleFlag(req, res, name) {}

export {
  showFlag,
  filterFlags,
  createFlag,
  showFlags,
  changeMetadata,
  deleteFlag,
  toggleFlag,
};
