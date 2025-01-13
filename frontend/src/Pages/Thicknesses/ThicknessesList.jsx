/* eslint-disable no-unused-vars */
import React, { useState, useEffect, useContext } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import "../../css/Thicknesses/ThicknessesList.scss";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../../Components/AuthContext";

const ThicknessesList = () => {
  const [thicknesses, setThicknesses] = useState([]);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [thicknessToDelete, setThicknessToDelete] = useState(null);
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  const canPerformActions =
    user.role === "Editor" ||
    user.role === "Manager" ||
    user.role === "Inventory Associate" ||
    user.role === "admin";

  useEffect(() => {
    fetchThicknesses();
  }, []);

  const fetchThicknesses = async () => {
    try {
      const response = await axios.get(
        `${import.meta.env.VITE_APP_ROUTE}/thicknesses`
      );
      setThicknesses(response.data);
    } catch (error) {
      console.error("Error fetching thicknesses:", error);
    }
  };

  const handleDeleteClick = (thickness) => {
    setThicknessToDelete(thickness);
    setShowDeleteConfirm(true);
  };

  const handleDeleteConfirm = async () => {
    try {
      await axios.delete(
        `${import.meta.env.VITE_APP_ROUTE}/thicknesses/${thicknessToDelete._id}`
      );
      setShowDeleteConfirm(false);
      fetchThicknesses(); // Refresh the list after deletion
    } catch (error) {
      console.error("Error deleting thickness:", error);
    }
  };

  return (
    <div className="thicknesses-list">
      <h1>Thicknesses</h1>
      {canPerformActions ? (
        <Link to="/add-thickness" className="add-button">
          Add Thickness
        </Link>
      ) : (
        <></>
      )}

      <table>
        <thead>
          <tr>
            <th>Name</th>
            <th>Code</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {thicknesses.map((thickness) => (
            <tr key={thickness._id}>
              <td>{thickness.name}</td>
              <td>{thickness.code}</td>
              <td>
                {canPerformActions ? (
                  <>
                    <button
                      onClick={() =>
                        navigate(`/edit-thickness/${thickness._id}`)
                      }
                      className="edit-button"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeleteClick(thickness)}
                      className="delete-button"
                    >
                      Delete
                    </button>
                  </>
                ) : (
                  "Elevation required to perform Actions"
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {showDeleteConfirm && (
        <div className="delete-confirm-modal">
          <div className="modal-content">
            <p>Do you really want to delete {thicknessToDelete.name}?</p>
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

export default ThicknessesList;
