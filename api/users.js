const { Pool } = require("pg");
const jwt = require("jsonwebtoken");

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
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
        // Simplified query with error handling
        const result = await client.query({
          text: 'SELECT id, name, email, last_login, status, created_at FROM users ORDER BY created_at DESC',
          rowMode: 'array'
        });

        // Log the result for debugging
        console.log('Query executed successfully');
        console.log('Number of rows:', result.rowCount);

        return res.status(200).json(result.rows);
      } catch (error) {
        console.error('Error details:', {
          message: error.message,
          code: error.code,
          stack: error.stack
        });
        
        return res.status(500).json({
          error: "Database error",
          message: error.message,
          code: error.code
        });
      } finally {
        if (client) {
          await client.release();
        }
      }
    }

    return res.status(405).json({ error: "Method not allowed" });
};
