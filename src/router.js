import { handleFlagRoutes } from "./routes/flagRoutes.js";
import { handleAuthRoutes } from "./routes/authRoutes.js";
import { handleAuditRoutes } from "./routes/auditRoutes.js";
import { notFoundErr } from "./utils";

function router(req, res) {
  const { pathname } = new URL(req.url, "http://localhost");

  if (pathname.startsWith("/flags")) return handleFlagRoutes(req, res);
  if (pathname.startsWith("/auth")) return handleAuthRoutes(req, res);
  if (pathname.startsWith("/audit")) return handleAuditRoutes(req, res);

  return notFoundErr(res);
}
