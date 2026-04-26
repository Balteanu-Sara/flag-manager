import { notFoundErr } from "../middlewares.js";
import {
  registerUser,
  createAdminRequest,
  login,
  logout,
  showMetadata,
  changeMetadata,
  deleteAccount,
} from "../services/authHandlers.js";

function handleAuthRoutes(req, res) {
  const method = req.method;
  const { pathname } = new URL(req.url, "http://localhost");

  const subpaths = pathname.split("/");

  if (subpaths[1].toLowerCase() === "register-user" && method === "POST")
    return registerUser(req, res);
  if (subpaths[1].toLowerCase() === "register-admin" && method === "POST")
    return createAdminRequest(req, res);

  if (subpaths[1].toLowerCase() === "login" && method === "POST")
    return login(req, res);

  if (subpaths[1].toLowerCase() === "others") {
    if (method === "GET") return showMetadata(req, res);

    const field = subpaths[2];
    if (method === "PUT" && subpaths.lengths === 3)
      return changeMetadata(req, res, field);

    if (method === "DELETE") return deleteAccount(req, res);
  }

  if (subpaths[1].toLowerCase() === "logout") return logout(req, res);

  return notFoundErr(res);
}
