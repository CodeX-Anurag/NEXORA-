/**
 * Lightweight Structured JSON Logger for Production Observability
 * Output Policy: Metadata ONLY (Zero prompts, JWTs, cookies, passwords, or secrets)
 */

const normalizeRoute = (url) => {
  if (!url) return "/";
  // Strip query parameters to prevent query leak
  const pathOnly = url.split("?")[0];
  // Replace MongoDB ObjectIds or numeric IDs with placeholders
  return pathOnly
    .replace(/\/[a-f0-9]{24}/gi, "/:id")
    .replace(/\/\d+/g, "/:id");
};

const isTestEnvironment = () => {
  return process.env.NODE_ENV === "test" || Boolean(process.env.JEST_WORKER_ID);
};

const info = (event, data = {}) => {
  if (isTestEnvironment()) return;

  const logPayload = {
    timestamp: new Date().toISOString(),
    level: "info",
    event,
    ...data
  };

  if (data.route) {
    logPayload.route = normalizeRoute(data.route);
  }

  console.log(JSON.stringify(logPayload));
};

const error = (event, data = {}) => {
  if (isTestEnvironment()) return;

  const logPayload = {
    timestamp: new Date().toISOString(),
    level: "error",
    event,
    ...data
  };

  if (data.route) {
    logPayload.route = normalizeRoute(data.route);
  }

  console.error(JSON.stringify(logPayload));
};

module.exports = {
  info,
  error,
  normalizeRoute
};
