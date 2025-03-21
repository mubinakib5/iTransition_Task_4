const API_URL =
  process.env.NODE_ENV === "production"
    ? "https://your-vercel-deployment-url/api"
    : "http://localhost:3000/api";

export default API_URL;
