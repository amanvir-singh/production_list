/* eslint-disable no-unused-vars */
import React, { useContext, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "../../css/Users/UserForm.scss";
import { AuthContext } from "../../Components/AuthContext";
import ErrorModal from "../../Components/ErrorModal";

const AddUser = () => {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [role, setRole] = useState("Reader");
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  const canAddUser = user.role === "admin";

  const [usernameError, setUsernameError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [confirmPasswordError, setConfirmPasswordError] = useState("");
  const [backendError, setBackendError] = useState("");

  const validateForm = () => {
    let isValid = true;

    setUsernameError("");
    setPasswordError("");
    setConfirmPasswordError("");

    if (username.length < 3 || username.includes("@")) {
      setUsernameError(
        "Username must be at least 3 characters and should not contain '@'."
      );
      isValid = false;
    }

    if (password.length < 4) {
      setPasswordError("Password must be at least 4 characters long.");
      isValid = false;
    }

    if (password !== confirmPassword) {
      setConfirmPasswordError("Passwords do not match!");
      isValid = false;
    }

    return isValid;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      await axios.post(`${import.meta.env.VITE_APP_ROUTE}/users/add`, {
        username,
        email,
        password,
        role,
      });
      navigate("/manage/usersList");
    } catch (error) {
      console.error("Error adding user:", error);
      setBackendError(
        error.response?.data?.message ||
          "An error occurred while adding the user."
      );
    }
  };

  return (
    <div className="user-form">
      <ErrorModal
        message={backendError}
        onClose={() => setBackendError("")}
        show={!!backendError}
      />
      <h1>Add User</h1>
      {canAddUser ? (
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="username">Username:</label>
            <input
              type="text"
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
            {usernameError && <p className="error-message">{usernameError}</p>}
          </div>
          <div className="form-group">
            <label htmlFor="email">Email:</label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="password">Password:</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            {passwordError && <p className="error-message">{passwordError}</p>}
          </div>
          <div className="form-group">
            <label htmlFor="confirm-password">Confirm Password:</label>
            <input
              type="password"
              id="confirm-password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
            {confirmPasswordError && (
              <p className="error-message">{confirmPasswordError}</p>
            )}
          </div>
          <div className="form-group">
            <label htmlFor="role">Role:</label>
            <select
              id="role"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              required
            >
              <option value="Reader">Reader</option>
              <option value="Inventory Associate">Inventory Associate</option>
              <option value="Editor">Editor</option>
              <option value="Manager">Manager</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          <button type="submit">Add User</button>
        </form>
      ) : (
        "You do not have permission to add a User. Only administrators can perform this action."
      )}
    </div>
  );
};

export default AddUser;
