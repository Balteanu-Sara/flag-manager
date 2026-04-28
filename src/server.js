import { createServer } from "node:http";
import { router } from "./router.js";
import dotenv from "dotenv";

dotenv.config();
const port = process.env.PORT;

const app = createServer((req, res) => {
  console.log(req.url, req.method);

  router(req, res);
});

app.listen(port, () => {
  console.log("Server is running...");
});

export { app };
