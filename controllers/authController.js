const User = require("../models/User");
const bcrypt = require("bcrypt");
const { logEvents } = require("../middleware/logger");

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
    const user = await User.findOne({ username }).lean();

    if (!user || !user.active) {
      logEvents(
        `Unauthorized login attempt for username: ${username}`,
        "authLog.log"
      );
      return res.status(401).json({ message: "Unauthorized, no user found!" });
    }

    const match = await bcrypt.compare(password, user.password);

    if (!match) {
      logEvents(`Invalid password for username: ${username}`, "authLog.log");
      return res
        .status(401)
        .json({ message: "Unauthorized, invalid password!" });
    }

    const accessToken = jwt.sign(
      {
        UserInfo: {
          username: user.username,
          roles: user.roles,
        },
      },
      process.env.ACCESS_TOKEN_SECRET,
      { expiresIn: "15m" }
    );

    const refreshToken = jwt.sign(
      { username: user.username },
      process.env.REFRESH_TOKEN_SECRET,
      { expiresIn: "7d" }
    );

    // Create secure cookie with refresh token
    res.cookie("jwt", refreshToken, {
      httpOnly: true, //accessible only by web server
      secure: true, //https
      sameSite: "None", //cross-site cookie
      maxAge: 7 * 24 * 60 * 60 * 1000, //cookie expiry: set to match refresh token (7 days in this case)
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
        });

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
