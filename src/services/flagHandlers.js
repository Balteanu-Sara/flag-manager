import { db } from "../config/createPool.js";
import { sendData, serverErr } from "../middlewares.js";

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

async function filterFlags(req, res, params) {}

async function createFlag(req, res) {}

async function showFlag(req, res, name) {
  let isLogged = false;

  try {
    if (!isLogged) {
      const [rows] = await db.query(
        `
          SELECT feature, user_id, environment, enabled, created_at, updated_at FROM flags WHERE feature = ?;
          `,
        [name],
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
