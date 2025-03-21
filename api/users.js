const { Pool } = require("pg");
const jwt = require("jsonwebtoken");

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
    require: true,
  },
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// Add connection test
pool.on("error", (err) => {
  console.error("Unexpected error on idle client", err);
  process.exit(-1);
});

// Test the connection
pool.connect((err, client, done) => {
  if (err) {
    console.error("Error connecting to the database:", err);
  } else {
    console.log("Successfully connected to database");
    done();
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
    try {
      // Verify token
      const authHeader = req.headers.authorization;
      if (!authHeader) {
        return res.status(401).json({ error: "No token provided" });
      }

      const token = authHeader.replace("Bearer ", "");

      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        if (!decoded) {
          return res.status(401).json({ error: "Invalid token" });
        }
      } catch (tokenError) {
        console.error("Token verification error:", tokenError);
        return res.status(401).json({ error: "Invalid token" });
      }

      // Fetch users
      try {
        const result = await pool.query(
          "SELECT id, name, email, last_login, status, created_at FROM users"
        );
        return res.status(200).json(result.rows);
      } catch (dbError) {
        console.error("Database error:", dbError);
        return res.status(500).json({
          error: "Database error",
          details:
            process.env.NODE_ENV === "development"
              ? dbError.message
              : undefined,
        });
      }
    } catch (error) {
      console.error("General error:", error);
      return res.status(500).json({
        error: "Server error",
        details:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  }

  return res.status(405).json({ error: "Method not allowed" });
};
