/* eslint-disable no-unused-vars */
import React, { useContext, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "../../css/Suppliers/SupplierForm.scss";
import { AuthContext } from "../../Components/AuthContext";
import ErrorModal from "../../Components/ErrorModal";

const AddSupplier = () => {
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [backendError, setBackendError] = useState("");
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  const canAddSupplier =
    user.role === "Editor" ||
    user.role === "Manager" ||
    user.role === "Inventory Associate" ||
    user.role === "admin";

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const supplierData = { name, code };

      // Add the supplier
      const response = await axios.post(
        `${import.meta.env.VITE_APP_ROUTE}/suppliers/add`,
        supplierData
      );

      // Log the action
      await axios.post(`${import.meta.env.VITE_APP_ROUTE}/logs/add`, {
        user: user.username,
        action: `Added Supplier: ${name} (${code})`,
        updatedData: supplierData,
      });

      navigate("/manage/suppliersList");
    } catch (error) {
      console.error("Error adding supplier:", error);
      setBackendError(
        error.response?.data?.message ||
          "An error occurred while adding the supplier."
      );
    }
  };

  return (
    <div>
      <ErrorModal
        message={backendError}
        onClose={() => setBackendError("")}
        show={!!backendError}
      />
      <div className="supplier-form">
        <h1>Add Supplier</h1>
        {canAddSupplier ? (
          <form onSubmit={handleSubmit}>
            <div>
              <label htmlFor="name">Name:</label>
              <input
                type="text"
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
            <div>
              <label htmlFor="code">Code:</label>
              <input
                type="text"
                id="code"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                required
              />
            </div>
            <button type="submit">Add Supplier</button>
          </form>
        ) : (
          "You do not have permission to add a Supplier. Please contact an administrator for assistance."
        )}
      </div>
    </div>
  );
};

export default AddSupplier;
