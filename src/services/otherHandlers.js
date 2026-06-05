import { db } from "../config/createPool.js";
import bcrypt from "bcrypt";
import {
  sendData,
  serverErr,
  sendResponse,
  authenticate,
  parseBody,
  isLogged,
} from "../middlewares.js";
import { logout } from "./authHandlers.js";

function parseParameters(req) {
  const params = new URL(req.url, "http://localhost").searchParams;
  let parameters = "";
  const variables = [];

  if (params.get("name")) {
    parameters = "name LIKE ?";
    variables.push(`%${params.get("name").trim()}%`);
  }

  if (params.get("email")) {
    parameters += parameters.length > 0 ? "AND email LIKE ?" : "email LIKE ?";
    variables.push(`%${params.get("email").trim().toLowerCase()}%`);
  }

  if (params.get("created_at")) {
    parameters +=
      parameters.length > 0 ? "AND created_at LIKE ?" : "created_at LIKE ?";
    variables.push(`%${params.get("created_at").trim()}%`);
  }

  return { parameters, variables };
}

async function showUsers(req, res) {
  const user = await authenticate(req, res);

  if (!user) return;
  if (user.admin === 0) {
    sendResponse("Unauthorized", 401, res);
    return;
  }

  try {
    const [rows] = await db.query(`
        SELECT id, name, email, created_at FROM users WHERE admin <> true ORDER BY created_at DESC LIMIT 250;
      `);

    const [[{ total_users }]] = await db.query(`
      SELECT COUNT(*) as total_users FROM users WHERE admin <> true; 
      `);

    sendData({ total: total_users, data: rows }, res);
  } catch (err) {
    serverErr(err, res);
  }
}

async function showUser(req, res, user_id) {
  const user = await authenticate(req, res);

  if (!user) return;
  if (user.admin === 0) {
    sendResponse("Unauthorized", 401, res);
    return;
  }

  try {
    const [rows] = await db.query(
      `
        SELECT id, name, email,created_at FROM users WHERE id = ? ORDER BY created_at DESC;
      `,
      [user_id],
    );

    const [[{ total_flags }]] = await db.query(
      `
        SELECT COUNT(*) as total_flags FROM flags WHERE user_id = ?;
      `,
      [user_id],
    );
    const [[{ total_audit_logs }]] = await db.query(
      `
        SELECT COUNT(*) AS total_audit_logs FROM audit_log WHERE user_id = ?;
      `,
      [user_id],
    );

    sendData({ data: rows, total_flags, total_audit_logs }, res);
  } catch (err) {
    serverErr(err, res);
  }
}

async function filterUsers(req, res) {
  const { parameters, variables } = parseParameters(req);

  if (!parameters.length) {
    await showUsers(req, res);
    return;
  }
  const user = await authenticate(req, res);
  if (!user) return;
  if (user.admin === 0) {
    sendResponse("Unauthorized", 401, res);
  }

  try {
    const [rows] = await db.query(
      `
        SELECT id, name, email, created_at FROM users WHERE ${parameters} and admin <> true ORDER BY created_at DESC LIMIT 300;
      `,
      variables,
    );

    const [[{ total_users }]] = await db.query(
      `
      SELECT COUNT(*) FROM users WHERE ${parameters} and admin <> true;
      `,
      variables,
    );

    sendData({ total: total_users, data: rows }, res);
  } catch (err) {
    serverErr(err, res);
  }
}

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
  if (!body) return sendResponse("Invalid JSON body", 400, res);

  let columns = "";
  const variables = [];

  try {
    if (body.hasOwnProperty("email")) {
      const email = body.email.trim().toLowerCase();
      const [rows] = await db.query(
        `
          SELECT * FROM users WHERE email = ?;
        `,
        [email],
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

async function checkHealth(req, res) {
  const user = await isLogged(req, res);

  let databaseStatus = "ok";
  let statusCode = 200;

  try {
    await db.query("SELECT 1;");
  } catch {
    statusCode = 503;
    databaseStatus = "unavailable";
  }
  const response = {
    status: databaseStatus,
    timestamp: new Date().toISOString(),
  };

  if (!user) {
    res.writeHead(statusCode, { "Content-Type": "application/json" });
    res.write(JSON.stringify(response));
    res.end();
    return;
  }

  response.user = { email: user.email, admin: user.admin };
  if (user.admin && statusCode === 200) {
    const [[{ total_users }]] = await db.query(`
        SELECT COUNT(*) as total_users FROM users; 
      `);
    const [[{ total_flags }]] = await db.query(`
        SELECT COUNT(*) as total_flags FROM flags;
      `);
    const [[{ total_audit_logs }]] = await db.query(`
        SELECT COUNT(*) as total_audit_logs FROM audit_log;
      `);

    response.stats = { total_users, total_flags, total_audit_logs };
  }

  res.writeHead(statusCode, { "Content-Type": "application/json" });
  res.write(JSON.stringify(response));
  res.end();
  return;
}

export {
  showUsers,
  showUser,
  filterUsers,
  showMetadata,
  changeMetadata,
  deleteAccount,
  checkHealth,
};
