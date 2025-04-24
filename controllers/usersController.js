const User = require("../models/User");
const Note = require("../models/Note");
const bcrypt = require("bcrypt");

// @desc Get all users
// @route GET /users
// @access Private
const getAllUsers = async (req, res) => {
  try {
    const users = await User.find().select("-password").lean();
    if (!users?.length) {
      return res.status(404).json({ message: "No users found" });
    }
    res.status(200).json(users);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// @desc Get a user by ID
// @route GET /users/:id
// @access Private
const getUserById = async (req, res) => {
  const { id } = req.params;

  try {
    const username = await User.findById(id).select("-password").lean();
    if (!username) {
      return res.status(404).json({ message: "User not found" });
    }
    res.status(200).json(username);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// @desc Create new user
// @route POST /users
// @access Private
const createNewUser = async (req, res) => {
  const { username, password, roles } = req.body;

    // validators have to be equal to validators from frontend
    if (password.length < 5) {
      // error 400 - bad request
      return res.status(400).json({
        message: "Please make your password at least 5 characters long",
      });
    }
  
  if (!username || !password) {
    return res
      .status(400)
      .json({ message: "Username and password are required" });
  }

  try {
    const duplicate = await User.findOne({ username }).lean().exec();

    if (duplicate) {
      return res.status(409).json({ message: "Duplicate username" });
    }

    const hashedPwd = await bcrypt.hash(password, 10);

    const userObject = {
      username,
      password: hashedPwd,
      ...(Array.isArray(roles) && roles.length && { roles }),
    };

    const username = await User.create(userObject);

    if (username) {
      res.status(201).json({ message: `New user ${username} created` });
    } else {
      res.status(400).json({ message: "Invalid user data received" });
    }
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// @desc Update a user
// @route PATCH /users
// @access Private
const updateUser = async (req, res) => {
  const { id } = req.params; // Extract the ID from the URL
  const { username, roles, active, password } = req.body;

  if (
    !id ||
    !username ||
    !Array.isArray(roles) ||
    !roles.length ||
    typeof active !== "boolean"
  ) {
    return res
      .status(400)
      .json({ message: "All fields except password are required" });
  }

  try {
    const [username, duplicateUser] = await Promise.all([
      User.findById(id).lean().exec(),
      User.findOne({ username, _id: { $ne: id } })
        .lean()
        .exec(),
    ]);

    if (!username || duplicateUser) {
      return !username
        ? res.status(404).json({ message: "User not found" })
        : res.status(409).json({ message: "Duplicate username" });
    }

    const updateFields = {
      username,
      roles,
      active,
    };

    if (password) {
      updateFields.password = await bcrypt.hash(password, 10);
    }

    const updatedUser = await User.findByIdAndUpdate(
      id,
      { $set: updateFields },
      { new: true } // Return the updated document
    ).lean();

    if (!updatedUser) {
      return res.status(400).json({ message: "Failed to update user" });
    }

    res.status(200).json({ message: `${updatedUser.username} updated` });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// @desc Delete a user
// @route DELETE /users
// @access Private
const deleteUser = async (req, res) => {
  const { id } = req.params; // Extract the ID from the URL

  if (!id) {
    return res.status(400).json({ message: "User ID required" });
  }

  try {
    const [note, username] = await Promise.all([
      Note.findOne({ username: id }).lean().exec(),
      User.findById(id).select("-password").lean().exec(),
    ]);

    if (!username || !note) {
      return !username
        ? res.status(404).json({ message: "User not found" })
        : res.status(404).json({ message: "User has assigned notes" });
    }

    const result = await User.deleteOne();
    res.status(200).json({
      message: `Username ${result.username} with ID ${result._id} deleted`,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

module.exports = {
  getAllUsers,
  getUserById,
  createNewUser,
  updateUser,
  deleteUser,
};
