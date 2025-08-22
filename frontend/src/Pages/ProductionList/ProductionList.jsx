import { useState, useEffect, useContext, useRef } from "react";
import axios from "axios";
import { AuthContext } from "../../Components/AuthContext";
import ProductionListTable from "./ProductionListTable";
import { Link } from "react-router-dom";
import ConfirmationModal from "./ConfirmationModal"; // Import the modal
import "../../css/ProductionList/ProductionList.scss";
import FilterModal from "./FilterModal";

const ProductionList = () => {
  const [productionLists, setProductionLists] = useState([]);
  const [showArchived, setShowArchived] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const { user } = useContext(AuthContext);
  const [jobNames, setJobNames] = useState([]);
  const [addedby, setAddedBy] = useState([]);
  const [jobStatustoMark, setJobStatustoMark] = useState("PrePROD");

  // State for modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [actionType, setActionType] = useState(null);
  const [selectedId, setSelectedId] = useState(null);
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [filters, setFilters] = useState({
    materials: [],
    jobStatuses: [],
    stockStatuses: [],
    priorities: [],
  });
  const [availableFilters, setAvailableFilters] = useState({
    materials: [],
    jobStatuses: [],
    stockStatuses: [],
    priorities: [],
  });
  const printRef = useRef();

  useEffect(() => {
    const fetchData = async () => {
      await fetchProductionLists();
    };
    fetchData();
  }, [showArchived, actionType]);

  useEffect(() => {
    const fetchUserNamesController = async () => {
      await fetchUserNames();
    };
    if (jobNames.length > 0) {
      fetchUserNamesController();
    }
  }, [jobNames]);

  useEffect(() => {
    const extractedJobNames = productionLists.map((item) => item.cutlistName);
    setJobNames(extractedJobNames);
  }, [productionLists]);

  useEffect(() => {
    if (productionLists.length > 0) {
      fetchAvailableFilters();
    }
  }, [productionLists]);

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

  const fetchUserNames = async () => {
    try {
      const response = await axios.post(
        `${import.meta.env.VITE_APP_ROUTE}/productionLists/names`,
        { jobNames }
      );
      setAddedBy(response.data);
    } catch (error) {
      console.error("Error fetching user names for the jobs:", error);
    }
  };

  const fetchAvailableFilters = async () => {
    try {
      const [jobStatuses, stockStatuses] = await Promise.all([
        axios.get(`${import.meta.env.VITE_APP_ROUTE}/jobStatusIndicators`),
        axios.get(`${import.meta.env.VITE_APP_ROUTE}/stockStatusIndicators`),
      ]);

      const materials = [
        ...new Set(
          productionLists.flatMap((list) =>
            list.materials.map((m) => m.material || m.customMaterial)
          )
        ),
      ]
        .filter(Boolean)
        .sort();

      setAvailableFilters({
        materials,
        jobStatuses: jobStatuses.data.map((js) => js.name),
        stockStatuses: stockStatuses.data.map((ss) => ss.name),
        priorities: [
          ...new Set(productionLists.map((list) => list.priority)),
        ].sort((a, b) => a - b),
      });
    } catch (error) {
      console.error("Error fetching available filters:", error);
    }
  };

  const handleFilterChange = (newFilters) => {
    setFilters(newFilters);
  };

  const clearFilters = () => {
    setFilters({
      materials: [],
      jobStatuses: [],
      stockStatuses: [],
      priorities: [],
    });
  };

  const handleDelete = (id) => {
    setSelectedId(id);
    setActionType("delete");
    setIsModalOpen(true);
  };

  const handlePrerod = (id) => {
    setSelectedId(id);
    setActionType("preprod");
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
        // Fetch the original job data
        const originalResponse = await axios.get(
          `${import.meta.env.VITE_APP_ROUTE}/productionLists/${selectedId}`
        );
        const originalJobData = originalResponse.data;

        await axios.delete(
          `${import.meta.env.VITE_APP_ROUTE}/productionLists/${selectedId}`
        );

        // Log the delete action
        await axios.post(`${import.meta.env.VITE_APP_ROUTE}/logs/add`, {
          user: user.username,
          action: `Deleted Cutlist: ${originalJobData.cutlistName}`,
          previousData: originalJobData,
          updatedData: null,
        });
      } else if (actionType === "preprod") {
        // Fetch the original job data
        const originalResponse = await axios.get(
          `${import.meta.env.VITE_APP_ROUTE}/productionLists/${selectedId}`
        );
        const originalJobData = originalResponse.data;

        // Send patch request to update
        await axios.patch(
          `${
            import.meta.env.VITE_APP_ROUTE
          }/productionLists/${selectedId}/preprod`,
          {
            jobStatustoMark: jobStatustoMark,
          }
        );

        // Fetch the updated job data
        const updatedResponse = await axios.get(
          `${import.meta.env.VITE_APP_ROUTE}/productionLists/${selectedId}`
        );
        const updatedJobData = updatedResponse.data;

        // Log the marked as preprod action
        await axios.post(`${import.meta.env.VITE_APP_ROUTE}/logs/add`, {
          user: user.username,
          action: `Marked Job as in ${jobStatustoMark}: ${originalJobData.cutlistName}`,
          previousData: originalJobData,
          updatedData: updatedJobData,
        });
      } else if (actionType === "archive") {
        // Fetch the original job data
        const originalResponse = await axios.get(
          `${import.meta.env.VITE_APP_ROUTE}/productionLists/${selectedId}`
        );
        const originalJobData = originalResponse.data;

        await axios.patch(
          `${
            import.meta.env.VITE_APP_ROUTE
          }/productionLists/${selectedId}/archive`
        );

        // Fetch the updated job data
        const updatedResponse = await axios.get(
          `${import.meta.env.VITE_APP_ROUTE}/productionLists/${selectedId}`
        );
        const updatedJobData = updatedResponse.data;

        // Log the archive action
        await axios.post(`${import.meta.env.VITE_APP_ROUTE}/logs/add`, {
          user: user.username,
          action: `Archived Cutlist: ${originalJobData.cutlistName}`,
          previousData: originalJobData,
          updatedData: updatedJobData,
        });
      } else if (actionType === "unarchive") {
        // Fetch the original job data
        const originalResponse = await axios.get(
          `${import.meta.env.VITE_APP_ROUTE}/productionLists/${selectedId}`
        );
        const originalJobData = originalResponse.data;

        await axios.patch(
          `${
            import.meta.env.VITE_APP_ROUTE
          }/productionLists/${selectedId}/unarchive`
        );

        // Fetch the updated job data
        const updatedResponse = await axios.get(
          `${import.meta.env.VITE_APP_ROUTE}/productionLists/${selectedId}`
        );
        const updatedJobData = updatedResponse.data;

        // Log the unarchive action
        await axios.post(`${import.meta.env.VITE_APP_ROUTE}/logs/add`, {
          user: user.username,
          action: `Unrchived Cutlist: ${originalJobData.cutlistName}`,
          previousData: originalJobData,
          updatedData: updatedJobData,
        });
      } else if (actionType === "archiveOlder") {
        const days = prompt("Archive jobs older than how many days?");
        if (days) {
          await axios.post(
            `${import.meta.env.VITE_APP_ROUTE}/productionLists/archive-older`,
            { days }
          );
        }

        // Log the archive older jobs action
        await axios.post(`${import.meta.env.VITE_APP_ROUTE}/logs/add`, {
          user: user.username,
          action: `Archived Jobs Older than: ${days} days`,
          previousData: null,
          updatedData: null,
        });
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

  const filteredLists = productionLists.filter((list) => {
    const matchesSearch =
      list.materials.some((material) =>
        (material.material || material.customMaterial || "")
          .toString()
          .toLowerCase()
          .includes(searchTerm.toLowerCase())
      ) ||
      list.jobName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      list.cutlistName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      list.note.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesFilters =
      (filters.materials.length === 0 ||
        list.materials.some(
          (m) =>
            filters.materials.includes(m.material) ||
            filters.materials.includes(m.customMaterial)
        )) &&
      (filters.jobStatuses.length === 0 ||
        list.materials.some((m) =>
          filters.jobStatuses.includes(m.jobStatus)
        )) &&
      (filters.stockStatuses.length === 0 ||
        list.materials.some((m) =>
          filters.stockStatuses.includes(m.stockStatus)
        )) &&
      (filters.priorities.length === 0 ||
        filters.priorities.includes(list.priority));

    return matchesSearch && matchesFilters;
  });

  const handlePrint = () => {
    window.print();
  };

  const canArchive = user.role === "Editor" || user.role === "admin";

  const canAddJob =
    user.role === "Reader" ||
    user.role === "Editor" ||
    user.role === "Manager" ||
    user.role === "admin";

  return (
    <div className="production-list" ref={printRef}>
      <div className="print-header">
        {user && <p>Printed by: {user.username}</p>}
      </div>
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
          <Link to="/add-production-list" className="button btn-add-job">
            Add New Job
          </Link>
        )}
        <button
          className="btn-toggle-archive"
          onClick={() => setShowArchived(!showArchived)}
        >
          {showArchived ? "Show Active Jobs" : "Show Archived Jobs"}
        </button>
        {canArchive && (
          <button className="btn-archive-older" onClick={handleArchiveOlder}>
            Archive Older Jobs
          </button>
        )}
        <button
          className="btn-filters"
          onClick={() => setIsFilterModalOpen(true)}
        >
          Filters
        </button>
        {Object.values(filters).some((f) => f.length > 0) && (
          <button className="btn-clear-filters" onClick={clearFilters}>
            Clear Filters
          </button>
        )}
        <button className="btn-print" onClick={handlePrint}>
          Print
        </button>
      </div>

      <ProductionListTable
        lists={filteredLists}
        onDelete={handleDelete}
        onArchive={handleArchive}
        onUnarchive={handleUnarchive}
        userRole={user.role}
        showArchived={showArchived}
        searchTerm={searchTerm}
        addedByList={addedby}
        onPreprod={handlePrerod}
      />

      {/* Confirmation Modal */}
      <ConfirmationModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onConfirm={confirmAction}
        message={`Are you sure you want to ${
          actionType === "archiveOlder"
            ? "archive jobs older than specified days?"
            : actionType === "preprod"
            ? "mark this job as PrePROD?"
            : `${actionType} this job?`
        }`}
      />

      <FilterModal
        isOpen={isFilterModalOpen}
        onClose={() => setIsFilterModalOpen(false)}
        onApply={handleFilterChange}
        availableFilters={availableFilters}
        currentFilters={filters}
        ParentFunction={"Filter Production List"}
      />
    </div>
  );
};

export default ProductionList;
