const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const { logEvents } = require("../middleware/logger");

const jwt = require("jsonwebtoken");

// imported models
const User = require("../models/User");
const Note = require("../models/Note");

const passwordRegex =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
const emailRegex =
  /(?:[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*|"(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21\x23-\x5b\x5d-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])*")@(?:(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?|\[(?:(?:(2(5[0-5]|[0-4][0-9])|1[0-9][0-9]|[1-9]?[0-9]))\.){3}(?:(2(5[0-5]|[0-4][0-9])|1[0-9][0-9]|[1-9]?[0-9])|[a-z0-9-]*[a-z0-9]:(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21-\x5a\x53-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])+)\])/;

// @desc Get all users
// @route GET /users
// @access Private
const getAllUsers = async (req, res) => {
  try {
    const users = await User.find().select("-password").lean();
    if (!users || users.length === 0) {
      return res.status(404).json({ message: "No users found!" });
    }
    return res.status(200).json(users);
  } catch (error) {
    console.error("Error fetching users!", error);
    return res.status(500).json({
      message: "An error occurred while fetching users!",
      error: error.message,
    });
  }
};

// @desc Get a user by ID
// @route GET /users/:id
// @access Private
const getUserById = async (req, res) => {
  const { id } = req.params;

  try {
    const user = await User.findById(id).select("-password").lean();
    if (!user) {
      return res.status(404).json({ message: "User not found!" });
    }
    return res.status(200).json(user);
  } catch (error) {
    console.error("Error fetching user!", error);
    return res.status(500).json({
      message: "An error occurred while fetching user!",
      error: error.message,
    });
  }
};

// @desc Create new user
// @route POST /users
// @access Private
const createNewUser = async (req, res) => {
  const { username, password, email, roles } = req.body;

  if (!username || !password || !email) {
    return res
      .status(400)
      .json({ message: "Username, password and email are required!" });
  }

  if (!emailRegex.test(email)) {
    // error 400 - bad request
    return res.status(400).json({
      message: "Please provide a valid email address!",
    });
  }

  if (!passwordRegex.test(password)) {
    // error 400 - bad request
    return res.status(400).json({
      message:
        "Password must have at least 8 characters long containing at least 1 uppercase letter, lowercase letter, number and special character!",
    });
  }

  try {
    const duplicate = await User.findOne({
      $or: [{ username }, { email }],
    }).lean();

    if (duplicate) {
      const duplicateField =
        duplicate.username === username ? "username" : "email";
      return res.status(409).json({ message: `Duplicate ${duplicateField}` });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const userObj = {
      username,
      password: hashedPassword,
      email,
      ...(Array.isArray(roles) && roles.length && { roles }),
    };

    const newUser = await User.create(userObj);

    if (newUser) {
      const accessToken = jwt.sign(
        {
          UserInfo: {
            _id: newUser._id,
            username: newUser.username,
            email: newUser.email,
            roles: newUser.roles,
          },
        },
        process.env.ACCESS_TOKEN_SECRET,
        { expiresIn: "15m" }
      );

      const refreshToken = jwt.sign(
        { _id: newUser._id },
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
      return res.status(201).json({
        accessToken,
        user: {
          _id: newUser._id,
          username: newUser.username,
          email: newUser.email,
          roles: newUser.roles,
          image: newUser.image,
        },
      });
    } else {
      return res.status(400).json({ message: "Failed to create new user!" });
    }
  } catch (error) {
    console.error("Error creating user:", error);
    return res.status(500).json({
      message: "An error occurred while creating user",
      error: error.message,
    });
  }
};

// @desc Update a user
// @route PATCH /users
// @access Private
const updateUser = async (req, res) => {
  const { id } = req.params; // Extract the ID from the URL
  const { username, password, email, roles, active } = req.body;

  if (
    !id ||
    !username ||
    !email ||
    !Array.isArray(roles) ||
    !roles.length ||
    typeof active !== "boolean"
  ) {
    return res
      .status(400)
      .json({ message: "All fields except password are required!" });
  }

  if (!emailRegex.test(email)) {
    return res.status(400).json({
      message: "Please provide a valid email address!",
    });
  }

  if (password && !passwordRegex.test(password)) {
    return res.status(400).json({
      message:
        "Password must have at least 8 characters long containing at least 1 uppercase letter, lowercase letter, number and special character!",
    });
  }

  try {
    const [user, duplicateUser] = await Promise.all([
      User.findById(id).lean(),
      User.exists({ username, _id: { $ne: id } }),
    ]);

    if (!user || duplicateUser) {
      return !user
        ? res.status(404).json({ message: "User not found!" })
        : res.status(409).json({ message: "Duplicate username!" });
    }

    const updateFields = {};

    if (username !== user.username) updateFields.username = username;
    if (email !== user.email) updateFields.email = email;

    // Check if roles array is different and update only with new roles
    if (
      roles.length !== user.roles.length ||
      roles.some((role) => !user.roles.includes(role))
    ) {
      updateFields.roles = roles;
    }

    if (active !== user.active) updateFields.active = active;

    if (password) {
      updateFields.password = await bcrypt.hash(password, 10);
    }

    // No changes? Return early
    if (Object.keys(updateFields).length === 0) {
      return res.status(200).json({ message: "No changes detected" });
    }

    const updatedUser = await User.findByIdAndUpdate(
      id,
      { $set: updateFields },
      { new: true } // Return the updated document
    ).lean();

    if (!updatedUser) {
      return res.status(400).json({ message: "Failed to update user!" });
    }

    return res.status(200).json({ message: `${updatedUser.username} updated` });
  } catch (error) {
    console.error("Error updating user:", error);
    return res.status(500).json({
      message: "An error occurred while updating user!",
      error: error.message,
    });
  }
};

// @desc Delete a user
// @route DELETE /users
// @access Private
const deleteUser = async (req, res) => {
  const { id } = req.params; // Extract the ID from the URL

  if (!id) {
    return res.status(400).json({ message: "User ID required!" });
  }

  // Start a session
  const session = await mongoose.startSession();

  try {
    // Start a transaction
    session.startTransaction();

    // Fetch the user to ensure it exists
    const user = await User.findById(id);
    if (!user) {
      await session.abortTransaction();
      return res.status(404).json({ message: "User not found!" });
    }

    // Delete the user and their associated notes in parallel
    const [deletedUser, deletedNotes] = await Promise.all([
      User.findByIdAndDelete(id, { session }).lean(),
      Note.deleteMany({ userId: id }, { session }), // Delete all notes associated with the user
    ]);

    // If user deletion failed, abort the transaction
    if (!deletedUser) {
      await session.abortTransaction();
      return res.status(400).json({ message: "Failed to delete user!" });
    }

    // Commit the transaction only if everything went well
    await session.commitTransaction();

    // Return the response with success
    return res.status(200).json({
      message: `User ${deletedUser.username} and their notes deleted successfully`,
    });
  } catch (error) {
    console.error("Error deleting user!", error);
    await session.abortTransaction();
    res.status(500).json({
      message: "An error occurred while deleting user!",
      error: error.message,
    });
  } finally {
    // Ensure the session is ended regardless of the result
    session.endSession();
  }
};

module.exports = {
  getAllUsers,
  getUserById,
  createNewUser,
  updateUser,
  deleteUser,
};
