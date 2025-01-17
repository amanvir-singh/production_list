import { useState, useEffect, useContext } from "react";
import axios from "axios";
import { AuthContext } from "../../Components/AuthContext";
import ProductionListTable from "./ProductionListTable";
import { Link } from "react-router-dom";
import ConfirmationModal from "./ConfirmationModal"; // Import the modal
import "../../css/ProductionList/ProductionList.scss";

const ProductionList = () => {
  const [productionLists, setProductionLists] = useState([]);
  const [showArchived, setShowArchived] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const { user } = useContext(AuthContext);

  // State for modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [actionType, setActionType] = useState(null); // 'delete', 'archive', 'unarchive', or 'archiveOlder'
  const [selectedId, setSelectedId] = useState(null);

  useEffect(() => {
    fetchProductionLists();
  }, [showArchived]);

  const fetchProductionLists = async () => {
    try {
      const url = showArchived
        ? "/productionLists/archived"
        : "/productionLists";
      const response = await axios.get(
        `${import.meta.env.VITE_APP_ROUTE}${url}`
      );
      setProductionLists(response.data);
    } catch (error) {
      console.error("Error fetching production lists:", error);
    }
  };

  const handleDelete = (id) => {
    setSelectedId(id);
    setActionType("delete");
    setIsModalOpen(true);
  };

  const handleArchive = (id) => {
    setSelectedId(id);
    setActionType("archive");
    setIsModalOpen(true);
  };

  const handleUnarchive = (id) => {
    setSelectedId(id);
    setActionType("unarchive");
    setIsModalOpen(true);
  };

  const handleArchiveOlder = () => {
    setActionType("archiveOlder");
    setIsModalOpen(true);
  };

  const confirmAction = async () => {
    try {
      if (actionType === "delete") {
        await axios.delete(
          `${import.meta.env.VITE_APP_ROUTE}/productionLists/${selectedId}`
        );
      } else if (actionType === "archive") {
        await axios.patch(
          `${
            import.meta.env.VITE_APP_ROUTE
          }/productionLists/${selectedId}/archive`
        );
      } else if (actionType === "unarchive") {
        await axios.patch(
          `${
            import.meta.env.VITE_APP_ROUTE
          }/productionLists/${selectedId}/unarchive`
        );
      } else if (actionType === "archiveOlder") {
        const days = prompt("Archive jobs older than how many days?");
        if (days) {
          await axios.post(
            `${import.meta.env.VITE_APP_ROUTE}/productionLists/archive-older`,
            { days }
          );
        }
      }
      fetchProductionLists();
    } catch (error) {
      console.error(`Error during ${actionType} action:`, error);
    }

    // Close modal after action
    setIsModalOpen(false);
    setSelectedId(null);
    setActionType(null);
  };

  const filteredLists = productionLists.filter(
    (list) =>
      list.materials.some((material) =>
        Object.values(material).some((val) =>
          val.toString().toLowerCase().includes(searchTerm.toLowerCase())
        )
      ) ||
      list.jobName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      list.cutlistName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      list.note.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const canArchive = user.role === "Editor" || user.role === "admin";

  const canAddJob =
    user.role === "Reader" ||
    user.role === "Editor" ||
    user.role === "Manager" ||
    user.role === "admin";

  return (
    <div className="production-list">
      {!showArchived ? (
        <h1>Production List</h1>
      ) : (
        <h1 style={{ color: "red" }}>Production List (Archived)</h1>
      )}
      <div className="controls">
        <input
          type="text"
          placeholder="Search..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        {user && canAddJob && (
          <Link to="/add-production-list" className="button">
            Add New Job
          </Link>
        )}
        <button onClick={() => setShowArchived(!showArchived)}>
          {showArchived ? "Show Active Jobs" : "Show Archived Jobs"}
        </button>
        {canArchive && (
          <button onClick={handleArchiveOlder}>Archive Older Jobs</button>
        )}
      </div>

      <ProductionListTable
        lists={filteredLists}
        onDelete={handleDelete}
        onArchive={handleArchive}
        onUnarchive={handleUnarchive}
        userRole={user.role}
        showArchived={showArchived}
      />

      {/* Confirmation Modal */}
      <ConfirmationModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onConfirm={confirmAction}
        message={`Are you sure you want to ${
          actionType === "archiveOlder"
            ? "archive jobs older than specified days?"
            : actionType + " this job?"
        }`}
      />
    </div>
  );
};

export default ProductionList;
