import { useState, useEffect, useRef, useContext } from "react";
import axios from "axios";
import { AuthContext } from "../../Components/AuthContext";
import "../../css/JobList/JobList.scss";
import ConfirmationModal from "./ConfirmationModal";
import FilterModal from "./FilterModal";
import { Link } from "react-router-dom";
import { useNavigate } from "react-router-dom";
import CreatePTXModal from "./CreatePTXModal";

const JobList = () => {
  const [jobLists, setJobLists] = useState([]);
  const [showArchived, setShowArchived] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const { user } = useContext(AuthContext);
  const [selectedId, setSelectedId] = useState(null);
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const printRef = useRef();
  const navigate = useNavigate();
  const [filters, setFilters] = useState({
    materials: [],
  });

  const [isConfirmationOpen, setIsConfirmationOpen] = useState(false);
  const [confirmationMessage, setConfirmationMessage] = useState("");
  const [confirmationAction, setConfirmationAction] = useState(null);
  const [isPTXModalOpen, setIsPTXModalOpen] = useState(false);
  const [currentJobForPTX, setCurrentJobForPTX] = useState(null);

  const canEdit =
    user.role === "Reader" ||
    user.role === "Editor" ||
    user.role === "Manager" ||
    user.role === "admin";

  useEffect(() => {
    fetchJobLists();
  }, [showArchived]);

  const fetchJobLists = async () => {
    try {
      const response = await axios.get(
        `${import.meta.env.VITE_APP_ROUTE}/joblist${
          showArchived ? "/archived" : ""
        }`
      );
      let jobs = response.data;
      // Sorting the jobs from latest to oldest if archived is true

      if (showArchived) {
        jobs = jobs.sort(
          (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
        );
      }

      setJobLists(jobs);
    } catch (error) {
      console.error("Error fetching job lists:", error);
    }
  };

  const handlePrintJob = (job) => {
    const printWindow = window.open("", "_blank");
    const printContent = `
    <html>
    <head>
      <title>Print Job</title>
      <style>
        body { font-family: Arial, sans-serif; text-align: center; }
        table { width: 90%; margin: 20px auto; border-collapse: collapse; }
        th, td { border: 1px solid black; padding: 8px; text-align: center; }
        th { background-color: #f4f4f4; }
        .job-details {
          display: flex;
          justify-content: center;
          gap: 15px;
          margin-bottom: 15px;
        }
      </style>
    </head>
    <body>
      <h1>${job.jobName}</h1>
      <div class="job-details">
        <p><strong>Created By:</strong> ${job.CreatedBy || "N/A"}</p>
        <p><strong>Created At:</strong> ${
          new Date(job.createdAt).toLocaleDateString() || "N/A"
        }</p>
        <p><strong>Added By:</strong> ${job.Addedby || "N/A"}</p>
        <p><strong>Added To:</strong> ${job.Addedto || "N/A"}</p>
      </div>
      <table>
        <thead>
          <tr>
            <th>Part Name</th>
            <th>Material</th>
            <th>Length</th>
            <th>Width</th>
            <th>Quantity</th>
            <th>Grain</th>
            <th>Job Name</th>
            <th>EL</th>
            <th>ER</th>
            <th>ET</th>
            <th>EB</th>
            <th>Part Comment</th>
            <th>Item Number</th>
          </tr>
        </thead>
        <tbody>
          ${job.partlist
            .map(
              (part) => `
              <tr>
                <td>${part.partname}</td>
                <td>${part.material}</td>
                <td>${part.length ? part.length?.$numberDecimal : "N/A"}</td>
                <td>${part.width ? part.width?.$numberDecimal : "N/A"}</td>
                <td>${part.quantity}</td>
                <td>${part.grain || "N/A"}</td>
                <td>${part.jobName1 || "N/A"}</td>
                <td>${part.EL || "N/A"}</td>
                <td>${part.ER || "N/A"}</td>
                <td>${part.ET || "N/A"}</td>
                <td>${part.EB || "N/A"}</td>
                <td>${part.partcomment || "N/A"}</td>
                <td>${part.itemnumber || "N/A"}</td>
              </tr>`
            )
            .join("")}
        </tbody>
      </table>
      <script>
        window.onload = function() {
          window.print();
          window.close();
        }
      </script>
    </body>
    </html>
  `;
    printWindow.document.write(printContent);
    printWindow.document.close();
  };

  const showConfirmation = (message, action) => {
    setConfirmationMessage(message);
    setConfirmationAction(() => action);
    setIsConfirmationOpen(true);
  };

  const highlightText = (text, highlight) => {
    if (!highlight.trim()) {
      return text;
    }
    const regex = new RegExp(`(${highlight})`, "gi");
    const parts = String(text).split(regex);
    return parts.map((part, i) =>
      regex.test(part) ? (
        <mark key={i}>{part}</mark>
      ) : (
        <span key={i}>{part}</span>
      )
    );
  };

  const handleFilterChange = (newFilters) => {
    setFilters(newFilters);
  };

  const clearFilters = () => {
    setFilters({
      materials: [],
    });
  };

  const handleDelete = (id) => {
    showConfirmation("Are you sure you want to delete this job?", async () => {
      try {
        await axios.delete(`${import.meta.env.VITE_APP_ROUTE}/joblist/${id}`);
        fetchJobLists();
      } catch (error) {
        console.error("Error deleting job:", error);
      }
    });
  };

  const handleArchive = (id) => {
    showConfirmation("Are you sure you want to archive this job?", async () => {
      try {
        await axios.patch(
          `${import.meta.env.VITE_APP_ROUTE}/joblist/${id}/archive`
        );
        fetchJobLists();
      } catch (error) {
        console.error("Error archiving job:", error);
      }
    });
  };

  const handleUnarchive = (id) => {
    showConfirmation(
      "Are you sure you want to unarchive this job?",
      async () => {
        try {
          await axios.patch(
            `${import.meta.env.VITE_APP_ROUTE}/joblist/${id}/unarchive`
          );
          fetchJobLists();
        } catch (error) {
          console.error("Error unarchiving job:", error);
        }
      }
    );
  };

  const filteredJobs = jobLists.filter((job) => {
    const matchesSearch = job.jobName
      .toLowerCase()
      .includes(searchTerm.toLowerCase());

    const jobMaterials = job.partlist
      ? job.partlist.map((part) => part.material)
      : [];

    const matchesFilters =
      filters.materials.length === 0 ||
      jobMaterials.some((material) => filters.materials.includes(material));

    return matchesSearch && matchesFilters;
  });

  const highlightMaterial = (material, filters) => {
    if (!material || filters.materials.length === 0) return material;

    const regex = new RegExp(filters.materials.filter(Boolean).join("|"), "gi");

    const matches = String(material).match(regex);
    const nonMatches = String(material).split(regex);

    const highlightedParts = [];
    let matchIndex = 0;

    for (let i = 0; i < nonMatches.length; i++) {
      highlightedParts.push(<span key={`nonMatch-${i}`}>{nonMatches[i]}</span>);

      if (matches && matches[matchIndex]) {
        highlightedParts.push(
          <mark key={`match-${i}`} style={{ backgroundColor: "yellow" }}>
            {matches[matchIndex]}
          </mark>
        );
        matchIndex++;
      }
    }

    return highlightedParts;
  };

  const handleCreatePTX = (job) => {
    setCurrentJobForPTX(job);
  };

  const handlePTXMocalClose = () => {
    setIsPTXModalOpen(false);
    setCurrentJobForPTX(null);
    fetchJobLists();
  };

  useEffect(() => {
    if (currentJobForPTX) {
      setIsPTXModalOpen(true);
    }
  }, [currentJobForPTX]);

  const handleAddToExistingPartList = (job) => {
    console.log("Add to Existing Part List for", job.jobName);
  };

  return (
    <div className="job-list-container">
      {!showArchived ? (
        <h1>Job List</h1>
      ) : (
        <h1 style={{ color: "red" }}>Job List (Archived: Latest to Oldest)</h1>
      )}
      <div className="job-controls">
        <input
          type="text"
          placeholder="Search Jobs..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        {canEdit ? (
          <Link to="/add-job" className="button btn-add-job">
            Add New Job
          </Link>
        ) : (
          ""
        )}
        <button onClick={() => setIsFilterModalOpen(true)}>Filters</button>
        {Object.values(filters).some((f) => f.length > 0) && (
          <button className="btn-clear-filter" onClick={clearFilters}>
            Clear Filters
          </button>
        )}
        <button onClick={() => setShowArchived(!showArchived)}>
          {showArchived ? "Show Active" : "Show Archived"}
        </button>
        <button onClick={fetchJobLists}>Refresh</button>
        <button onClick={() => window.print()}>Print</button>
      </div>
      <div className="job-list">
        {filteredJobs.map((job) => (
          <div key={job._id} className="job-card">
            <div className="job-header">
              <h2>{highlightText(job.jobName, searchTerm)}</h2>
              <div className="job-details">
                <span>Created By: {job.CreatedBy || "N/A"}</span>
                <span>
                  Created At:{" "}
                  {new Date(job.createdAt).toLocaleDateString() || "N/A"}
                </span>
                <span>Added to: {job.Addedto || "N/A"}</span>
                <span>Added By: {job.Addedby || "N/A"}</span>
              </div>
            </div>
            <div className="job-actions">
              {canEdit ? (
                <>
                  <button onClick={() => navigate(`/edit-job/${job._id}`)}>
                    Edit
                  </button>
                  <button onClick={() => handleDelete(job._id)}>Delete</button>
                  {showArchived ? (
                    <button onClick={() => handleUnarchive(job._id)}>
                      Unarchive
                    </button>
                  ) : (
                    <button onClick={() => handleArchive(job._id)}>
                      Archive
                    </button>
                  )}
                  <button onClick={() => handlePrintJob(job)}>Print</button>
                  <button onClick={() => handleCreatePTX(job)}>
                    Create PTX
                  </button>
                  {/* <button onClick={() => handleAddToExistingPartList(job)}>
        Add to Existing Part List
      </button> */}
                </>
              ) : (
                <button onClick={() => handlePrintJob(job)}>Print</button>
              )}
            </div>
            <table>
              <thead>
                <tr>
                  <th>Part Name</th>
                  <th>Material</th>
                  <th>Length</th>
                  <th>Width</th>
                  <th>Quantity</th>
                  <th>Grain</th>
                  <th>Job Name</th>
                  <th>EL</th>
                  <th>ER</th>
                  <th>ET</th>
                  <th>EB</th>
                  <th>Part Comment</th>
                  <th>Item Number</th>
                </tr>
              </thead>
              <tbody>
                {job.partlist.map((part, index) => (
                  <tr key={index}>
                    <td>{part.partname}</td>
                    <td>{highlightMaterial(part.material, filters)}</td>
                    <td>{part.length ? part.length?.$numberDecimal : "N/A"}</td>
                    <td>{part.width ? part.width?.$numberDecimal : "N/A"}</td>
                    <td>{part.quantity}</td>
                    <td>{part.grain || "N/A"}</td>
                    <td>{part.jobName1}</td>
                    <td>{part.EL || "N/A"}</td>
                    <td>{part.ER || "N/A"}</td>
                    <td>{part.ET || "N/A"}</td>
                    <td>{part.EB || "N/A"}</td>
                    <td>{part.partcomment || "N/A"}</td>
                    <td>{part.itemnumber || "N/A"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ))}
      </div>
      {isFilterModalOpen && (
        <FilterModal
          isOpen={isFilterModalOpen}
          onClose={() => setIsFilterModalOpen(false)}
          onApply={handleFilterChange}
          jobList={jobLists}
          currentFilters={{ materials: [] }}
          ParentFunction="Filter Jobs"
        />
      )}
      {isConfirmationOpen && (
        <ConfirmationModal
          isOpen={isConfirmationOpen}
          onClose={() => setIsConfirmationOpen(false)}
          onConfirm={() => {
            confirmationAction();
            setIsConfirmationOpen(false);
          }}
          message={confirmationMessage}
        />
      )}
      <CreatePTXModal
        isOpen={isPTXModalOpen}
        onClose={() => handlePTXMocalClose()}
        onCreatePTX={() => handleCreatePTX(currentJobForPTX)}
        jobName={currentJobForPTX?.jobName || ""}
        job={currentJobForPTX}
        user={user.username}
      />
    </div>
  );
};

export default JobList;
