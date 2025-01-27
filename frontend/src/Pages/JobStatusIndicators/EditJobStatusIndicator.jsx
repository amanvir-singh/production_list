import { useState, useEffect, useContext } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import "../../css/JobStatusIndicators/JobStatusIndicatorForm.scss";
import { AuthContext } from "../../Components/AuthContext";
import ErrorModal from "../../Components/ErrorModal";

const EditJobStatusIndicator = () => {
  const [name, setName] = useState("");
  const [color, setColor] = useState("#000000");
  const [defaultForNew, setDefaultForNew] = useState(false);
  const [considerForPreProd, setConsiderForPreProd] = useState(false);
  const [defaultForAutoArchive, setDefaultForAutoArchive] = useState(false);
  const [backendError, setBackendError] = useState("");
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  const canEditIndicator = user.role === "Editor" || user.role === "admin";

  useEffect(() => {
    fetchIndicator();
  }, []);

  const fetchIndicator = async () => {
    try {
      const response = await axios.get(
        `${import.meta.env.VITE_APP_ROUTE}/jobStatusIndicators/${id}`
      );
      const {
        name,
        color,
        defaultForNew,
        considerForPreProd,
        defaultForAutoArchive,
      } = response.data;
      setName(name);
      setColor(color);
      setDefaultForNew(defaultForNew);
      setConsiderForPreProd(considerForPreProd);
      setDefaultForAutoArchive(defaultForAutoArchive);
    } catch (error) {
      console.error("Error fetching job status indicator:", error);
      setBackendError(
        "Error fetching job status indicator data. Please try again."
      );
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // Fetch the original job status indicator data
      const originalResponse = await axios.get(
        `${import.meta.env.VITE_APP_ROUTE}/jobStatusIndicators/${id}`
      );
      const originalJobStatusIndicatorData = originalResponse.data;

      const updatedJobStatusIndicatorData = {
        name,
        color,
        defaultForNew,
        considerForPreProd,
        defaultForAutoArchive,
      };

      // Update the job status indicator
      await axios.put(
        `${import.meta.env.VITE_APP_ROUTE}/jobStatusIndicators/${id}`,
        updatedJobStatusIndicatorData
      );

      // Log the action
      await axios.post(`${import.meta.env.VITE_APP_ROUTE}/logs/add`, {
        user: user.username,
        action: `Edited Job Status Indicator: ${originalJobStatusIndicatorData.name}`,
        previousData: originalJobStatusIndicatorData,
        updatedData: updatedJobStatusIndicatorData,
      });

      navigate("/manage/jobStatusIndicatorsList");
    } catch (error) {
      console.error("Error updating job status indicator:", error);
      setBackendError(
        error.response?.data?.message ||
          "An error occurred while updating the job status indicator."
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
      {canEditIndicator ? (
        <div className="job-status-indicator-form">
          <h1>Edit Job Status Indicator</h1>
          <form onSubmit={handleSubmit}>
            <div>
              <label htmlFor="name">Status Name:</label>
              <input
                type="text"
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
            <div>
              <label htmlFor="color">Color:</label>
              <input
                type="color"
                id="color"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                required
              />
            </div>
            <div className="checkbox-group">
              <label>
                <input
                  type="checkbox"
                  checked={defaultForNew}
                  onChange={(e) => setDefaultForNew(e.target.checked)}
                />
                Default for New
              </label>
            </div>
            <div className="checkbox-group">
              <label>
                <input
                  type="checkbox"
                  checked={considerForPreProd}
                  onChange={(e) => setConsiderForPreProd(e.target.checked)}
                />
                Consider for Pre-Prod
              </label>
            </div>
            <div className="checkbox-group">
              <label>
                <input
                  type="checkbox"
                  checked={defaultForAutoArchive}
                  onChange={(e) => setDefaultForAutoArchive(e.target.checked)}
                />
                Default for Auto Archive
              </label>
            </div>
            <button type="submit">Update Job Status Indicator</button>
          </form>
        </div>
      ) : (
        "You do not have permission to edit a Job Status Indicator. Please contact an administrator for assistance."
      )}
    </div>
  );
};

export default EditJobStatusIndicator;
