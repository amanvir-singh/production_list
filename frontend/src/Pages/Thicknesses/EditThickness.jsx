/* eslint-disable no-unused-vars */
import React, { useState, useEffect, useContext } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import "../../css/Thicknesses/ThicknessForm.scss";
import { AuthContext } from "../../Components/AuthContext";
import ErrorModal from "../../Components/ErrorModal";

const EditThickness = () => {
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [backendError, setBackendError] = useState("");
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  const canEditThickness =
    user.role === "Editor" ||
    user.role === "Manager" ||
    user.role === "Inventory Associate" ||
    user.role === "admin";

  useEffect(() => {
    fetchThickness();
  }, []);

  const fetchThickness = async () => {
    try {
      const response = await axios.get(
        `${import.meta.env.VITE_APP_ROUTE}/thicknesses/${id}`
      );
      const { name, code } = response.data;
      setName(name);
      setCode(code);
    } catch (error) {
      console.error("Error fetching thickness:", error);
      setBackendError("Error fetching thickness data. Please try again.");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // Fetch the original thickness data
      const originalResponse = await axios.get(
        `${import.meta.env.VITE_APP_ROUTE}/thicknesses/${id}`
      );
      const originalThicknessData = originalResponse.data;

      // Update the thickness
      await axios.put(`${import.meta.env.VITE_APP_ROUTE}/thicknesses/${id}`, {
        name,
        code,
      });

      // Log the action
      await axios.post(`${import.meta.env.VITE_APP_ROUTE}/logs/add`, {
        user: user.username,
        action: `Edited Thickness: ${originalThicknessData.name} (${originalThicknessData.code})`,
        previousData: originalThicknessData,
        updatedData: { name, code },
      });

      navigate("/manage/thicknessesList");
    } catch (error) {
      console.error("Error updating thickness:", error);
      setBackendError(
        error.response?.data?.message ||
          "An error occurred while updating the thickness."
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
      {canEditThickness ? (
        <div className="thickness-form">
          <h1>Edit Thickness</h1>
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
            <button type="submit">Update Thickness</button>
          </form>
        </div>
      ) : (
        "You do not have permission to edit a Thickness. Please contact an administrator for assistance."
      )}
    </div>
  );
};

export default EditThickness;
