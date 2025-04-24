const User = require("../models/User");
const bcrypt = require("bcrypt");
const { logEvents } = require("../middleware/logger");

// This way we can generate a access and refresh token for the JWT authentication.
// C:\Users\jpsm8\Documents\Coding\projects\MERN_fullStack\backend> node
// > require('crypto').randomBytes(64).toString('hex')
// '497a9d66e940cbf566444f4383a4fcbee08354b21d725235b4012a83a263092f3bf325a6c2b57791e4bc3596c89858af099fd7fcb'
// save them in .env file as ACCESS_TOKEN_SECRET and REFRESH_TOKEN_SECRET
const jwt = require("jsonwebtoken");

// @desc Login
// @route POST /auth
// @access Public
const login = async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ message: "All fields are required" });
  }

  try {
    const foundUser = await User.findOne({ username }).exec();

    if (!foundUser || !foundUser.active) {
      logEvents(
        `Unauthorized login attempt for username: ${username}`,
        "authLog.log"
      );
      return res.status(401).json({ message: "Unauthorized" });
    }

    const match = await bcrypt.compare(password, foundUser.password);

    if (!match) {
      logEvents(`Invalid password for username: ${username}`, "authLog.log");
      return res.status(401).json({ message: "Unauthorized" });
    }

    const accessToken = jwt.sign(
      {
        UserInfo: {
          username: foundUser.username,
          roles: foundUser.roles,
        },
      },
      process.env.ACCESS_TOKEN_SECRET,
      { expiresIn: "15m" }
    );

    const refreshToken = jwt.sign(
      { username: foundUser.username },
      process.env.REFRESH_TOKEN_SECRET,
      { expiresIn: "7d" }
    );

    // Create secure cookie with refresh token
    res.cookie("jwt", refreshToken, {
      httpOnly: true, //accessible only by web server
      secure: true, //https
      sameSite: "None", //cross-site cookie
      maxAge: 7 * 24 * 60 * 60 * 1000, //cookie expiry: set to match rT
    });

    // Send accessToken containing username and roles
    res.status(200).json({ accessToken });
  } catch (error) {
    logEvents(`Login error: ${error.message}`, "authLog.log");
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// @desc Refresh
// @route GET /auth/refresh
// @access Public - because access token has expired
const refresh = (req, res) => {
  const cookies = req.cookies;

  if (!cookies?.jwt) return res.status(401).json({ message: "Unauthorized" });

  const refreshToken = cookies.jwt;

  try {
    jwt.verify(
      refreshToken,
      process.env.REFRESH_TOKEN_SECRET,
      async (err, decoded) => {
        if (err) {
          logEvents(`Invalid refresh token: ${err.message}`, "authLog.log");
          return res.status(403).json({ message: "Forbidden" });
        }

        const foundUser = await User.findOne({
          username: decoded.username,
        }).exec();

        if (!foundUser)
          return res.status(401).json({ message: "Unauthorized" });

        const accessToken = jwt.sign(
          {
            UserInfo: {
              username: foundUser.username,
              roles: foundUser.roles,
            },
          },
          process.env.ACCESS_TOKEN_SECRET,
          { expiresIn: "15m" }
        );

        res.status(200).json({ accessToken });
      }
    );
  } catch (error) {
    logEvents(`Refresh token error: ${error.message}`, "authLog.log");
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// @desc Logout
// @route POST /auth/logout
// @access Public - just to clear cookie if exists
const logout = (req, res) => {
  const cookies = req.cookies;
  if (!cookies?.jwt) return res.sendStatus(204); //No content
  res.clearCookie("jwt", { httpOnly: true, sameSite: "None", secure: true });
  res.status(200).json({ message: "Logged out successfully" });
};

module.exports = {
  login,
  refresh,
  logout,
};
