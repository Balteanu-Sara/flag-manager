import { notFoundErr } from "../middlewares.js";
import {
  showLogs,
  filterLogs,
  showUsersLogs,
} from "../services/auditHandlers.js";

function handleAuditRoutes(req, res) {
  const method = req.method;
  const subpaths = req.url.split("/");
  subpaths.shift();

  let params = new URL(req.url, "http://localhost").search;

  if (method === "GET" && subpaths.length === 1 && !params)
    return showLogs(req, res);

  if (method === "GET" && subpaths.length === 1 && params) {
    return filterLogs(req, res);
  }

  if (
    method === "GET" &&
    subpaths[0].toLowerCase() === "audit-log" &&
    subpaths[1].toLowerCase().startsWith("users") &&
    subpaths.length === 2
  ) {
    if (params) filterLogs(req, res, true);
    else showUsersLogs(req, res);
  }

  return notFoundErr(res);
}

export { handleAuditRoutes };
