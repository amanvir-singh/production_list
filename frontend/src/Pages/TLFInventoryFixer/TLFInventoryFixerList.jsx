/* eslint-disable no-unused-vars */
import React, { useState, useEffect, useContext } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import "../../css/TLFInventoryFixer/TLFInventoryFixerList.scss";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../../Components/AuthContext";

const TLFInventoryFixerList = () => {
  const [inventoryFixers, setInventoryFixers] = useState([]);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [inventoryFixerToDelete, setInventoryFixerToDelete] = useState(null);
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  const canPerformActions = user.role === "Editor" || user.role === "admin";

  useEffect(() => {
    fetchInventoryFixers();
  }, []);

  const fetchInventoryFixers = async () => {
    try {
      const response = await axios.get(
        `${import.meta.env.VITE_APP_ROUTE}/tlfinventoryfixer`
      );
      setInventoryFixers(response.data);
    } catch (error) {
      console.error("Error fetching inventory fixers:", error);
    }
  };

  const handleDeleteClick = (inventoryFixer) => {
    setInventoryFixerToDelete(inventoryFixer);
    setShowDeleteConfirm(true);
  };

  const handleDeleteConfirm = async () => {
    try {
      // Delete the inventory fixer
      await axios.delete(
        `${import.meta.env.VITE_APP_ROUTE}/tlfinventoryfixer/${
          inventoryFixerToDelete._id
        }`
      );

      // Log the delete action
      await axios.post(`${import.meta.env.VITE_APP_ROUTE}/logs/add`, {
        user: user.username,
        action: `Deleted Inventory Fixer: ${inventoryFixerToDelete.BoardCode}`,
        previousData: inventoryFixerToDelete,
        updatedData: null,
      });

      setShowDeleteConfirm(false);
      fetchInventoryFixers(); // Refresh the list after deletion
    } catch (error) {
      console.error("Error deleting inventory fixer:", error);
    }
  };

  return (
    <div className="tlf-inventory-fixer-list">
      <h1>TLF Inventory Fixers</h1>
      {canPerformActions ? (
        <Link to="/add-tlf-inventory-fixer" className="add-button">
          Add Inventory Fixer
        </Link>
      ) : null}
      <table>
        <thead>
          <tr>
            <th>Board Code</th>
            <th>Quantity to Fix</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {inventoryFixers.map((inventoryFixer) => (
            <tr key={inventoryFixer._id}>
              <td>{inventoryFixer.BoardCode}</td>
              <td>{inventoryFixer.QtytoFix}</td>
              <td>
                {canPerformActions ? (
                  <>
                    <button
                      onClick={() =>
                        navigate(
                          `/edit-tlf-inventory-fixer/${inventoryFixer._id}`
                        )
                      }
                      className="edit-button"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeleteClick(inventoryFixer)}
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
            <p>
              Do you really want to delete {inventoryFixerToDelete.BoardCode}?
            </p>
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

export default TLFInventoryFixerList;
