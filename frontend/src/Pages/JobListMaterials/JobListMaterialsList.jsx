import { useState, useEffect, useContext } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import "../../css/JobListMaterials/JobListMaterialsList.scss";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../../Components/AuthContext";

const JobListMaterialList = () => {
  const [jobListMaterials, setJobListMaterials] = useState([]);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [jobListMaterialToDelete, setJobListMaterialToDelete] = useState(null);
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  const canPerformActions = user.role === "Editor" || user.role === "admin";

  useEffect(() => {
    fetchJobListMaterials();
  }, []);

  const fetchJobListMaterials = async () => {
    try {
      const response = await axios.get(
        `${import.meta.env.VITE_APP_ROUTE}/joblistmaterial`
      );

      const sortedJobListMaterials = response.data.sort((a, b) => {
        return a.code.localeCompare(b.code, undefined, { numeric: true });
      });

      setJobListMaterials(sortedJobListMaterials);
    } catch (error) {
      console.error("Error fetching job list materials:", error);
    }
  };

  const handleDeleteClick = (jobListMaterial) => {
    setJobListMaterialToDelete(jobListMaterial);
    setShowDeleteConfirm(true);
  };

  const handleDeleteConfirm = async () => {
    try {
      // Delete the JobListMaterial
      await axios.delete(
        `${import.meta.env.VITE_APP_ROUTE}/joblistmaterial/${
          jobListMaterialToDelete._id
        }`
      );

      // Log the delete action
      await axios.post(`${import.meta.env.VITE_APP_ROUTE}/logs/add`, {
        user: user.username,
        action: `Deleted JobListMaterial: ${jobListMaterialToDelete.code}`,
        previousData: jobListMaterialToDelete,
        updatedData: null,
      });

      setShowDeleteConfirm(false);
      fetchJobListMaterials();
    } catch (error) {
      console.error("Error deleting JobListMaterial:", error);
    }
  };

  return (
    <div className="joblistmaterial-list">
      <h1>Job List Materials</h1>
      {canPerformActions ? (
        <Link to="/add-joblistmaterial" className="add-button">
          Add Job List Material
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
          {jobListMaterials.map((jobListMaterial) => (
            <tr key={jobListMaterial._id}>
              <td>{jobListMaterial.code}</td>
              <td>
                {canPerformActions ? (
                  <>
                    <button
                      onClick={() =>
                        navigate(`/edit-joblistmaterial/${jobListMaterial._id}`)
                      }
                      className="edit-button"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeleteClick(jobListMaterial)}
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
            <p>Do you really want to delete {jobListMaterialToDelete.code}?</p>
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

export default JobListMaterialList;
