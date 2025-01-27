/* eslint-disable react/prop-types */
import { useState, useEffect, useContext } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import "../../css/JobStatusIndicators/JobStatusIndicatorList.scss";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../../Components/AuthContext";

const JobStatusIndicatorList = () => {
  const [indicators, setIndicators] = useState([]);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [indicatorToDelete, setIndicatorToDelete] = useState(null);
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  const canPerformActions = user.role === "Editor" || user.role === "admin";

  useEffect(() => {
    fetchIndicators();
  }, []);

  const fetchIndicators = async () => {
    try {
      const response = await axios.get(
        `${import.meta.env.VITE_APP_ROUTE}/jobStatusIndicators`
      );
      setIndicators(response.data);
    } catch (error) {
      console.error("Error fetching job status indicators:", error);
    }
  };

  const handleDeleteClick = (indicator) => {
    setIndicatorToDelete(indicator);
    setShowDeleteConfirm(true);
  };

  const handleDeleteConfirm = async () => {
    try {
      // Delete the job status indicator
      await axios.delete(
        `${import.meta.env.VITE_APP_ROUTE}/jobStatusIndicators/${
          indicatorToDelete._id
        }`
      );

      // Log the delete action
      await axios.post(`${import.meta.env.VITE_APP_ROUTE}/logs/add`, {
        user: user.username,
        action: `Deleted Job Status Indicator: ${indicatorToDelete.name}`,
        previousData: indicatorToDelete,
        updatedData: null,
      });

      setShowDeleteConfirm(false);
      fetchIndicators(); // Refresh the list after deletion
    } catch (error) {
      console.error("Error deleting job status indicator:", error);
    }
  };

  const StylishCheckbox = ({ checked }) => (
    <div className={`stylish-checkbox ${checked ? "checked" : ""}`}>
      {checked && <span>✓</span>}
    </div>
  );

  return (
    <div className="job-status-indicator-list">
      <h1>Job Status Indicators</h1>
      {canPerformActions && (
        <Link to="/add-job-status-indicator" className="add-button">
          Add Job Status Indicator
        </Link>
      )}
      <table>
        <thead>
          <tr>
            <th>Status</th>
            <th>Color</th>
            <th>Default for New</th>
            <th>Consider for Pre-Prod</th>
            <th>Default for Auto Archive</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {indicators.map((indicator) => (
            <tr key={indicator._id}>
              <td>{indicator.name}</td>
              <td>
                <div
                  className="color-preview"
                  style={{ backgroundColor: indicator.color }}
                ></div>
              </td>
              <td>
                <StylishCheckbox checked={indicator.defaultForNew} />
              </td>
              <td>
                <StylishCheckbox checked={indicator.considerForPreProd} />
              </td>
              <td>
                <StylishCheckbox checked={indicator.defaultForAutoArchive} />
              </td>
              <td>
                {canPerformActions && (
                  <>
                    <button
                      onClick={() =>
                        navigate(`/edit-job-status-indicator/${indicator._id}`)
                      }
                      className="edit-button"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeleteClick(indicator)}
                      className="delete-button"
                    >
                      Delete
                    </button>
                  </>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {showDeleteConfirm && (
        <div className="delete-confirm-modal">
          <div className="modal-content">
            <p>Do you really want to delete {indicatorToDelete.name}?</p>
            <button
              className="confirm-delete-btn"
              onClick={handleDeleteConfirm}
            >
              Yes, Delete
            </button>
            <button
              className="cancel-delete-btn"
              onClick={() => setShowDeleteConfirm(false)}
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default JobStatusIndicatorList;
