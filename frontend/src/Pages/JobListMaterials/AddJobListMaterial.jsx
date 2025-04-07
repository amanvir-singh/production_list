/* eslint-disable no-unused-vars */
import React, { useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "../../css/JobListMaterials/JobListMaterialForm.scss";
import { AuthContext } from "../../Components/AuthContext";
import ErrorModal from "../../Components/ErrorModal";

const AddJobListMaterial = () => {
  const [code, setCode] = useState("");
  const [backendError, setBackendError] = useState("");
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const jobListMaterialData = { code };
      // Add the JobListMaterial
      const response = await axios.post(
        `${import.meta.env.VITE_APP_ROUTE}/joblistmaterial/add`,
        jobListMaterialData
      );

      // Log the action
      await axios.post(`${import.meta.env.VITE_APP_ROUTE}/logs/add`, {
        user: user.username,
        action: `Added JobListMaterial: ${code}`,
        updatedData: jobListMaterialData,
      });

      navigate("/manage/jobListMaterialList");
    } catch (error) {
      console.error("Error adding JobListMaterial:", error);
      setBackendError(
        error.response?.data?.message ||
          "An error occurred while adding the JobListMaterial."
      );
    }
  };

  const canAddJobListMaterial = user.role === "Editor" || user.role === "admin";

  return (
    <div>
      <ErrorModal
        message={backendError}
        onClose={() => setBackendError("")}
        show={!!backendError}
      />
      <div className="joblistmaterial-form">
        <h1>Add JobList Material</h1>
        {canAddJobListMaterial ? (
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
            <button type="submit">Add JobList Material</button>
          </form>
        ) : (
          "You do not have permission to add a JobList Material. Please contact an administrator for assistance."
        )}
      </div>
    </div>
  );
};

export default AddJobListMaterial;
