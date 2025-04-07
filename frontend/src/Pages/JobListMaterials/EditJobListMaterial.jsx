/* eslint-disable no-unused-vars */
import { useState, useEffect, useContext } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import "../../css/JobListMaterials/JobListMaterialForm.scss";
import { AuthContext } from "../../Components/AuthContext";
import ErrorModal from "../../Components/ErrorModal";

const EditJobListMaterial = () => {
  const [code, setCode] = useState("");
  const [backendError, setBackendError] = useState("");
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  const canEditJobListMaterial =
    user.role === "Editor" || user.role === "admin";

  useEffect(() => {
    fetchJobListMaterial();
  }, []);

  const fetchJobListMaterial = async () => {
    try {
      const response = await axios.get(
        `${import.meta.env.VITE_APP_ROUTE}/joblistmaterial/${id}`
      );
      const { code } = response.data;
      setCode(code);
    } catch (error) {
      console.error("Error fetching job list material:", error);
      setBackendError(
        "Error fetching job list material data. Please try again."
      );
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const updatedJobListMaterialData = { code };

      // Fetch the original job list material data
      const originalResponse = await axios.get(
        `${import.meta.env.VITE_APP_ROUTE}/joblistmaterial/${id}`
      );
      const originalJobListMaterialData = originalResponse.data;

      // Update the job list material
      await axios.put(
        `${import.meta.env.VITE_APP_ROUTE}/joblistmaterial/${id}`,
        updatedJobListMaterialData
      );

      // Log the action
      await axios.post(`${import.meta.env.VITE_APP_ROUTE}/logs/add`, {
        user: user.username,
        action: `Edited Job List Material: ${originalJobListMaterialData.code}`,
        previousData: originalJobListMaterialData,
        updatedData: updatedJobListMaterialData,
      });

      navigate("/manage/JobListMaterialList");
    } catch (error) {
      console.error("Error updating job list material:", error);
      setBackendError(
        error.response?.data?.message ||
          "An error occurred while updating the job list material."
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
      {canEditJobListMaterial ? (
        <div className="joblistmaterial-form">
          <h1>Edit Job List Material</h1>
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
            <button type="submit">Update Job List Material</button>
          </form>
        </div>
      ) : (
        "You do not have permission to edit a Job List Material. Please contact an administrator for assistance."
      )}
    </div>
  );
};

export default EditJobListMaterial;
