import { notFoundErr } from "../middlewares.js";
import {
  showLogs,
  filterLogs,
  showUsersLogs,
} from "../services/auditHandlers.js";
function handleAuditRoutes(req, res) {
  const method = req.method;
  const { pathname } = new URL(req.url, "hhtp://localhost");

  const subpaths = pathname.split("/");
  subpaths.shift();

  if (
    method === "GET" &&
    subpaths[0].toLowerCase() === "audit-log" &&
    subpaths.length === 1
  )
    return showLogs(req, res);

  let params = subpaths[0].split("?");
  if (
    method === "GET" &&
    params[0].toLowerCase() === "audit-log" &&
    params[1] &&
    subpaths.length === 1
  )
    return filterLogs(req, res, params[1]);

  if (
    method === "GET" &&
    subpaths[0].toLowerCase() === "audit-log" &&
    subpaths[1].toLowerCase() === "users" &&
    subpaths.length === 2
  )
    return showUsersLogs(req, res);

  params = subpaths[1].split("?");
  if (
    method === "GET" &&
    subpaths[0].toLowerCase() === "audit-log" &&
    params[0].toLowerCase() === "users" &&
    subpaths.length === 2 &&
    params.length === 2
  )
    return filterLogs(req, res, params[1]);

  return notFoundErr(res);
}

export { handleAuditRoutes };
