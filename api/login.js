const { Pool } = require("pg");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
});

module.exports = async (req, res) => {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { email, password } = req.body;

    // Log incoming request
    console.log("Login attempt for:", email);

    const userResult = await pool.query(
      "SELECT id, email, password, status FROM users WHERE email = $1",
      [email]
    );

    // Log query result
    console.log("User found:", userResult.rows.length > 0);

    if (userResult.rows.length === 0) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const user = userResult.rows[0];

    if (user.status === "blocked") {
      return res.status(403).json({ error: "Account is blocked" });
    }

    const validPassword = await bcrypt.compare(password, user.password);

    if (!validPassword) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    // Update last login time
    await pool.query(
      "UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = $1",
      [user.id]
    );

    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, {
      expiresIn: "24h",
    });

    return res.status(200).json({
      token,
      message: "Login successful",
    });
  } catch (error) {
    // Log the actual error
    console.error("Login error:", error);
    return res.status(500).json({
      error: "Server error",
      details:
        process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};
