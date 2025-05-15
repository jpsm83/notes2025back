import dotenv from "dotenv";
dotenv.config();

import express from "express"; // express is a node framework that allows us to create web server environments
const app = express();

import path from "path"; // path module provides a way of working with directories and file paths
import { fileURLToPath } from "url";
import { logger, logEvents } from "./middleware/logger.js";
import errorHandler from "./middleware/errorHandler.js";
import cookieParser from "cookie-parser"; // cookie-parser is a middleware which parses cookies attached to the client request object
import cors from "cors";
import corsOptions from "./config/corsOptions.js";
import connectDB from "./config/connectDB.js";
import mongoose from "mongoose";

// Calculate __dirname equivalent in ES module context
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = process.env.PORT || 3500; // if for some reason process.env.PORT is not available, run on 3500

console.log(process.env.NODE_ENV);

// connect to DB
connectDB();

// custom middleware logger to log all requests to the server
app.use(logger);

// cross-origin resource sharing (CORS) middleware to allow requests from different origins
// only authorized origins are allowed to access the server
app.use(cors(corsOptions));

// middleware for parsing json and urlencoded data
app.use(express.json());

// middleware to parse cookies
app.use(cookieParser());

// route for static files
app.use("/", express.static(path.join(__dirname, "public")));

// 1 - route for html pages (404, index, etc.)
import rootRoutes from "./routes/root.js";
app.use("/api/v1", rootRoutes);

import authRoutes from "./routes/authRoutes.js";
app.use("/api/v1/auth", authRoutes);

// model routes
import userRoutes from "./routes/userRoutes.js";
import noteRoutes from "./routes/noteRoutes.js";
app.use("/api/v1/users", userRoutes);
app.use("/api/v1/notes", noteRoutes);

// Catch-all middleware for 404 errors
app.use((req, res, next) => {
  res.status(404);
  if (req.accepts("html")) {
    res.sendFile(path.join(__dirname, "views", "404.html"));
  } else if (req.accepts("json")) {
    res.json({ message: "404 Not Found" });
  } else {
    res.type("txt").send("404 Not Found");
  }
});

// Error handler middleware is the last middleware to be used so it can catch errors from all previous middleware and routes
app.use(errorHandler);

// Start the server after DB connection is ready
mongoose.connection.once("open", () => {
  app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
});

// if error occurs while connecting to MongoDB, log the error, exit the process and save the error to a log file
mongoose.connection.on("error", (err) => {
  console.log(err);
  logEvents(
    `${err.no}: ${err.code}\t${err.syscall}\t${err.hostname}`,
    "mongoErrLog.log"
  );
});
