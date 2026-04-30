import { handleFlagRoutes } from "./routes/flagRoutes.js";
import { handleAuthRoutes } from "./routes/authRoutes.js";
import { handleAuditRoutes } from "./routes/auditRoutes.js";
import { notFoundErr } from "./middlewares.js";

function router(req, res) {
  const pathname = req.url;

  if (
    pathname.startsWith("/flags?") ||
    pathname.startsWith("/flags/") ||
    pathname.toLowerCase() === "/flags"
  )
    return handleFlagRoutes(req, res);
  if (pathname.startsWith("/auth")) return handleAuthRoutes(req, res);
  if (
    pathname.startsWith("/audit-log?") ||
    pathname.startsWith("audit-log/") ||
    pathname.toLowerCase() === "/audit-log"
  )
    return handleAuditRoutes(req, res);

  return notFoundErr(res);
}

export { router };
