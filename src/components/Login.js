import React, { useState } from "react";
import { TextField, Button, Box, Typography, Link } from "@mui/material";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "react-toastify";
import API_URL from "../config";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post(`${API_URL}/login`, {
        email,
        password,
      });

      localStorage.setItem("token", response.data.token);
      navigate("/dashboard");
      toast.success("Login successful");
    } catch (err) {
      const errorMessage = err.response?.data?.error || "Login failed";
      toast.error(errorMessage);
      console.error("Login error:", err.response?.data);
    }
  };

  return (
    <Box sx={{ maxWidth: 400, mx: "auto", mt: 8, p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Sign in to The App
      </Typography>
      <form onSubmit={handleSubmit}>
        <TextField
          fullWidth
          label="Email"
          margin="normal"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <TextField
          fullWidth
          label="Password"
          type="password"
          margin="normal"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <Button fullWidth variant="contained" type="submit" sx={{ mt: 2 }}>
          Sign In
        </Button>
      </form>
      <Box sx={{ mt: 2, textAlign: "center" }}>
        <Link href="/register">Don't have an account? Sign up</Link>
      </Box>
    </Box>
  );
};

export default Login;
