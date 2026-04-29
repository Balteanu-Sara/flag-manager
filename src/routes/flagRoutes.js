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
  const { pathname } = new URL(req.url, "http://localhost");
  const method = req.method;

  const subpaths = pathname.split("/");
  subpaths.shift();

  if (subpaths.length === 1) {
    if (method === "GET" && subpaths[0].toLowerCase() === "flags")
      return showFlags(req, res);

    const params = subpaths[0].split("?")[1];
    if (method === "GET" && params) return filterFlags(req, res, params);
    if (method === "POST") return createFlag(req, res);
  }

  if (subpaths[1] && subpaths.length === 2) {
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
