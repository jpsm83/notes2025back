// all allowed origins for CORS requests
const allowedOrigins = [
  "https://notes2025front-eft6ywww5-jpsm83s-projects.vercel.app",
  "https://notes2025front.vercel.app",
];

if (process.env.NODE_ENV === "development") {
  allowedOrigins.push("http://localhost:5173");
}

module.exports = allowedOrigins;
