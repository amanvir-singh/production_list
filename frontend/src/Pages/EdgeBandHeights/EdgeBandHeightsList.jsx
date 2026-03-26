import { useState, useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { AuthContext } from "../../Components/AuthContext";
import "../../css/EdgeBandHeights/EdgeBandHeightsForm.scss";

const EdgeBandHeightsList = () => {
  const [heights, setHeights] = useState([]);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [heightToDelete, setHeightToDelete] = useState(null);
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  const canPerformActions = user.role === "Editor" || user.role === "admin";

  useEffect(() => {
    fetchHeights();
  }, []);

  const fetchHeights = async () => {
    try {
      const response = await axios.get(
        `${import.meta.env.VITE_APP_ROUTE}/edgeBandHeight`
      );
      setHeights(response.data);
    } catch (error) {
      console.error("Error fetching edgeband heights:", error);
    }
  };

  const handleDeleteClick = (height) => {
    setHeightToDelete(height);
    setShowDeleteConfirm(true);
  };

  const handleDeleteConfirm = async () => {
    try {
      await axios.delete(
        `${import.meta.env.VITE_APP_ROUTE}/edgeBandHeight/${heightToDelete._id}`
      );
      await axios.post(`${import.meta.env.VITE_APP_ROUTE}/edgeBandLog/add`, {
        user: user.username,
        action: `Deleted Edgeband Height: ${heightToDelete.name} (${heightToDelete.code})`,
        previousData: heightToDelete,
        updatedData: null,
      });
      setShowDeleteConfirm(false);
      fetchHeights();
    } catch (error) {
      console.error("Error deleting edgeband height:", error);
    }
  };

  return (
    <div className="eb-form-page">
      <h1>Edgeband Heights</h1>
      {canPerformActions && (
        <button
          className="eb-form-page__add-btn"
          onClick={() => navigate("/add-edgeband-height")}
        >
          Add Height
        </button>
      )}

      <table className="eb-form-page__table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Code</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {heights.map((h) => (
            <tr key={h._id}>
              <td>{h.name}</td>
              <td>{h.code}</td>
              <td>
                {canPerformActions ? (
                  <>
                    <button
                      className="edit-button"
                      onClick={() => navigate(`/edit-edgeband-height/${h._id}`)}
                    >
                      Edit
                    </button>
                    <button
                      className="delete-button"
                      onClick={() => handleDeleteClick(h)}
                    >
                      Delete
                    </button>
                  </>
                ) : (
                  "Elevation required to perform Actions"
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {showDeleteConfirm && (
        <div className="delete-confirm-modal">
          <div className="modal-content">
            <p>Do you really want to delete {heightToDelete.name}?</p>
            <button className="confirm-delete-btn" onClick={handleDeleteConfirm}>
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

export default EdgeBandHeightsList;
