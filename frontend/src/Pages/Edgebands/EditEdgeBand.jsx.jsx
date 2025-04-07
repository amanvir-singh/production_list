/* eslint-disable no-unused-vars */
import { useState, useEffect, useContext } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import "../../css/Edgebands/EdgebandForm.scss";
import { AuthContext } from "../../Components/AuthContext";
import ErrorModal from "../../Components/ErrorModal";

const EditEdgeband = () => {
  const [code, setCode] = useState("");
  const [backendError, setBackendError] = useState("");
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  const canEditEdgeband = user.role === "Editor" || user.role === "admin";

  useEffect(() => {
    fetchEdgeband();
  }, []);

  const fetchEdgeband = async () => {
    try {
      const response = await axios.get(
        `${import.meta.env.VITE_APP_ROUTE}/edgeband/${id}`
      );
      const { code } = response.data;
      setCode(code);
    } catch (error) {
      console.error("Error fetching edgeband:", error);
      setBackendError("Error fetching edgeband data. Please try again.");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const updatedEdgebandData = { code };

      // Fetch the original edgeband data
      const originalResponse = await axios.get(
        `${import.meta.env.VITE_APP_ROUTE}/edgeband/${id}`
      );
      const originalEdgebandData = originalResponse.data;

      // Update the edgeband
      await axios.put(
        `${import.meta.env.VITE_APP_ROUTE}/edgeband/${id}`,
        updatedEdgebandData
      );

      // Log the action
      await axios.post(`${import.meta.env.VITE_APP_ROUTE}/logs/add`, {
        user: user.username,
        action: `Edited Edgeband: ${originalEdgebandData.code}`,
        previousData: originalEdgebandData,
        updatedData: updatedEdgebandData,
      });

      navigate("/manage/EdgeBandList");
    } catch (error) {
      console.error("Error updating edgeband:", error);
      setBackendError(
        error.response?.data?.message ||
          "An error occurred while updating the edgeband."
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
      {canEditEdgeband ? (
        <div className="edgeband-form">
          <h1>Edit Edgeband</h1>
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
            <button type="submit">Update Edgeband</button>
          </form>
        </div>
      ) : (
        "You do not have permission to edit an Edgeband. Please contact an administrator for assistance."
      )}
    </div>
  );
};

export default EditEdgeband;
