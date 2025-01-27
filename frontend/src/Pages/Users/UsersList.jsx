/* eslint-disable no-unused-vars */
import React, { useState, useEffect, useContext } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import "../../css/Users/UsersList.scss";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../../Components/AuthContext";

const UsersList = () => {
  const [users, setUsers] = useState([]);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  const canPerformActions = user.role === "admin";

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await axios.get(
        `${import.meta.env.VITE_APP_ROUTE}/users`
      );
      setUsers(response.data);
    } catch (error) {
      console.error("Error fetching users:", error);
    }
  };

  const handleDeleteClick = (user) => {
    setUserToDelete(user);
    setShowDeleteConfirm(true);
  };

  const handleDeleteConfirm = async () => {
    try {
      // Delete the user
      await axios.delete(
        `${import.meta.env.VITE_APP_ROUTE}/users/${userToDelete._id}`
      );

      // Log the delete action
      await axios.post(`${import.meta.env.VITE_APP_ROUTE}/logs/add`, {
        user: user.username,
        action: `Deleted User: ${userToDelete.username} (${userToDelete.role})`,
        previousData: {
          username: userToDelete.username,
          email: userToDelete.email,
          role: userToDelete.role,
        },
        updatedData: null,
      });

      setShowDeleteConfirm(false);
      fetchUsers(); // Refresh the list after deletion
    } catch (error) {
      console.error("Error deleting user:", error);
    }
  };
  return (
    <div className="users-list">
      <h1>Users</h1>
      {canPerformActions && (
        <Link to="/add-user" className="add-button">
          Add User
        </Link>
      )}
      <table>
        <thead>
          <tr>
            <th>Username</th>
            <th>Email</th>
            <th>Role</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {users.map((user) => (
            <tr key={user._id}>
              <td>{user.username}</td>
              <td>{user.email}</td>
              <td>{user.role}</td>
              <td>
                {canPerformActions ? (
                  <>
                    <button
                      onClick={() => navigate(`/edit-user/${user._id}`)}
                      className="edit-button"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeleteClick(user)}
                      className="delete-button"
                    >
                      Delete
                    </button>
                  </>
                ) : (
                  "Admin access required to perform actions"
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {showDeleteConfirm && (
        <div className="delete-confirm-modal">
          <div className="modal-content">
            <p>Do you really want to delete user {userToDelete.username}?</p>
            <button
              className="confirm-delete-btn"
              onClick={handleDeleteConfirm}
            >
              Yes, Delete
            </button>
            <button
              className="cancel-delete-btn"
              onClick={() => setShowDeleteConfirm(false)}
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default UsersList;
