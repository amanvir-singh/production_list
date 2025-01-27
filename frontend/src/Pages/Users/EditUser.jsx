/* eslint-disable no-unused-vars */
import React, { useContext, useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import "../../css/Users/UserForm.scss";
import { AuthContext } from "../../Components/AuthContext";
import ErrorModal from "../../Components/ErrorModal";

const EditUser = () => {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("Reader");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const navigate = useNavigate();
  const { id } = useParams();
  const { user } = useContext(AuthContext);
  const canEditUser = user.role === "admin";

  const [usernameError, setUsernameError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [confirmPasswordError, setConfirmPasswordError] = useState("");
  const [backendError, setBackendError] = useState("");

  useEffect(() => {
    if (canEditUser) {
      fetchUser();
    }
  }, [canEditUser]);

  const fetchUser = async () => {
    try {
      const response = await axios.get(
        `${import.meta.env.VITE_APP_ROUTE}/users/${id}`
      );
      const { username, email, role } = response.data;
      setUsername(username);
      setEmail(email);
      setRole(role);
    } catch (error) {
      console.error("Error fetching user:", error);
      setBackendError("Error fetching user data. Please try again.");
    }
  };

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

    if (password) {
      if (password.length < 4) {
        setPasswordError("Password must be at least 4 characters long.");
        isValid = false;
      }

      if (password !== confirmPassword) {
        setConfirmPasswordError("Passwords do not match!");
        isValid = false;
      }
    }

    return isValid;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      // Fetch the original user data before updating
      const originalResponse = await axios.get(
        `${import.meta.env.VITE_APP_ROUTE}/users/${id}`
      );
      const originalUserData = originalResponse.data;

      const userData = { username, email, role };
      if (password) {
        userData.password = password; // Include password only if it's provided
      }

      // Update the user
      await axios.put(
        `${import.meta.env.VITE_APP_ROUTE}/users/${id}`,
        userData
      );

      // Log the action (without password)
      await axios.post(`${import.meta.env.VITE_APP_ROUTE}/logs/add`, {
        user: user.username,
        action: `Edited User: ${username} (${role})`,
        previousData: {
          username: originalUserData.username,
          email: originalUserData.email,
          role: originalUserData.role,
        }, // Log original values
        updatedData: { username, email, role }, // Log updated data without password
      });

      navigate("/manage/usersList");
    } catch (error) {
      console.error("Error updating user:", error);
      setBackendError(
        error.response?.data?.message ||
          "An error occurred while updating the user."
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
      <h1>Edit User</h1>
      {canEditUser ? (
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
          <div className="form-group">
            <label htmlFor="password">
              New Password (leave blank to keep current):
            </label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            {passwordError && <p className="error-message">{passwordError}</p>}
          </div>
          <div className="form-group">
            <label htmlFor="confirm-password">Confirm New Password:</label>
            <input
              type="password"
              id="confirm-password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
            {confirmPasswordError && (
              <p className="error-message">{confirmPasswordError}</p>
            )}
          </div>
          <button type="submit">Update User</button>
        </form>
      ) : (
        "You do not have permission to edit users. Only administrators can perform this action."
      )}
    </div>
  );
};

export default EditUser;
