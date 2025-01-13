import { useState, useEffect, useContext } from "react";
import axios from "axios";
import { AuthContext } from "../../Components/AuthContext";
import ProductionListTable from "./ProductionListTable";
import { Link } from "react-router-dom";
import "../../css/Production List/ProductionList.scss";

const ProductionList = () => {
  const [productionLists, setProductionLists] = useState([]);
  const [showArchived, setShowArchived] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const { user } = useContext(AuthContext);

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

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this job?")) {
      try {
        await axios.delete(
          `${import.meta.env.VITE_APP_ROUTE}/productionLists/${id}`
        );
        fetchProductionLists();
      } catch (error) {
        console.error("Error deleting production list:", error);
      }
    }
  };

  const handleArchive = async (id) => {
    try {
      await axios.patch(
        `${import.meta.env.VITE_APP_ROUTE}/productionLists/${id}/archive`
      );
      fetchProductionLists();
    } catch (error) {
      console.error("Error archiving production list:", error);
    }
  };

  const handleArchiveOlder = async () => {
    const days = prompt("Archive jobs older than how many days?");
    if (days) {
      try {
        await axios.post(
          `${import.meta.env.VITE_APP_ROUTE}/productionLists/archive-older`,
          { days }
        );
        fetchProductionLists();
      } catch (error) {
        console.error("Error archiving older jobs:", error);
      }
    }
  };

  const filteredLists = productionLists.filter((list) =>
    Object.values(list).some((val) =>
      val.toString().toLowerCase().includes(searchTerm.toLowerCase())
    )
  );

  const canPerformActions =
    user.role === "Editor" ||
    user.role === "Manager" ||
    user.role === "Inventory Associate" ||
    user.role === "admin";

  return (
    <div className="production-list">
      <h1>Production List</h1>
      <div className="controls">
        <input
          type="text"
          placeholder="Search..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <Link to="/add-production-list" className="button">
          Add New Job
        </Link>
        <button onClick={() => setShowArchived(!showArchived)}>
          {showArchived ? "Show Active Jobs" : "Show Archived Jobs"}
        </button>
        {canPerformActions && (
          <button onClick={handleArchiveOlder}>Archive Older Jobs</button>
        )}
      </div>
      <ProductionListTable
        lists={filteredLists}
        onDelete={handleDelete}
        onArchive={handleArchive}
        userRole={user.role}
      />
    </div>
  );
};

export default ProductionList;
