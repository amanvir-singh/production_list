import { useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "../../css/JobStatusIndicators/JobStatusIndicatorForm.scss";
import { AuthContext } from "../../Components/AuthContext";
import ErrorModal from "../../Components/ErrorModal";

const AddJobStatusIndicator = () => {
  const [name, setName] = useState("");
  const [color, setColor] = useState("#000000");
  const [backendError, setBackendError] = useState("");
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  const canAddIndicator =
    user.role === "Editor" ||
    user.role === "Manager" ||
    user.role === "Inventory Associate" ||
    user.role === "admin";

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post(
        `${import.meta.env.VITE_APP_ROUTE}/jobStatusIndicators/add`,
        {
          name,
          color,
        }
      );
      navigate("/manage/jobStatusIndicatorsList");
    } catch (error) {
      console.error("Error adding job status indicator:", error);
      setBackendError(
        error.response?.data?.message ||
          "An error occurred while adding the job status indicator."
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
      <div className="job-status-indicator-form">
        <h1>Add Job Status Indicator</h1>
        {canAddIndicator ? (
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
            <button type="submit">Add Job Status Indicator</button>
          </form>
        ) : (
          "You do not have permission to add a Job Status Indicator. Please contact an administrator for assistance."
        )}
      </div>
    </div>
  );
};

export default AddJobStatusIndicator;
