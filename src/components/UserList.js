import React, { useState, useEffect } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Checkbox,
  Paper,
  Toolbar,
  Button,
  IconButton,
  Typography,
  TextField,
  MenuItem,
  Box,
} from "@mui/material";
import {
  Block,
  LockOpen,
  Delete,
  CheckCircle,
  Cancel,
} from "@mui/icons-material";
import axios from "axios";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import { useCallback } from "react";
import API_URL from "../config";

const UserList = () => {
  const [users, setUsers] = useState([]);
  const [selected, setSelected] = useState([]);
  const [filter, setFilter] = useState("all");
  const navigate = useNavigate();

  const fetchUsers = useCallback(async () => {
    try {
      const response = await axios.get("http://localhost:5000/api/users", {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      setUsers(response.data);
    } catch (err) {
      if (err.response?.status === 401) {
        navigate("/login");
      }
      toast.error("Failed to fetch users");
    }
  }, [navigate]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const filteredUsers = users.filter((user) => {
    if (filter === "all") return true;
    return user.status === filter;
  });

  const handleSelectAll = (event) => {
    if (event.target.checked) {
      setSelected(filteredUsers.map((user) => user.id));
    } else {
      setSelected([]);
    }
  };

  const handleSelect = (id) => {
    const selectedIndex = selected.indexOf(id);
    let newSelected = [];

    if (selectedIndex === -1) {
      newSelected = newSelected.concat(selected, id);
    } else {
      newSelected = newSelected.concat(
        selected.slice(0, selectedIndex),
        selected.slice(selectedIndex + 1)
      );
    }

    setSelected(newSelected);
  };

  const handleAction = async (action) => {
    try {
      if (action === "delete") {
        await axios.delete(`${API_URL}/users`, {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
          data: { userIds: selected },
        });
      } else {
        await axios.post(
          `${API_URL}/users/status`,
          {
            userIds: selected,
            status: action === "block" ? "blocked" : "active",
          },
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          }
        );
      }
      fetchUsers();
      setSelected([]);
      toast.success(`Users ${action}ed successfully`);
    } catch (err) {
      toast.error(`Failed to ${action} users`);
    }
  };

  return (
    <Paper sx={{ width: "100%", mb: 2 }}>
      <Toolbar sx={{ display: "flex", justifyContent: "space-between" }}>
        <Box sx={{ display: "flex", gap: 1 }}>
          <Button
            variant="contained"
            color="primary"
            onClick={() => handleAction("block")}
            disabled={!selected.length}
            startIcon={<Block />}
          >
            Block
          </Button>
          <IconButton
            onClick={() => handleAction("unblock")}
            disabled={!selected.length}
            title="Unblock"
          >
            <LockOpen />
          </IconButton>
          <IconButton
            onClick={() => handleAction("delete")}
            disabled={!selected.length}
            title="Delete"
          >
            <Delete />
          </IconButton>
        </Box>
        <TextField
          select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          sx={{ width: 200 }}
          size="small"
        >
          <MenuItem value="all">All Users</MenuItem>
          <MenuItem value="active">Active</MenuItem>
          <MenuItem value="blocked">Blocked</MenuItem>
        </TextField>
      </Toolbar>
      <TableContainer>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell padding="checkbox">
                <Checkbox
                  onChange={handleSelectAll}
                  checked={selected.length === filteredUsers.length}
                />
              </TableCell>
              <TableCell>Name</TableCell>
              <TableCell>Email</TableCell>
              <TableCell>Last Login</TableCell>
              <TableCell>Status</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredUsers.map((user) => (
              <TableRow
                key={user.id}
                sx={{
                  opacity: user.status === "blocked" ? 0.6 : 1,
                }}
              >
                <TableCell padding="checkbox">
                  <Checkbox
                    checked={selected.indexOf(user.id) !== -1}
                    onChange={() => handleSelect(user.id)}
                  />
                </TableCell>
                <TableCell>
                  <Typography
                    sx={{
                      textDecoration:
                        user.status === "blocked" ? "line-through" : "none",
                    }}
                  >
                    {user.name}
                  </Typography>
                </TableCell>
                <TableCell
                  sx={{
                    textDecoration:
                      user.status === "blocked" ? "line-through" : "none",
                  }}
                >
                  {user.email}
                </TableCell>
                <TableCell>
                  {new Date(user.last_login).toLocaleString()}
                </TableCell>
                <TableCell>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    {user.status === "active" ? (
                      <CheckCircle color="success" />
                    ) : (
                      <Cancel color="error" />
                    )}
                    <Typography
                      sx={{
                        color:
                          user.status === "active"
                            ? "success.main"
                            : "error.main",
                        textTransform: "capitalize",
                      }}
                    >
                      {user.status}
                    </Typography>
                  </Box>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Paper>
  );
};

export default UserList;
