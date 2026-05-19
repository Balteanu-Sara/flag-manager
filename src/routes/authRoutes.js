import { badRequestErr } from "../middlewares.js";
import {
  registerUser,
  createAdminRequest,
  login,
  logout,
  deleteAccount,
} from "../services/authHandlers.js";

function handleAuthRoutes(req, res) {
  const method = req.method;

  const subpaths = req.url.split("/");
  subpaths.shift();

  if (
    subpaths[1].toLowerCase() === "register" &&
    method === "POST" &&
    subpaths.length === 2
  )
    return registerUser(req, res);
  if (
    subpaths[1].toLowerCase() === "register-admin" &&
    method === "POST" &&
    subpaths.length === 2
  )
    return createAdminRequest(req, res);

  if (
    subpaths[1].toLowerCase() === "login" &&
    method === "POST" &&
    subpaths.length === 2
  )
    return login(req, res);

  if (subpaths[1].toLowerCase() === "logout") return logout(req, res);

  return badRequestErr(res);
}

export { handleAuthRoutes };
