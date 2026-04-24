function sendData(data, res) {
  res.writeHead(200, "Content-Type", "application/json");
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

export { sendData, serverErr, notFoundErr };
