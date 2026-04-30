import { db } from "../config/createPool.js";
import { sendData, serverErr } from "../middlewares.js";

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
  let isLogged = false;

  try {
    if (!isLogged) {
      const [rows] = await db.query(`
                SELECT feature, user_id, environment, enabled, created_at, updated_at FROM flags WHERE user_id = 'admin'; 
                    `);

      return sendData(rows, res);
    }
  } catch (err) {
    return serverErr(err, res);
  }
}

async function filterFlags(req, res) {
  let isLogged = false;

  const { conditions, variables } = parseParameters(req.url);

  try {
    if (!isLogged) {
      const [rows] = await db.query(
        `
        SELECT feature, user_id, environment, enabled, created_at, updated_at FROM flags WHERE ${conditions} ORDER BY created_at DESC 
        `,
        variables,
      );

      return sendData(rows, res);
    }
  } catch (err) {
    serverErr(err, res);
  }
}

async function createFlag(req, res) {}

async function showFlag(req, res, name) {
  let isLogged = false;

  try {
    if (!isLogged) {
      const [rows] = await db.query(
        `
          SELECT feature, user_id, environment, enabled, created_at, updated_at FROM flags WHERE feature LIKE ?;
          `,
        [`%${name}%`],
      );

      return sendData(rows, res);
    }
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
