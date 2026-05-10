import dotenv from "dotenv";
import jwt from "jsonwebtoken";
dotenv.config();

function sendData(data, res) {
  res.writeHead(200, { "Content-Type": "application/json" });
  res.write(JSON.stringify({ data }));
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

async function parseBody(req) {
  return new Promise((resolve, reject) => {
    let body = "";

    req.on("data", (chunk) => (body += chunk.toString()));
    req.on("end", () => {
      if (!body) return resolve({});

      try {
        resolve(JSON.parse(body));
      } catch (err) {
        reject(err);
      }
    });
  });
}

function isLogged(req) {
  const header = req.headers["authorization"];

  if (!header || !header.startsWith("Bearer ")) return null;

  try {
    return jwt.verify(header.split(" ")[1], process.env.JWT_SECRET_KEY);
  } catch (err) {
    console.error(err);
    return null;
  }
}

function authenticate(req, res) {
  const header = req.headers["authorization"];

  if (!header || !header.startsWith("Bearer ")) {
    sendResponse("Header is invalid or non-existent.", 401, res);
    return null;
  }

  const token = header.split(" ")[1];
  try {
    return jwt.verify(token, process.env.JWT_SECRET_KEY);
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
