const { Pool } = require("pg");
const jwt = require("jsonwebtoken");

// Create a new pool with specific SSL configuration for Neon
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
    require: true,
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
      // Test database connection first
      client = await pool.connect();
      console.log("Database connected successfully");

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

      // Test if the users table exists
      const tableCheck = await client.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public'
          AND table_name = 'users'
        );
      `);

      if (!tableCheck.rows[0].exists) {
        console.error("Users table does not exist");
        return res
          .status(500)
          .json({ error: "Database schema not initialized" });
      }

      // Fetch users with error logging
      try {
        const result = await client.query(
          "SELECT id, name, email, last_login, status, created_at FROM users"
        );
        console.log(`Successfully fetched ${result.rows.length} users`);
        return res.status(200).json(result.rows);
      } catch (queryError) {
        console.error("Query error:", queryError);
        return res.status(500).json({
          error: "Query error",
          details: queryError.message,
        });
      }
    } catch (error) {
      console.error("Connection error:", error);
      return res.status(500).json({
        error: "Database connection error",
        details: error.message,
      });
    } finally {
      if (client) {
        client.release();
      }
    }
  }

  return res.status(405).json({ error: "Method not allowed" });
};
