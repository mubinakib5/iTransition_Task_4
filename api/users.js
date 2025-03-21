const { Pool } = require("pg");
const jwt = require("jsonwebtoken");

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
});

module.exports = async (req, res) => {
  // Enable CORS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Authorization, Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method === "GET") {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader) {
        return res.status(401).json({ error: "No token provided" });
      }

      const token = authHeader.split(" ")[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      if (!decoded) {
        return res.status(401).json({ error: "Invalid token" });
      }

      const result = await pool.query(
        "SELECT id, name, email, last_login, status, created_at FROM users ORDER BY created_at DESC"
      );

      return res.status(200).json(result.rows);
    } catch (err) {
      console.error("Get users error:", err);
      return res
        .status(500)
        .json({ error: "Server error", details: err.message });
    }
  }

  return res.status(405).json({ error: "Method not allowed" });
};
