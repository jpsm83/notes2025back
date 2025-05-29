// ✅ Option: Using pg (node-postgres)
// This is the most popular and standard PostgreSQL client for Node.js. You get full control with SQL.

// =================== setup PostgreSQL with pg ===================
// // db.js
// import pkg from "pg";
// const { Pool } = pkg;

// const pool = new Pool({
//   connectionString: process.env.DATABASE_URL, // example: 'postgresql://user:pass@localhost:5432/mydb'
// });

// export default pool;

// userController.js (PostgreSQL using 'pg')
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import pool from "../db.js";

const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
const emailRegex = /(?:[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*|"(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21\x23-\x5b\x5d-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])*")@(?:(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?|\[(?:(?:(2(5[0-5]|[0-4][0-9])|1[0-9][0-9]|[1-9]?[0-9]))\.){3}(?:(2(5[0-5]|[0-4][0-9])|1[0-9][0-9]|[1-9]?[0-9])|[a-z0-9-]*[a-z0-9]:(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21-\x5a\x53-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])+))\]/;

export const getAllUsers = async (req, res) => {
  try {
    const { rows } = await pool.query(
      "SELECT id, username, email, roles, active, image FROM users"
    );
    if (!rows.length) return res.status(404).json({ message: "No users found!" });
    res.status(200).json(rows);
  } catch (error) {
    res.status(500).json({ message: "An error occurred", error: error.message });
  }
};

export const getUserById = async (req, res) => {
  const { id } = req.params;
  try {
    const { rows } = await pool.query(
      "SELECT id, username, email, roles, active, image FROM users WHERE id = $1",
      [id]
    );
    if (!rows.length) return res.status(404).json({ message: "User not found!" });
    res.status(200).json(rows[0]);
  } catch (error) {
    res.status(500).json({ message: "An error occurred", error: error.message });
  }
};

export const createNewUser = async (req, res) => {
  const { username, password, email, roles } = req.body;

  if (!username || !password || !email) {
    return res.status(400).json({ message: "Username, password and email are required!" });
  }

  if (!emailRegex.test(email)) {
    return res.status(400).json({ message: "Invalid email address!" });
  }

  if (!passwordRegex.test(password)) {
    return res.status(400).json({
      message: "Password must meet complexity requirements!",
    });
  }

  try {
    const existing = await pool.query(
      "SELECT * FROM users WHERE username = $1 OR email = $2",
      [username, email]
    );
    if (existing.rows.length)
      return res.status(409).json({ message: "Username or email already exists" });

    const hashedPassword = await bcrypt.hash(password, 10);
    const result = await pool.query(
      `INSERT INTO users (username, email, password, roles)
       VALUES ($1, $2, $3, $4) RETURNING id, username, email, roles, image`,
      [username, email, hashedPassword, roles]
    );

    const newUser = result.rows[0];
    const accessToken = jwt.sign(
      { UserInfo: { ...newUser } },
      process.env.ACCESS_TOKEN_SECRET,
      { expiresIn: "15m" }
    );

    const refreshToken = jwt.sign(
      { id: newUser.id },
      process.env.REFRESH_TOKEN_SECRET,
      { expiresIn: "7d" }
    );

    res.cookie("jwt", refreshToken, {
      httpOnly: true,
      secure: true,
      sameSite: "None",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.status(201).json({ accessToken, user: newUser });
  } catch (error) {
    res.status(500).json({ message: "Error creating user", error: error.message });
  }
};

export const updateUser = async (req, res) => {
  const { id } = req.params;
  const { username, password, email, roles, active } = req.body;

  if (!id || !username || !email || !Array.isArray(roles) || typeof active !== "boolean") {
    return res.status(400).json({ message: "Invalid input" });
  }

  if (!emailRegex.test(email)) {
    return res.status(400).json({ message: "Invalid email address!" });
  }

  if (password && !passwordRegex.test(password)) {
    return res.status(400).json({ message: "Password does not meet requirements!" });
  }

  try {
    const duplicateCheck = await pool.query(
      "SELECT * FROM users WHERE (username = $1 OR email = $2) AND id != $3",
      [username, email, id]
    );
    if (duplicateCheck.rows.length)
      return res.status(409).json({ message: "Duplicate username or email!" });

    const fields = [username, email, roles, active];
    let query =
      "UPDATE users SET username = $1, email = $2, roles = $3, active = $4";

    if (password) {
      const hashedPassword = await bcrypt.hash(password, 10);
      fields.push(hashedPassword);
      query += ", password = $5";
    }

    fields.push(id);
    query += ` WHERE id = $${fields.length}`;

    await pool.query(query, fields);

    res.status(200).json({ message: `${username} updated` });
  } catch (error) {
    res.status(500).json({ message: "Error updating user", error: error.message });
  }
};

export const deleteUser = async (req, res) => {
  const { id } = req.params;
  if (!id) return res.status(400).json({ message: "User ID required!" });

  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const userRes = await client.query("SELECT username FROM users WHERE id = $1", [id]);
    if (!userRes.rows.length) {
      await client.query("ROLLBACK");
      return res.status(404).json({ message: "User not found!" });
    }

    await client.query("DELETE FROM notes WHERE user_id = $1", [id]);
    await client.query("DELETE FROM users WHERE id = $1", [id]);
    await client.query("COMMIT");

    res.status(200).json({ message: `User ${userRes.rows[0].username} and their notes deleted successfully` });
  } catch (error) {
    await client.query("ROLLBACK");
    res.status(500).json({ message: "Error deleting user", error: error.message });
  } finally {
    client.release();
  }
};
