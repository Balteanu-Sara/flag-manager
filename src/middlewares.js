import dotenv from "dotenv";
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

export { sendData, sendResponse, serverErr, notFoundErr, parseBody };
