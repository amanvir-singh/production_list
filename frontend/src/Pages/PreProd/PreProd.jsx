import { useState, useEffect, useContext } from "react";
import axios from "axios";
import "../../css/PreProd/PreProd.scss";
import ConfirmationModal from "./ConfirmationModal";
import { AuthContext } from "../../Components/AuthContext";

const PreProd = () => {
  const [preprodData, setPreprodData] = useState([]);
  const [stockStatuses, setStockStatuses] = useState([]);
  const [jobStatuses, setJobStatuses] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const { user } = useContext(AuthContext);
  const [searchTerm, setSearchTerm] = useState("");

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

  const filteredPreprodData = preprodData.filter((item) =>
    item.cutlists.some(
      (cl) =>
        item.material.toLowerCase().includes(searchTerm.toLowerCase()) ||
        cl.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        cl.stockStatus.toLowerCase().includes(searchTerm.toLowerCase()) ||
        cl.jobStatus.toLowerCase().includes(searchTerm.toLowerCase())
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
    } catch (error) {
      console.error("Error fetching preprod data:", error);
    }
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
      .map(([material, items]) => ({
        material,
        cutlists: items.map((item) => ({
          name: item.cutlistName,
          quantity: item.quantitySaw + item.quantityCNC,
          stockStatus: item.stockStatus,
          jobStatus: item.jobStatus,
          priority: item.priority,
          jobName: item.jobName,
          id: item._id,
          createdAt: item.createdAt,
        })),
        totalQuantity: items.reduce(
          (sum, item) => sum + item.quantitySaw + item.quantityCNC,
          0
        ),
        highestPriority: items.reduce((highest, item) => {
          if (item.priority === 0) return highest;
          if (highest === 0 || item.priority < highest) return item.priority;
          return highest;
        }, 0),
        oldestCreatedAt: new Date(
          Math.min(...items.map((item) => new Date(item.createdAt)))
        ),
      }))
      .sort((a, b) => {
        // First, sort by non-zero priority
        if (a.highestPriority !== 0 && b.highestPriority !== 0) {
          return a.highestPriority - b.highestPriority;
        }
        // If one has a non-zero priority and the other doesn't, non-zero comes first
        if (a.highestPriority !== 0) return -1;
        if (b.highestPriority !== 0) return 1;
        // If both have zero priority, sort by oldest createdAt
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

  const confirmMarkComplete = async () => {
    try {
      await axios.post(`${import.meta.env.VITE_APP_ROUTE}/preprod/complete`, {
        materialName: selectedItem.material.material,
        cutlistId: selectedItem.cutlist.id,
        completedStatus: selectedItem.completedStatus,
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
    <div className="preprod-list">
      <h2>Pre-Production Material Preparation</h2>
      <div className="controls">
        <input
          type="text"
          placeholder="Search..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
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
                key={`${item.material}-${cl.id}`}
                className={materialIndex % 2 === 0 ? "" : "even-material"}
              >
                {cutlistIndex === 0 && (
                  <td rowSpan={item.cutlists.length}>{item.material}</td>
                )}
                <td>{cl.name}</td>
                <td>{cl.quantity}</td>
                <td
                  style={{
                    backgroundColor: getStockStatusColor(cl.stockStatus),
                  }}
                >
                  {cl.stockStatus}
                </td>
                <td
                  style={{ backgroundColor: getJobStatusColor(cl.jobStatus) }}
                >
                  {cl.jobStatus}
                </td>
                <td>{cl.priority}</td>
                {cutlistIndex === 0 && (
                  <td rowSpan={item.cutlists.length}>{item.totalQuantity}</td>
                )}
                <td>
                  {canPerformActions ? (
                    <button
                      className="complete-button"
                      onClick={() => handleMarkComplete(item, cl)}
                    >
                      Mark as Complete
                    </button>
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
    </div>
  );
};

export default PreProd;
