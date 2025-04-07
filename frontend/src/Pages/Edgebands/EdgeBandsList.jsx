import { useState, useEffect, useContext } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import "../../css/Edgebands/EdgebandsList.scss";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../../Components/AuthContext";

const EdgebandList = () => {
  const [edgebands, setEdgebands] = useState([]);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [edgebandToDelete, setEdgebandToDelete] = useState(null);
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  const canPerformActions = user.role === "Editor" || user.role === "admin";

  useEffect(() => {
    fetchEdgebands();
  }, []);

  const fetchEdgebands = async () => {
    try {
      const response = await axios.get(
        `${import.meta.env.VITE_APP_ROUTE}/edgeband`
      );

      const sortedEdgebands = response.data.sort((a, b) => {
        return a.code.localeCompare(b.code, undefined, { numeric: true });
      });

      setEdgebands(sortedEdgebands);
    } catch (error) {
      console.error("Error fetching edgebands:", error);
    }
  };

  const handleDeleteClick = (edgeband) => {
    setEdgebandToDelete(edgeband);
    setShowDeleteConfirm(true);
  };

  const handleDeleteConfirm = async () => {
    try {
      // Delete the edgeband
      await axios.delete(
        `${import.meta.env.VITE_APP_ROUTE}/edgeband/${edgebandToDelete._id}`
      );

      // Log the delete action
      await axios.post(`${import.meta.env.VITE_APP_ROUTE}/logs/add`, {
        user: user.username,
        action: `Deleted Edgeband: ${edgebandToDelete.code}`,
        previousData: edgebandToDelete,
        updatedData: null,
      });

      setShowDeleteConfirm(false);
      fetchEdgebands();
    } catch (error) {
      console.error("Error deleting edgeband:", error);
    }
  };

  return (
    <div className="edgeband-list">
      <h1>Edgebands</h1>
      {canPerformActions ? (
        <Link to="/add-edgeband" className="add-button">
          Add Edgeband
        </Link>
      ) : (
        <></>
      )}
      <table>
        <thead>
          <tr>
            <th>Code</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {edgebands.map((edgeband) => (
            <tr key={edgeband._id}>
              <td>{edgeband.code}</td>
              <td>
                {canPerformActions ? (
                  <>
                    <button
                      onClick={() => navigate(`/edit-edgeband/${edgeband._id}`)}
                      className="edit-button"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeleteClick(edgeband)}
                      className="delete-button"
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
            <p>Do you really want to delete {edgebandToDelete.code}?</p>
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

export default EdgebandList;
