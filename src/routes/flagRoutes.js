import { notFoundErr } from "../middlewares.js";
import {
  showFlags,
  createFlag,
  showFlag,
  filterFlags,
  changeMetadata,
  deleteFlag,
  toggleFlag,
} from "../services/flagHandlers.js";

function handleFlagRoutes(req, res) {
  const method = req.method;
  const subpaths = req.url.split("/");
  subpaths.shift();

  if (subpaths.length === 1) {
    const params = new URL(req.url, "http://localhost").search;

    if (method === "GET" && !params) return showFlags(req, res);
    if (method === "GET" && params) return filterFlags(req, res);
    if (method === "POST") return createFlag(req, res);
  }

  if (subpaths.length === 2) {
    const name = decodeURIComponent(subpaths[1]).toLowerCase();
    if (method === "GET") return showFlag(req, res, name);
    if (method === "PUT") return changeMetadata(req, res, name);
    if (method === "DELETE") return deleteFlag(req, res, name);
  }

  if (
    subpaths[2].toLowerCase() === "toggle" &&
    subpaths.length === 3 &&
    method === "PATCH"
  ) {
    const name = decodeURIComponent(subpaths[1]).toLowerCase();
    return toggleFlag(req, res, name);
  }

  return notFoundErr(res);
}

export { handleFlagRoutes };
