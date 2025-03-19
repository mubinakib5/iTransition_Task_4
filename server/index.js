const express = require("express");
const cors = require("cors");
const { Pool } = require("pg");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
require("dotenv").config();

const app = express();
app.use(cors());
app.use(express.json());

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// Middleware to verify token
const authenticateToken = async (req, res, next) => {
  const token = req.headers["authorization"]?.split(" ")[1];

  if (!token) return res.status(401).json({ error: "Access denied" });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await pool.query(
      "SELECT * FROM users WHERE id = $1 AND status != $2",
      [decoded.userId, "blocked"]
    );

    if (!user.rows[0]) {
      return res.status(401).json({ error: "User blocked or deleted" });
    }

    req.user = user.rows[0];
    next();
  } catch (err) {
    res.status(401).json({ error: "Invalid token" });
  }
};

// Register endpoint
app.post("/api/register", async (req, res) => {
  try {
    const { name, email, password } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);

    const result = await pool.query(
      "INSERT INTO users (name, email, password) VALUES ($1, $2, $3) RETURNING *",
      [name, email, hashedPassword]
    );

    res.json({ message: "Registration successful" });
  } catch (err) {
    if (err.code === "23505") {
      // Unique violation
      res.status(400).json({ error: "Email already exists" });
    } else {
      res.status(500).json({ error: "Server error" });
    }
  }
});

// Login endpoint
app.post("/api/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await pool.query("SELECT * FROM users WHERE email = $1", [
      email,
    ]);

    if (!user.rows[0]) {
      return res.status(400).json({ error: "User not found" });
    }

    if (user.rows[0].status === "blocked") {
      return res.status(403).json({ error: "Account is blocked" });
    }

    const validPassword = await bcrypt.compare(password, user.rows[0].password);
    if (!validPassword) {
      return res.status(400).json({ error: "Invalid password" });
    }

    await pool.query(
      "UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = $1",
      [user.rows[0].id]
    );

    const token = jwt.sign({ userId: user.rows[0].id }, process.env.JWT_SECRET);
    res.json({ token });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

// Get users endpoint
app.get("/api/users", authenticateToken, async (req, res) => {
  try {
    const users = await pool.query(
      "SELECT id, name, email, last_login, status FROM users ORDER BY last_login DESC"
    );
    res.json(users.rows);
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

// Update users status endpoint
app.post("/api/users/status", authenticateToken, async (req, res) => {
  try {
    const { userIds, status } = req.body;

    await pool.query("UPDATE users SET status = $1 WHERE id = ANY($2)", [
      status,
      userIds,
    ]);

    res.json({ message: "Users updated successfully" });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

// Delete users endpoint
app.delete("/api/users", authenticateToken, async (req, res) => {
  try {
    const { userIds } = req.body;

    await pool.query("DELETE FROM users WHERE id = ANY($1)", [userIds]);

    res.json({ message: "Users deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
