/* eslint-disable no-unused-vars */
import React, { useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "../../css/Edgebands/EdgebandForm.scss";
import { AuthContext } from "../../Components/AuthContext";
import ErrorModal from "../../Components/ErrorModal";

const AddEdgeband = () => {
  const [code, setCode] = useState("");
  const [backendError, setBackendError] = useState("");
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const edgebandData = { code };
      // Add the edgeband
      const response = await axios.post(
        `${import.meta.env.VITE_APP_ROUTE}/edgeband/add`,
        edgebandData
      );

      // Log the action
      await axios.post(`${import.meta.env.VITE_APP_ROUTE}/logs/add`, {
        user: user.username,
        action: `Added Edgeband: ${code}`,
        updatedData: edgebandData,
      });

      navigate("/manage/EdgeBandList");
    } catch (error) {
      console.error("Error adding edgeband:", error);
      setBackendError(
        error.response?.data?.message ||
          "An error occurred while adding the edgeband."
      );
    }
  };

  const canAddEdgeband = user.role === "Editor" || user.role === "admin";

  return (
    <div>
      <ErrorModal
        message={backendError}
        onClose={() => setBackendError("")}
        show={!!backendError}
      />
      <div className="edgeband-form">
        <h1>Add Edgeband</h1>
        {canAddEdgeband ? (
          <form onSubmit={handleSubmit}>
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
            <button type="submit">Add Edgeband</button>
          </form>
        ) : (
          "You do not have permission to add an Edgeband. Please contact an administrator for assistance."
        )}
      </div>
    </div>
  );
};

export default AddEdgeband;
