/* eslint-disable no-unused-vars */
import React, { useState, useEffect, useContext } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import "../../css/Suppliers/SuppliersList.scss";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../../Components/AuthContext";

const SupplierList = () => {
  const [suppliers, setSuppliers] = useState([]);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [supplierToDelete, setSupplierToDelete] = useState(null);
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  const canPerformActions = user.role === "Editor" || user.role === "admin";

  useEffect(() => {
    fetchSuppliers();
  }, []);

  const fetchSuppliers = async () => {
    try {
      const response = await axios.get(
        `${import.meta.env.VITE_APP_ROUTE}/suppliers`
      );
      setSuppliers(response.data);
    } catch (error) {
      console.error("Error fetching suppliers:", error);
    }
  };

  const handleDeleteClick = (supplier) => {
    setSupplierToDelete(supplier);
    setShowDeleteConfirm(true);
  };

  const handleDeleteConfirm = async () => {
    try {
      await axios.delete(
        `${import.meta.env.VITE_APP_ROUTE}/suppliers/${supplierToDelete._id}`
      );
      setShowDeleteConfirm(false);
      fetchSuppliers(); // Refresh the list after deletion
    } catch (error) {
      console.error("Error deleting supplier:", error);
    }
  };

  return (
    <div className="supplier-list">
      <h1>Suppliers</h1>
      {canPerformActions ? (
        <Link to="/add-supplier" className="add-button">
          Add Supplier
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
          {suppliers.map((supplier) => (
            <tr key={supplier._id}>
              <td>{supplier.name}</td>
              <td>{supplier.code}</td>
              <td>
                {canPerformActions ? (
                  <>
                    <button
                      onClick={() => navigate(`/edit-supplier/${supplier._id}`)}
                      className="edit-button"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeleteClick(supplier)}
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
            <p>Do you really want to delete {supplierToDelete.name}?</p>
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

export default SupplierList;
