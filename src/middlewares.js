import dotenv from "dotenv";
import { db } from "./config/createPool.js";
import jwt from "jsonwebtoken";
dotenv.config();

function sendData(data, res) {
  res.writeHead(200, { "Content-Type": "application/json" });
  res.write(JSON.stringify(data));
  res.end();
}

function sendResponse(message, status, res) {
  res.writeHead(status, { "Content-Type": "application/json" });
  res.write(JSON.stringify({ message, status }));
  return res.end();
}

function serverErr(message, res) {
  console.log("Error: ", message);
  sendResponse("Internal Server Error", 500, res);
}

function notFoundErr(res) {
  sendResponse("Not Found", 404, res);
}

function badRequestErr(res) {
  sendResponse("Bad request", 400, res);
}

function parseBody(req) {
  return new Promise((resolve, reject) => {
    let body = "";

    req.on("data", (chunk) => (body += chunk.toString()));
    req.on("end", () => {
      if (!body) return resolve({});

      try {
        resolve(JSON.parse(body));
      } catch (err) {
        resolve(null);
      }
    });
  });
}

async function isLogged(req) {
  const header = req.headers["authorization"];

  if (!header || !header.startsWith("Bearer ")) return null;

  const token = header.split(" ")[1];
  try {
    const user = jwt.verify(token, process.env.JWT_SECRET_KEY);

    const [rows] = await db.query(
      `SELECT token FROM invalid_tokens WHERE token=?`,
      [user.jti],
    );
    if (rows.length) return null;

    return user;
  } catch (err) {
    return null;
  }
}

async function authenticate(req, res) {
  const header = req.headers["authorization"];

  if (!header || !header.startsWith("Bearer ")) {
    sendResponse("Header is invalid or non-existent.", 401, res);
    return null;
  }

  const token = header.split(" ")[1];
  try {
    const user = jwt.verify(token, process.env.JWT_SECRET_KEY);

    const [rows] = await db.query(
      `
        SELECT token FROM invalid_tokens WHERE token=?;
      `,
      [user.jti],
    );

    if (rows.length) {
      sendResponse("Token is invalid!", 401, res);
      return null;
    }

    return user;
  } catch (err) {
    sendResponse("Token is invalid or expired.", 401, res);
    return null;
  }
}

export {
  sendData,
  sendResponse,
  serverErr,
  notFoundErr,
  badRequestErr,
  parseBody,
  isLogged,
  authenticate,
};
