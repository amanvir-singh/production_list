/* eslint-disable no-unused-vars */
import React, { useState, useEffect, useContext } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import "../../css/Suppliers/SupplierForm.scss";
import { AuthContext } from "../../Components/AuthContext";
import ErrorModal from "../../Components/ErrorModal";

const EditSupplier = () => {
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [backendError, setBackendError] = useState("");
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  const canEditSupplier =
    user.role === "Editor" ||
    user.role === "Manager" ||
    user.role === "Inventory Associate" ||
    user.role === "admin";

  useEffect(() => {
    fetchSupplier();
  }, []);

  const fetchSupplier = async () => {
    try {
      const response = await axios.get(
        `${import.meta.env.VITE_APP_ROUTE}/suppliers/${id}`
      );
      const { name, code } = response.data;
      setName(name);
      setCode(code);
    } catch (error) {
      console.error("Error fetching supplier:", error);
      setBackendError("Error fetching supplier data. Please try again.");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const updatedSupplierData = { name, code };

      // Fetch the original supplier data
      const originalResponse = await axios.get(
        `${import.meta.env.VITE_APP_ROUTE}/suppliers/${id}`
      );
      const originalSupplierData = originalResponse.data;

      // Update the supplier
      await axios.put(
        `${import.meta.env.VITE_APP_ROUTE}/suppliers/${id}`,
        updatedSupplierData
      );

      // Log the action
      await axios.post(`${import.meta.env.VITE_APP_ROUTE}/logs/add`, {
        user: user.username,
        action: `Edited Supplier: ${originalSupplierData.name} (${originalSupplierData.code})`,
        previousData: originalSupplierData,
        updatedData: updatedSupplierData,
      });

      navigate("/manage/suppliersList");
    } catch (error) {
      console.error("Error updating supplier:", error);
      setBackendError(
        error.response?.data?.message ||
          "An error occurred while updating the supplier."
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
      {canEditSupplier ? (
        <div className="supplier-form">
          <h1>Edit Supplier</h1>
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
            <button type="submit">Update Supplier</button>
          </form>
        </div>
      ) : (
        "You do not have permission to edit a Supplier. Please contact an administrator for assistance."
      )}
    </div>
  );
};

export default EditSupplier;
