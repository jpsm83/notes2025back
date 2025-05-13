// cross origin resurce sharing - CORS is a W3C standard that allows you to get
// away from the same origin policy adopted by the browsers to restrict access
// from one domain to resources belonging to another domain

const allowedOrigins = require("./allowedOrigins");

const corsOptions = {
  origin: (origin, callback) => {
    if (process.env.NODE_ENV === "development") {
      // Allow all requests in development, including those without an origin
      callback(null, true);
      return;
    }

    // In production, allow only requests with an origin in the allowedOrigins array
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  // Allow credentials (e.g., cookies) to be sent with requests
  credentials: true,
  optionsSuccessStatus: 200,
};

module.exports = corsOptions;
