/* eslint-disable no-unused-vars */
import React, { useContext, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "../../css/Thicknesses/ThicknessForm.scss";
import { AuthContext } from "../../Components/AuthContext";
import ErrorModal from "../../Components/ErrorModal";

const AddThickness = () => {
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [backendError, setBackendError] = useState("");
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  const canAddThickness =
    user.role === "Editor" ||
    user.role === "Manager" ||
    user.role === "Inventory Associate" ||
    user.role === "admin";

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const thicknessData = { name, code };

      // Add the thickness
      const response = await axios.post(
        `${import.meta.env.VITE_APP_ROUTE}/thicknesses/add`,
        thicknessData
      );

      // Log the action
      await axios.post(`${import.meta.env.VITE_APP_ROUTE}/logs/add`, {
        user: user.username,
        action: `Added Thickness: ${name} (${code})`,
        updatedData: thicknessData,
      });

      navigate("/manage/thicknessesList");
    } catch (error) {
      console.error("Error adding thickness:", error);
      setBackendError(
        error.response?.data?.message ||
          "An error occurred while adding the thickness."
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
      <div className="thickness-form">
        <h1>Add Thickness</h1>
        {canAddThickness ? (
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
            <button type="submit">Add Thickness</button>
          </form>
        ) : (
          "You do not have permission to add a Thickness. Please contact an administrator for assistance."
        )}
      </div>
    </div>
  );
};

export default AddThickness;
