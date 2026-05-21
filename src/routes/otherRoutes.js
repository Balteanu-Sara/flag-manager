import { badRequestErr } from "../middlewares.js";
import {
  showUsers,
  showUser,
  filterUsers,
  showMetadata,
  changeMetadata,
  deleteAccount,
  checkHealth,
} from "../services/otherHandlers.js";

function handleOtherRoutes(req, res) {
  const method = req.method;
  const subpaths = req.url.split("/");
  subpaths.shift();

  if (subpaths[0].startsWith("users") && method === "GET") {
    const params = new URL(req.url, "http://localhost").search;

    if (subpaths.length === 1) {
      if (!params) return showUsers(req, res);
      if (params) return filterUsers(req, res);
    }

    if (subpaths.length === 2) {
      const user_id = decodeURIComponent(subpaths[1]).toLowerCase();
      console.log(user_id);
      return showUser(req, res, user_id);
    }
  }

  if (subpaths[0] === "account" && subpaths.length === 1) {
    if (method === "GET") return showMetadata(req, res);
    if (method === "PUT") return changeMetadata(req, res);
    if (method === "DELETE") return deleteAccount(req, res);
  }

  if (subpaths[0] === "health" && method === "GET")
    return checkHealth(req, res);

  return badRequestErr(res);
}

export { handleOtherRoutes };
