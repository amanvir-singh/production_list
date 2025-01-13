import { useState, useEffect, useContext } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import "../../css/Materials/MaterialsList.scss";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../../Components/AuthContext";

const MaterialsList = () => {
  const [materials, setMaterials] = useState([]);
  const [filteredMaterials, setFilteredMaterials] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [materialToDelete, setMaterialToDelete] = useState(null);
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  const canPerformActions =
    user.role === "Reader" ||
    user.role === "Editor" ||
    user.role === "Manager" ||
    user.role === "Inventory Associate" ||
    user.role === "admin";

  useEffect(() => {
    fetchMaterials();
  }, []);

  useEffect(() => {
    setFilteredMaterials(
      materials.filter((material) =>
        Object.values(material).some((value) =>
          value.toString().toLowerCase().includes(searchTerm.toLowerCase())
        )
      )
    );
  }, [searchTerm, materials]);

  const fetchMaterials = async () => {
    try {
      const response = await axios.get(
        `${import.meta.env.VITE_APP_ROUTE}/materials`
      );
      setMaterials(response.data);
    } catch (error) {
      console.error("Error fetching materials:", error);
    }
  };

  const handleDeleteClick = (material) => {
    setMaterialToDelete(material);
    setShowDeleteConfirm(true);
  };

  const handleDeleteConfirm = async () => {
    try {
      await axios.delete(
        `${import.meta.env.VITE_APP_ROUTE}/materials/${materialToDelete._id}`
      );
      setShowDeleteConfirm(false);
      fetchMaterials();
    } catch (error) {
      console.error("Error deleting material:", error);
    }
  };

  return (
    <div className="material-list">
      <h1>Materials</h1>
      <div className="material-list-header">
        <input
          type="text"
          placeholder="Search materials..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="search-input"
        />
        {canPerformActions && (
          <Link to="/add-material" className="add-button">
            Add Material
          </Link>
        )}
      </div>
      <table>
        <thead>
          <tr>
            <th>Code</th>
            <th>Name</th>
            <th>Color Code</th>
            <th>Thickness</th>
            <th>Dimensions</th>
            <th>Supplier</th>
            <th>Finish</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {filteredMaterials.map((material) => (
            <tr key={material._id}>
              <td>{material.code}</td>
              <td>{material.name}</td>
              <td>{material.colorCode}</td>
              <td>{material.thickness}</td>
              <td>{`${material.width} x ${material.length}`}</td>
              <td>{material.supplier}</td>
              <td>{material.finish}</td>
              <td>
                {canPerformActions ? (
                  <>
                    <button
                      onClick={() => navigate(`/edit-material/${material._id}`)}
                      className="edit-button"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeleteClick(material)}
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
            <p>Do you really want to delete {materialToDelete.name}?</p>
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

export default MaterialsList;
