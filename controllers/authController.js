import User from "../models/User.js";
import bcrypt from "bcrypt";
import { logEvents } from "../middleware/logger.js";

import jwt from "jsonwebtoken";

// @desc Login
// @route POST /auth
// @access Public
export const login = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: "All fields are required" });
  }

  try {
    const user = await User.findOne({ email }).lean();

    if (!user) {
      logEvents(
        `Unauthorized login attempt for email: ${email}`,
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
          _id: user._id,
          roles: user.roles,
        },
      },
      process.env.ACCESS_TOKEN_SECRET,
      { expiresIn: "15m" }
    );

    const refreshToken = jwt.sign(
      { _id: user._id },
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
    return res.status(200).json({
      accessToken,
      user: {
        _id: user._id,
        username: user.username,
        email: user.email,
        roles: user.roles,
        image: user.image,
        active: user.active
      },
    });
  } catch (error) {
    logEvents(`Login error: ${error.message}`, "authLog.log");
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// @desc Refresh
// @route GET /auth/refresh
// @access Public - because access token has expired
export const refresh = (req, res) => {
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

        const user = await User.findOne({ _id: decoded._id }).exec();

        if (!user) return res.status(401).json({ message: "Unauthorized" });

        const accessToken = jwt.sign(
          {
            UserInfo: {
              _id: user._id,
              roles: user.roles,
            },
          },
          process.env.ACCESS_TOKEN_SECRET,
          { expiresIn: "15m" }
        );

        return res.status(200).json({
          accessToken,
          user: {
            _id: user._id,
            username: user.username,
            email: user.email,
            roles: user.roles,
            image: user.image,
            active: user.active
          },
        });
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
export const logout = (req, res) => {
  const cookies = req.cookies;
  if (!cookies?.jwt) return res.sendStatus(204); //No content
  res.clearCookie("jwt", { httpOnly: true, sameSite: "None", secure: true });
  return res.status(200).json({ message: "Logged out successfully" });
};
