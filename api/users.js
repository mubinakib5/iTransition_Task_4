const { Pool } = require("pg");
const jwt = require("jsonwebtoken");

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
});

const verifyToken = (token) => {
  try {
    return jwt.verify(token, process.env.JWT_SECRET);
  } catch (err) {
    return null;
  }
};

module.exports = async (req, res) => {
  if (req.method === "GET") {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader) {
        return res.status(401).json({ error: "No token provided" });
      }

      const token = authHeader.split(" ")[1];
      const decoded = verifyToken(token);

      if (!decoded) {
        return res.status(401).json({ error: "Invalid token" });
      }

      const result = await pool.query(
        "SELECT id, name, email, last_login, status, created_at FROM users"
      );

      return res.status(200).json(result.rows);
    } catch (err) {
      console.error("Get users error:", err);
      return res.status(500).json({ error: "Server error" });
    }
  }

  return res.status(405).json({ error: "Method not allowed" });
};
