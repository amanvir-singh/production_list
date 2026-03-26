import { useState, useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { AuthContext } from "../../Components/AuthContext";
import "../../css/EdgeBandThicknesses/EdgeBandThicknessesForm.scss";

const EdgeBandThicknessesList = () => {
  const [thicknesses, setThicknesses] = useState([]);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [thicknessToDelete, setThicknessToDelete] = useState(null);
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  const canPerformActions = user.role === "Editor" || user.role === "admin";

  useEffect(() => {
    fetchThicknesses();
  }, []);

  const fetchThicknesses = async () => {
    try {
      const response = await axios.get(
        `${import.meta.env.VITE_APP_ROUTE}/edgeBandThickness`
      );
      setThicknesses(response.data);
    } catch (error) {
      console.error("Error fetching edgeband thicknesses:", error);
    }
  };

  const handleDeleteClick = (thickness) => {
    setThicknessToDelete(thickness);
    setShowDeleteConfirm(true);
  };

  const handleDeleteConfirm = async () => {
    try {
      await axios.delete(
        `${import.meta.env.VITE_APP_ROUTE}/edgeBandThickness/${thicknessToDelete._id}`
      );
      await axios.post(`${import.meta.env.VITE_APP_ROUTE}/edgeBandLog/add`, {
        user: user.username,
        action: `Deleted Edgeband Thickness: ${thicknessToDelete.name} (${thicknessToDelete.code})`,
        previousData: thicknessToDelete,
        updatedData: null,
      });
      setShowDeleteConfirm(false);
      fetchThicknesses();
    } catch (error) {
      console.error("Error deleting edgeband thickness:", error);
    }
  };

  return (
    <div className="eb-form-page">
      <h1>Edgeband Thicknesses</h1>
      {canPerformActions && (
        <button
          className="eb-form-page__add-btn"
          onClick={() => navigate("/add-edgeband-thickness")}
        >
          Add Thickness
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
          {thicknesses.map((t) => (
            <tr key={t._id}>
              <td>{t.name}</td>
              <td>{t.code}</td>
              <td>
                {canPerformActions ? (
                  <>
                    <button
                      className="edit-button"
                      onClick={() =>
                        navigate(`/edit-edgeband-thickness/${t._id}`)
                      }
                    >
                      Edit
                    </button>
                    <button
                      className="delete-button"
                      onClick={() => handleDeleteClick(t)}
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
            <p>Do you really want to delete {thicknessToDelete.name}?</p>
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

export default EdgeBandThicknessesList;
