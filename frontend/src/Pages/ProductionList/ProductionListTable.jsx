/* eslint-disable react/prop-types */
import { useState, useEffect } from "react";
import axios from "axios";

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

const ProductionListTable = ({
  lists,
  searchTerm = "",
  onDelete,
  onArchive,
  onUnarchive,
  userRole,
  showArchived,
}) => {
  const [stockStatuses, setStockStatuses] = useState([]);
  const [jobStatuses, setJobStatuses] = useState([]);

  useEffect(() => {
    fetchStockStatuses();
    fetchJobStatuses();
  }, []);

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

  const canArchive = ["Editor", "admin"].includes(userRole);
  const canEdit = showArchived
    ? canArchive
    : ["Editor", "Manager", "admin", "Reader"].includes(userRole);

  const isStockManager = ["Inventory Associate"].includes(userRole);

  const getJobStatusColor = (status) => {
    const jobStatus = jobStatuses.find((js) => js.name === status);
    return jobStatus ? jobStatus.color : "inherit";
  };

  const getStockStatusColor = (status) => {
    const stockStatus = stockStatuses.find((ss) => ss.name === status);
    return stockStatus ? stockStatus.color : "inherit";
  };

  const buttonStyle = {
    padding: "8px 12px",
    margin: "0 4px",
    borderRadius: "4px",
    border: "none",
    cursor: "pointer",
    fontWeight: "bold",
    textDecoration: "none",
    display: "inline-block",
  };

  const editButtonStyle = {
    ...buttonStyle,
    backgroundColor: "#4CAF50",
    color: "white",
  };

  const deleteButtonStyle = {
    ...buttonStyle,
    backgroundColor: "#f44336",
    color: "white",
  };

  const archiveButtonStyle = {
    ...buttonStyle,
    backgroundColor: "#008CBA",
    color: "white",
  };

  return (
    <table style={{ borderCollapse: "collapse", width: "100%" }}>
      <thead>
        <tr style={{ backgroundColor: "#f2f2f2" }}>
          <th>Cutlist Name</th>
          <th>Job Name</th>
          <th>Material</th>
          <th>Saw Quantity</th>
          <th>CNC Quantity</th>
          <th>Total Quantity</th>
          <th>Stock Status</th>
          <th>Job Status</th>
          <th>Priority</th>
          <th>Notes</th>
          <th>Created On</th>
          <th>Updated On</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        {lists.map((list, listIndex) => {
          const materials = list.materials.length > 0 ? list.materials : [{}];
          const rowBackgroundColor =
            listIndex % 2 === 0 ? "#e6f7f3" : "#f9f5ff";
          return materials.map((material, materialIndex) => {
            const jobStatusColor = getJobStatusColor(material.jobStatus);
            return (
              <tr
                key={`${list._id}-${materialIndex}`}
                style={{
                  backgroundColor: rowBackgroundColor,
                }}
              >
                {materialIndex === 0 && (
                  <>
                    <td rowSpan={Math.max(1, list.materials.length)}>
                      {highlightText(list.cutlistName, searchTerm)}
                    </td>
                    <td
                      className="jobs-column"
                      rowSpan={Math.max(1, list.materials.length)}
                    >
                      {highlightText(list.jobName, searchTerm)}
                    </td>
                  </>
                )}
                <td style={{ backgroundColor: jobStatusColor }}>
                  {highlightText(
                    material.material || material.customMaterial || "",
                    searchTerm
                  )}
                </td>
                <td style={{ backgroundColor: jobStatusColor }}>
                  {material.quantitySaw || ""}
                </td>
                <td style={{ backgroundColor: jobStatusColor }}>
                  {material.quantityCNC || ""}
                </td>
                <td style={{ backgroundColor: jobStatusColor }}>
                  {material.quantitySaw || material.quantityCNC
                    ? (material.quantitySaw || 0) + (material.quantityCNC || 0)
                    : ""}
                </td>
                <td
                  style={{
                    backgroundColor: getStockStatusColor(material.stockStatus),
                  }}
                >
                  {highlightText(material.stockStatus || "", searchTerm)}
                </td>
                <td style={{ backgroundColor: jobStatusColor }}>
                  {highlightText(material.jobStatus || "", searchTerm)}
                </td>
                {materialIndex === 0 && (
                  <>
                    <td rowSpan={Math.max(1, list.materials.length)}>
                      {list.priority}
                    </td>
                    <td
                      className="notes-column"
                      rowSpan={Math.max(1, list.materials.length)}
                    >
                      {highlightText(list.note, searchTerm)}
                    </td>
                    <td rowSpan={Math.max(1, list.materials.length)}>
                      {new Date(list.createdAt).toLocaleDateString()}
                    </td>
                    <td rowSpan={Math.max(1, list.materials.length)}>
                      {new Date(list.updatedAt).toLocaleDateString()}
                    </td>
                    <td rowSpan={Math.max(1, list.materials.length)}>
                      {!userRole && <p>Login to perform Actions</p>}
                      {(canEdit || (isStockManager && !showArchived)) && (
                        <button
                          onClick={() =>
                            (window.location.href = `/edit-production-list/${list._id}`)
                          }
                          style={editButtonStyle}
                        >
                          Edit
                        </button>
                      )}
                      {canEdit && (
                        <button
                          onClick={() => onDelete(list._id)}
                          style={deleteButtonStyle}
                        >
                          Delete
                        </button>
                      )}
                      {canArchive &&
                        (showArchived ? (
                          <button
                            onClick={() => onUnarchive(list._id)}
                            style={archiveButtonStyle}
                          >
                            Unarchive
                          </button>
                        ) : (
                          <button
                            onClick={() => onArchive(list._id)}
                            style={archiveButtonStyle}
                          >
                            Archive
                          </button>
                        ))}
                    </td>
                  </>
                )}
              </tr>
            );
          });
        })}
      </tbody>
    </table>
  );
};

export default ProductionListTable;
