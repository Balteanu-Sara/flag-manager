import { db } from "../config/createPool.js";
import {
  sendData,
  serverErr,
  sendResponse,
  authenticate,
} from "../middlewares.js";

async function showUsers(req, res) {}

async function showUser(req, res) {}

async function filterUsers(req, res) {}

async function showMetadata(req, res) {}

async function changeMetadata(req, res, field) {}

async function deleteAccount(req, res) {
  const user = await authenticate(req, res);

  if (!user) return;

  try {
    await logout(req, res, user.jti);

    await db.query(`DELETE FROM users WHERE id=? ;`, [user.id]);
    await db.query(`DELETE FROM flags WHERE user_id=? ;`, [user.id]);
    await db.query(`DELETE FROM audit_log WHERE user_id=? ;`, [user.id]);

    sendResponse("User account has been deleted!", 200, res);
  } catch (err) {
    serverErr(err, res);
  }
}

async function checkHealth(req, res) {}

export {
  showUsers,
  showUser,
  filterUsers,
  showMetadata,
  changeMetadata,
  deleteAccount,
  checkHealth,
};
