import { v4 as uuidv4 } from "uuid";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import { sendResponse, parseBody, serverErr } from "../middlewares.js";
import { db } from "../config/createPool.js";
import dotenv from "dotenv";

dotenv.config();

function isLogged() {}

async function registerUser(req, res, admin = false) {
  console.log("am intrat in register");
  const body = await parseBody(req);
  console.log(body);

  if (!body.password || !body.email || !body.name) {
    return sendResponse("Email, name and password are required!", 400, res);
  }

  if (body.password.length < 13)
    return sendResponse("Password must be at least 13 characters.", 400, res);

  try {
    console.log("am trecut de erori");
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

async function login(req, res) {}

function logout(req, res) {}

function showMetadata(req, res) {}

function changeMetadata(req, res, field) {}

function deleteAccount(req, res) {}

export {
  isLogged,
  registerUser,
  createAdminRequest,
  login,
  logout,
  showMetadata,
  changeMetadata,
  deleteAccount,
};
