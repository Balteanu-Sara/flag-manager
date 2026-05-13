import { v4 as uuidv4 } from "uuid";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import {
  sendResponse,
  parseBody,
  serverErr,
  authenticate,
  badRequestErr,
  isLogged,
} from "../middlewares.js";
import { db } from "../config/createPool.js";
import dotenv from "dotenv";

dotenv.config();

async function registerUser(req, res, admin = false) {
  const user = await isLogged(req, res);
  if (user) return badRequestErr(res);

  const body = await parseBody(req);

  if (!body.password || !body.email || !body.name) {
    return sendResponse("Email, name and password are required!", 400, res);
  }

  if (body.password.length < 13)
    return sendResponse("Password must be at least 13 characters.", 400, res);

  try {
    const [rows] = await db.query(
      `
      SELECT * FROM users WHERE email = ?;
      `,
      [body.email],
    );

    if (rows.length > 0)
      return sendResponse(
        "Account associated with email already exists!",
        400,
        res,
      );

    const hashedPassword = await bcrypt.hash(body.password, 10);
    await db.query(
      `
      INSERT INTO users(id, name, admin, email, password) VALUES ('${uuidv4()}', ?, ?, ?, ?);
      `,
      [body.name, admin, body.email, hashedPassword],
    );

    return sendResponse(
      "User has been created! Access /auth/login in order to log into account.",
      201,
      res,
    );
  } catch (err) {
    serverErr(err, res);
  }
}

function createAdminRequest(req, res) {}

async function login(req, res) {
  const user = await isLogged(req, res);
  if (user) return badRequestErr(res);

  const body = await parseBody(req);
  if (!body.hasOwnProperty("email") && !body.hasOwnProperty("password"))
    return sendResponse("Email and password are required!", 400, res);

  try {
    const [rows] = await db.query(
      `
        SELECT * FROM users WHERE email = ?
      `,
      [body.email],
    );
    if (rows.length === 0) return sendResponse("Email is invalid", 400, res);

    const isUser = await bcrypt.compare(body.password, rows[0].password);
    if (!isUser) return sendResponse("Password is incorrect!", 400, res);

    const token = jwt.sign(
      {
        jti: uuidv4(),
        id: rows[0].id,
        email: rows[0].email,
        admin: rows[0].admin,
      },
      process.env.JWT_SECRET_KEY,
      { expiresIn: "12h" },
    );

    return sendResponse(
      `Logged in successfully! To access resources, use unique token ${token}`,
      200,
      res,
    );
  } catch (err) {
    serverErr(err, res);
  }
}

async function logout(req, res, jti = null) {
  let jtiToken = jti;
  if (!jti) {
    const user = await authenticate(req, res);
    if (!user) return;
    jtiToken = user.jti;
  }

  try {
    await db.query(`INSERT INTO invalid_tokens(token) VALUES (?);`, [jtiToken]);
    console.log("gata log out");

    if (!jti) sendResponse("Successfully logged out!", 200, res);
  } catch (err) {
    serverErr(err, res);
  }
}

function showMetadata(req, res) {}

function changeMetadata(req, res, field) {}

async function deleteAccount(req, res) {
  const user = await authenticate(req, res);

  if (!user) return;

  try {
    await logout(req, res, user.jti);

    await db.query(`DELETE FROM users WHERE id=? ;`, [user.id]);
    console.log("sters din users");
    await db.query(`DELETE FROM flags WHERE user_id=? ;`, [user.id]);
    console.log("sters din flags");
    await db.query(`DELETE FROM audit_log WHERE user_id=? ;`, [user.id]);
    console.log("sters din audit_log");

    sendResponse("User account has been deleted!", 200, res);
  } catch (err) {
    serverErr(err, res);
  }
}

export {
  registerUser,
  createAdminRequest,
  login,
  logout,
  showMetadata,
  changeMetadata,
  deleteAccount,
};
