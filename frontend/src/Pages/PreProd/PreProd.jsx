import { useState, useEffect, useContext, useRef } from "react";
import axios from "axios";
import "../../css/PreProd/PreProd.scss";
import ConfirmationModal from "./ConfirmationModal";
import { AuthContext } from "../../Components/AuthContext";
import FilterModal from "../ProductionList/FilterModal";
import NoteModal from "./NoteModal";

const highlightText = (text, highlight) => {
  if (!highlight.trim()) {
    return text;
  }
  const regex = new RegExp(`(${highlight})`, "gi");
  const parts = String(text).split(regex);
  return parts.map((part, i) =>
    regex.test(part) ? <mark key={i}>{part}</mark> : <span key={i}>{part}</span>
  );
};

const PreProd = () => {
  const [preprodData, setPreprodData] = useState([]);
  const [stockStatuses, setStockStatuses] = useState([]);
  const [jobStatuses, setJobStatuses] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const { user } = useContext(AuthContext);
  const [searchTerm, setSearchTerm] = useState("");
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [isNoteModalOpen, setIsNoteModalOpen] = useState(false);
  const [partialNote, setPartialNote] = useState("");
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

  const canPerformActions =
    user.role === "Editor" ||
    user.role === "admin" ||
    user.role === "Inventory Associate";

  useEffect(() => {
    fetchStockStatuses();
    fetchJobStatuses();
  }, []);

  useEffect(() => {
    if (stockStatuses.length > 0 && jobStatuses.length > 0) {
      fetchPreprodData();
    }
  }, [stockStatuses, jobStatuses]);

  const filteredPreprodData = preprodData.filter(
    (item) =>
      (filters.materials.length === 0 ||
        filters.materials.includes(item.material)) &&
      item.cutlists.some(
        (cl) =>
          (filters.jobStatuses.length === 0 ||
            filters.jobStatuses.includes(cl.jobStatus)) &&
          (filters.stockStatuses.length === 0 ||
            filters.stockStatuses.includes(cl.stockStatus)) &&
          (filters.priorities.length === 0 ||
            filters.priorities.includes(cl.priority)) &&
          (item.material.toLowerCase().includes(searchTerm.toLowerCase()) ||
            cl.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            cl.stockStatus.toLowerCase().includes(searchTerm.toLowerCase()) ||
            cl.jobStatus.toLowerCase().includes(searchTerm.toLowerCase()))
      )
  );

  const fetchStockStatuses = async () => {
    try {
      const response = await axios.get(
        `${import.meta.env.VITE_APP_ROUTE}/stockStatusIndicators`
      );
      setStockStatuses(response.data);
    } catch (error) {
      console.error("Error fetching stock status indicators:", error);
    }
  };

  const fetchJobStatuses = async () => {
    try {
      const response = await axios.get(
        `${import.meta.env.VITE_APP_ROUTE}/jobStatusIndicators`
      );
      setJobStatuses(response.data);
    } catch (error) {
      console.error("Error fetching job status indicators:", error);
    }
  };

  const fetchPreprodData = async () => {
    try {
      const consideredStockStatuses = stockStatuses
        .filter((status) => status.considerForPreProd)
        .map((status) => status.name);
      const consideredJobStatuses = jobStatuses
        .filter((status) => status.considerForPreProd)
        .map((status) => status.name);

      const response = await axios.post(
        `${import.meta.env.VITE_APP_ROUTE}/preprod`,
        {
          consideredStockStatuses,
          consideredJobStatuses,
        }
      );

      const sortedData = sortAndGroupPreprodData(response.data);
      setPreprodData(sortedData);

      setAvailableFilters({
        materials: [...new Set(sortedData.map((item) => item.material))],
        jobStatuses: [
          ...new Set(
            sortedData.flatMap((item) =>
              item.cutlists.map((cl) => cl.jobStatus)
            )
          ),
        ],
        stockStatuses: [
          ...new Set(
            sortedData.flatMap((item) =>
              item.cutlists.map((cl) => cl.stockStatus)
            )
          ),
        ],
        priorities: [
          ...new Set(
            sortedData.flatMap((item) => item.cutlists.map((cl) => cl.priority))
          ),
        ],
      });
    } catch (error) {
      console.error("Error fetching preprod data:", error);
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

  const handlePrint = () => {
    window.print();
  };

  const sortAndGroupPreprodData = (data) => {
    // Group by material
    const groupedByMaterial = data.reduce((acc, item) => {
      const materialKey = item.material || item.customMaterial;
      if (!acc[materialKey]) {
        acc[materialKey] = [];
      }
      acc[materialKey].push(item);
      return acc;
    }, {});

    // Sort and flatten the grouped data
    return Object.entries(groupedByMaterial)
      .map(([material, items]) => {
        const cutlists = items.map((item) => ({
          name: item.cutlistName,
          quantity: item.quantitySaw + item.quantityCNC,
          stockStatus: item.stockStatus,
          jobStatus: item.jobStatus,
          priority: item.priority,
          jobName: item.jobName,
          id: item._id,
          createdAt: item.createdAt,
        }));

        // Sort the cutlists by priority in descending order
        cutlists.sort((a, b) => b.priority - a.priority);

        return {
          material,
          cutlists,
          totalQuantity: items.reduce(
            (sum, item) => sum + item.quantitySaw + item.quantityCNC,
            0
          ),
          highestPriority: Math.max(...items.map((item) => item.priority)),
          oldestCreatedAt: new Date(
            Math.min(...items.map((item) => new Date(item.createdAt)))
          ),
        };
      })
      .sort((a, b) => {
        // Sort materials by highest priority (higher number means higher priority)
        if (a.highestPriority !== b.highestPriority) {
          return b.highestPriority - a.highestPriority;
        }
        // If priorities are equal, sort by oldest createdAt
        return a.oldestCreatedAt - b.oldestCreatedAt;
      });
  };

  const handleMarkComplete = (material, cutlist) => {
    const completedStatus = stockStatuses.find(
      (status) => status.defaultCompleted
    );
    if (!completedStatus) {
      alert(
        "No default completed status found. Please set a default completed status."
      );
      return;
    }
    setSelectedItem({
      material,
      cutlist,
      completedStatus: completedStatus.name,
    });
    setIsModalOpen(true);
  };

  const handleMarkPartialComplete = (material, cutlist) => {
    const completedStatus = stockStatuses.find(
      (status) => status.defaultCompleted
    );
    if (!completedStatus) {
      alert(
        "No default completed status found. Please set a default completed status."
      );
      return;
    }
    setSelectedItem({
      material,
      cutlist,
      completedStatus: completedStatus.name,
    });
    setIsNoteModalOpen(true);
  };

  const confirmMarkPartialComplete = async () => {
    try {
      await axios.post(
        `${import.meta.env.VITE_APP_ROUTE}/preprod/partial-complete`,
        {
          materialName: selectedItem.material.material,
          cutlistId: selectedItem.cutlist.id,
          completedStatus: selectedItem.completedStatus,
          updatedNote: partialNote,
        }
      );

      // Log the MarkComplete action
      await axios.post(`${import.meta.env.VITE_APP_ROUTE}/logs/add`, {
        user: user.username,
        action: `Marked Material: "${selectedItem.material.material}" (Qty: ${selectedItem.cutlist.quantity}) PARTIALLY prepared for: Cutlist: "${selectedItem.cutlist.name}"`,
        previousData: null,
        updatedData: null,
      });

      fetchPreprodData();
      setIsNoteModalOpen(false);
      setPartialNote(""); // Reset note
    } catch (error) {
      console.error("Error marking as partial complete:", error);
      alert("An error occurred while marking the item as partially complete.");
    }
  };

  const confirmMarkComplete = async () => {
    try {
      await axios.post(`${import.meta.env.VITE_APP_ROUTE}/preprod/complete`, {
        materialName: selectedItem.material.material,
        cutlistId: selectedItem.cutlist.id,
        completedStatus: selectedItem.completedStatus,
      });

      // Log the MarkComplete action
      await axios.post(`${import.meta.env.VITE_APP_ROUTE}/logs/add`, {
        user: user.username,
        action: `Marked Material: "${selectedItem.material.material}" (Qty: ${selectedItem.cutlist.quantity}) prepared for: Cutlist: "${selectedItem.cutlist.name}"`,
        previousData: null,
        updatedData: null,
      });

      fetchPreprodData();
      setIsModalOpen(false);
    } catch (error) {
      console.error("Error marking as complete:", error);
      alert("An error occurred while marking the item as complete.");
    }
  };

  const getStockStatusColor = (status) => {
    const stockStatus = stockStatuses.find((ss) => ss.name === status);
    return stockStatus ? stockStatus.color : "inherit";
  };

  const getJobStatusColor = (status) => {
    const jobStatus = jobStatuses.find((js) => js.name === status);
    return jobStatus ? jobStatus.color : "inherit";
  };

  return (
    <div className="preprod-list" ref={printRef}>
      <div className="print-header">
        {user && <p>Printed by: {user.username}</p>}
      </div>
      <h2>Pre-Production Material Preparation</h2>
      <div className="controls">
        <input
          type="text"
          placeholder="Search..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
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
      <table>
        <thead>
          <tr>
            <th>Material</th>
            <th>Cutlist Name</th>
            <th>Quantity Required</th>
            <th>Stock Status</th>
            <th>Job Status</th>
            <th>Priority</th>
            <th>Total Quantity</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {filteredPreprodData.map((item, materialIndex) =>
            item.cutlists.map((cl, cutlistIndex) => (
              <tr
                key={`${item.material}-${cl.id}-${cutlistIndex}`}
                className={materialIndex % 2 === 0 ? "" : "even-material"}
              >
                {cutlistIndex === 0 && (
                  <td rowSpan={item.cutlists.length}>
                    {highlightText(item.material, searchTerm)}
                  </td>
                )}
                <td
                  style={{
                    backgroundColor: getStockStatusColor(cl.stockStatus),
                  }}
                >
                  {highlightText(cl.name, searchTerm)}
                </td>
                <td
                  style={{
                    backgroundColor: getStockStatusColor(cl.stockStatus),
                  }}
                >
                  {cl.quantity}
                </td>
                <td
                  style={{
                    backgroundColor: getStockStatusColor(cl.stockStatus),
                  }}
                >
                  {highlightText(cl.stockStatus, searchTerm)}
                </td>
                <td
                  style={{ backgroundColor: getJobStatusColor(cl.jobStatus) }}
                >
                  {highlightText(cl.jobStatus, searchTerm)}
                </td>
                <td
                  style={{
                    backgroundColor: getStockStatusColor(cl.stockStatus),
                  }}
                >
                  {cl.priority}
                </td>
                {cutlistIndex === 0 && (
                  <td rowSpan={item.cutlists.length}>{item.totalQuantity}</td>
                )}
                <td>
                  {canPerformActions ? (
                    <>
                      <button
                        className="complete-button"
                        onClick={() => handleMarkComplete(item, cl)}
                      >
                        Mark as Complete
                      </button>
                      <button
                        className="partial-complete-button"
                        onClick={() => handleMarkPartialComplete(item, cl)}
                      >
                        Mark as Partial Complete
                      </button>
                    </>
                  ) : (
                    <></>
                  )}
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>

      <ConfirmationModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onConfirm={confirmMarkComplete}
        item={selectedItem}
      />

      <FilterModal
        isOpen={isFilterModalOpen}
        onClose={() => setIsFilterModalOpen(false)}
        onApply={handleFilterChange}
        availableFilters={availableFilters}
        currentFilters={filters}
        ParentFunction={"Filter Pre-Production List"}
      />

      <NoteModal
        isOpen={isNoteModalOpen}
        onClose={() => setIsNoteModalOpen(false)}
        onConfirm={confirmMarkPartialComplete}
        note={partialNote}
        setNote={setPartialNote}
      />
    </div>
  );
};

export default PreProd;
