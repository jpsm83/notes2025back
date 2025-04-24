// cross origin resurce sharing - CORS is a W3C standard that allows you to get
// away from the same origin policy adopted by the browsers to restrict access
// from one domain to resources belonging to another domain

const allowedOrigins = require("./allowedOrigins");

const corsOptions = {
  origin: (origin, callback) => {
    // !origin allow postman or orders outsiders with no origin to access the server
    if (allowedOrigins.indexOf(origin) !== -1 || !origin) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  // credentials=true recive a cookie from the front (client) to know with user is in session
  credentials: true,
  optionsSuccessStatus: 200,
};

module.exports = corsOptions;
