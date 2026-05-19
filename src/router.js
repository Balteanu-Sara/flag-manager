import { handleFlagRoutes } from "./routes/flagRoutes.js";
import { handleAuthRoutes } from "./routes/authRoutes.js";
import { handleAuditRoutes } from "./routes/auditRoutes.js";
import { handleOtherRoutes } from "./routes/otherRoutes.js";
import { badRequestErr } from "./middlewares.js";

function router(req, res) {
  const pathname = req.url;

  if (
    pathname.startsWith("/flags?") ||
    pathname.startsWith("/flags/") ||
    pathname.toLowerCase() === "/flags"
  )
    return handleFlagRoutes(req, res);
  if (req.url.split("/")[1].toLowerCase() === "auth")
    return handleAuthRoutes(req, res);
  if (
    pathname.startsWith("/audit-log?") ||
    pathname.startsWith("/audit-log/") ||
    pathname.toLowerCase() === "/audit-log"
  )
    return handleAuditRoutes(req, res);

  if (
    pathname.startsWith("/users?") ||
    pathname.startsWith("/users/") ||
    pathname.toLowerCase() === "/users" ||
    pathname.toLowerCase() === "/account" ||
    pathname.toLowerCase() === "/health"
  )
    return handleOtherRoutes(req, res);

  return badRequestErr(res);
}

export { router };
