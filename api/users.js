const { Pool } = require("pg");
const jwt = require("jsonwebtoken");

// Initialize pool outside of the handler
let pool;
try {
  pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
      rejectUnauthorized: false,
    },
  });
} catch (error) {
  console.error("Pool initialization error:", error);
}

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
      // Verify token first
      const authHeader = req.headers.authorization;
      if (!authHeader) {
        return res.status(401).json({ error: "No token provided" });
      }

      const token = authHeader.replace("Bearer ", "");
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Get client from pool
      client = await pool.connect();

      // Simple query to get users
      const result = await client.query(`
        SELECT 
          id, 
          name, 
          email, 
          COALESCE(last_login, created_at) as last_login, 
          COALESCE(status, 'active') as status, 
          created_at 
        FROM users 
        ORDER BY created_at DESC
      `);

      return res.status(200).json(result.rows);
    } catch (error) {
      console.error("Operation error:", error);

      if (error.name === "JsonWebTokenError") {
        return res.status(401).json({ error: "Invalid token" });
      }

      return res.status(500).json({
        error: "Server error",
        message:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    } finally {
      if (client) {
        await client.release();
      }
    }
  }

  return res.status(405).json({ error: "Method not allowed" });
};
