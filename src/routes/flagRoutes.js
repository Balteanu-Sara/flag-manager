import { app } from "../server.js";
import { notFoundErr } from "../utils";

function handleFlagRoutes(req, res) {
  const { pathname } = new URL(req.method, "http://localhost");
  const method = req.method;

  const subpaths = pathname.split("/");

  if (subpaths.length === 1) {
    if (method === "GET") return showFlags(req, res);
    if (method === "POST") return addFlag(req, res);
  }

  if (subpaths[1] && subpaths.length === 2) {
    const name = decodeURIComponent(subpaths[1]);
    if (method === "GET") return showFlag(req, res, name);
    if (method === "PUT") return changeMetadata(req, res, name);
    if (method === "DELETE") return deleteFlag(req, res, name);
  }

  if (subpaths[2] && method === "PATCH") {
    const toggle = decodeURIComponent(subpaths[2]);
    return toggleFlag(req, res, toggle);
  }

  return notFoundErr(res);
}
