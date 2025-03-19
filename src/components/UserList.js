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
} from "@mui/material";
import { Block, LockOpen, Delete } from "@mui/icons-material";
import axios from "axios";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";

const UserList = () => {
  const [users, setUsers] = useState([]);
  const [selected, setSelected] = useState([]);
  const navigate = useNavigate();

  const fetchUsers = async () => {
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
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleSelectAll = (event) => {
    if (event.target.checked) {
      setSelected(users.map((user) => user.id));
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
        await axios.delete("http://localhost:5000/api/users", {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
          data: { userIds: selected },
        });
      } else {
        await axios.post(
          "http://localhost:5000/api/users/status",
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
      <Toolbar>
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
        >
          <LockOpen />
        </IconButton>
        <IconButton
          onClick={() => handleAction("delete")}
          disabled={!selected.length}
        >
          <Delete />
        </IconButton>
      </Toolbar>
      <TableContainer>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell padding="checkbox">
                <Checkbox
                  onChange={handleSelectAll}
                  checked={selected.length === users.length}
                />
              </TableCell>
              <TableCell>Name</TableCell>
              <TableCell>Email</TableCell>
              <TableCell>Last Login</TableCell>
              <TableCell>Status</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {users.map((user) => (
              <TableRow key={user.id}>
                <TableCell padding="checkbox">
                  <Checkbox
                    checked={selected.indexOf(user.id) !== -1}
                    onChange={() => handleSelect(user.id)}
                  />
                </TableCell>
                <TableCell>{user.name}</TableCell>
                <TableCell>{user.email}</TableCell>
                <TableCell>
                  {new Date(user.last_login).toLocaleString()}
                </TableCell>
                <TableCell>{user.status}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Paper>
  );
};

export default UserList;
