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
      client = await pool.connect();

      // Token verification
      const authHeader = req.headers.authorization;
      if (!authHeader) {
        return res.status(401).json({ error: "No token provided" });
      }

      const token = authHeader.replace("Bearer ", "");
      jwt.verify(token, process.env.JWT_SECRET);

      // Direct query without rowMode
      const result = await client.query(
        "SELECT id, name, email, last_login, status, created_at FROM users"
      );

      return res.status(200).json(result.rows);
    } catch (error) {
      console.error("Error:", error.message);
      if (error.name === "JsonWebTokenError") {
        return res.status(401).json({ error: "Invalid token" });
      }
      return res.status(500).json({ error: "Server error" });
    } finally {
      if (client) {
        await client.release();
      }
    }
  }

  return res.status(405).json({ error: "Method not allowed" });
};
