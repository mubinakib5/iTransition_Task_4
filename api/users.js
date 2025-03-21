const { Pool } = require("pg");
const jwt = require("jsonwebtoken");

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
});

module.exports = async (req, res) => {
  // Handle CORS
  res.setHeader("Access-Control-Allow-Credentials", true);
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Authorization, Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method === "GET") {
    let client;
    try {
      // Get client from pool
      client = await pool.connect();

      // Verify token
      const authHeader = req.headers.authorization;
      if (!authHeader) {
        return res.status(401).json({ error: "No token provided" });
      }

      const token = authHeader.replace("Bearer ", "");

      try {
        jwt.verify(token, process.env.JWT_SECRET);
      } catch (tokenError) {
        console.error("Token verification error:", tokenError);
        return res.status(401).json({ error: "Invalid token" });
      }

      // Fetch users
      const result = await client.query(
        "SELECT id, name, email, last_login, status, created_at FROM users"
      );

      return res.status(200).json(result.rows);
    } catch (error) {
      console.error("Database operation error:", error);
      return res.status(500).json({ error: "Database error" });
    } finally {
      if (client) {
        client.release();
      }
    }
  }

  return res.status(405).json({ error: "Method not allowed" });
};
