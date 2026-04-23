import { createServer } from "node:http";
import dotenv from "dotenv";

dotenv.config();
const port = process.env.PORT;

const app = createServer((req, res) => {
  console.log(req.url, req.method);
});

app.listen(port, () => {
  console.log("Server is running...");
});

export { app };
