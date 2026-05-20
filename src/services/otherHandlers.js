import { db } from "../config/createPool.js";
import bcrypt from "bcrypt";
import {
  sendData,
  serverErr,
  sendResponse,
  authenticate,
  parseBody,
} from "../middlewares.js";
import { logout } from "./authHandlers.js";

async function showUsers(req, res) {}

async function showUser(req, res) {}

async function filterUsers(req, res) {}

async function showMetadata(req, res) {
  const user = await authenticate(req, res);

  if (!user) return;

  try {
    const [rows] = await db.query(
      `
        SELECT name, email, admin, created_at FROM users WHERE id = ?;
      `,
      [user.id],
    );

    sendData(rows[0], res);
  } catch (err) {
    serverErr(err, res);
  }
}

async function changeMetadata(req, res) {
  const user = await authenticate(req, res);

  if (!user) return;
  const body = await parseBody(req);
  let columns = "";
  const variables = [];

  try {
    if (body.hasOwnProperty("email")) {
      const [rows] = await db.query(
        `
          SELECT * FROM users WHERE email = ?;
        `,
        [body.email.trim().toLowerCase()],
      );

      if (rows.length > 0)
        return sendResponse(
          "Account associated with email already exists!",
          400,
          res,
        );
      const emailFormat = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailFormat.test(body.email.trim().toLowerCase()))
        return sendResponse("Email is not valid", 400, res);

      columns += `email = ?`;
      variables.push(body.email.trim().toLowerCase());
    }

    if (body.hasOwnProperty("name")) {
      columns += columns.length > 0 ? ", name= ?" : "name = ?";
      variables.push(body.name.trim());
    }

    if (body.hasOwnProperty("password")) {
      if (body.password.trim().length < 13)
        return sendResponse(
          "Password must be at least 13 characters.",
          400,
          res,
        );

      const hashedPassword = await bcrypt.hash(body.password.trim(), 10);
      columns += columns.length > 0 ? ", password = ?" : "password = ?";
      variables.push(hashedPassword);
    }

    if (
      !body.hasOwnProperty("email") &&
      !body.hasOwnProperty("name") &&
      !body.hasOwnProperty("password")
    )
      return sendResponse("No valid column provided for update.", 400, res);

    variables.push(user.id);
    await db.query(
      `
        UPDATE users SET ${columns} WHERE id = ?;
      `,
      variables,
    );

    sendResponse("Data updated successfully!", 200, res);
  } catch (err) {
    serverErr(err, res);
  }
}

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
