require("dotenv").config()
require("express-async-errors")
const express = require("express") // express is a node framework that allows us to create web server envioraments
const app = express()
const path = require("path") // path module provides a way of working with directories and file paths
const { logger, logEvents } = require("./middleware/logger")
const errorHandler = require("./middleware/errorHandler")
const cookieParser = require("cookie-parser") // cookie-parser is a middleware which parses cookies attached to the client request object
const cors = require("cors")
const corsOptions = require("./config/corsOptions")
const connectDB = require("./config/connectDB")
const mongoose = require("mongoose")
const PORT = process.env.PORT || 3500
console.log(process.env.NODE_ENV)

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
app.use("/api/v1", require("./routes/root"));

app.use("/api/v1/auth", require("./routes/authRoutes"));

// model routes
app.use("/api/v1/users", require("./routes/userRoutes"));
app.use("/api/v1/notes", require("./routes/noteRoutes"));

// single threaded process, if route 1 (above) does not match, everything else will be handled by this route
app.all("*", (req, res) => {
  res.status(404);
  if (req.accepts("html")) {
    res.sendFile(path.join(__dirname, "views", "404.html"));
  } else if (req.accepts("json")) {
    res.json({ message: "404 Not Found" });
  } else {
    res.type("txt").send("404 Not Found");
  }
});

app.use(errorHandler);

mongoose.connection.once("open", () => {
  console.log("Connected to MongoDB");
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








const noteRouter = require('./routes/notes.routes')
const authRouter = require('./routes/auth.routes')

app.use('/api/notes', noteRouter)
app.use('/api/auth', authRouter)

//  Catch 404 and respond with error message
app.use((req, res, next) => {
  return res.status(404).json({ message: "Not found"})
})

module.exports = app