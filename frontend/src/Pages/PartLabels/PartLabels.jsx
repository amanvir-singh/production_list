import { useState, useEffect, useContext } from "react";
import axios from "axios";
import "../../css/PartLabels/PartLabels.scss";
import { AuthContext } from "../../Components/AuthContext";
import { useNavigate } from "react-router-dom";

const PartLabels = () => {
  const [mprfiles, setMprFiles] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFileIndex, setSelectedFileIndex] = useState(null);
  const [errorModalOpen, setErrorModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();

  useEffect(() => {
    fetchMPRFiles();
  }, []);

  const fetchMPRFiles = async () => {
    setLoading(true);
    try {
      const response = await axios.get(
        `${import.meta.env.VITE_APP_ROUTE}/partlabels/mprfiles`
      );
      setMprFiles(response.data || []);
    } catch (error) {
      console.error("Error fetching MPR files:", error);
      setErrorModalOpen(true);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    setSearchQuery(e.target.value);
  };

  const handleClick = (index) => {
    setSelectedFileIndex(index === selectedFileIndex ? null : index);
  };

  const handleDoubleClick = (file) => {
    navigate(`/labelpreview/view/${encodeURIComponent(file.name)}`);
  };

  const filteredFiles = searchQuery.trim()
    ? mprfiles.filter((file) =>
        file.name.toLowerCase().includes(searchQuery.trim().toLowerCase())
      )
    : mprfiles;

  return (
    <div className="part-labels-page">
      <div className="header">
        <h2>Part Labels</h2>
        {user && <p>Logged in as: {user.username}</p>}
        <input
          type="text"
          placeholder="Search files..."
          value={searchQuery}
          onChange={handleSearch}
        />
      </div>

      <div className="file-list">
        {loading ? (
          <div className="loading-screen">
            <p>Loading MPR files...</p>
          </div>
        ) : filteredFiles.length === 0 ? (
          <p>No MPR files to display</p>
        ) : filteredFiles.length === 0 ? (
          <p>No MPR files to display</p>
        ) : (
          filteredFiles.map((file, index) => (
            <div
              key={`${file.name}-${index}`}
              className={`file-item ${
                selectedFileIndex === index ? "selected" : ""
              }`}
              onClick={() => handleClick(index)}
              onDoubleClick={() => handleDoubleClick(file)}
            >
              {searchQuery
                ? file.name
                    .split(new RegExp(`(${searchQuery})`, "gi"))
                    .map((part, i) =>
                      part.toLowerCase() === searchQuery.toLowerCase() ? (
                        <span key={i} className="highlight">
                          {part}
                        </span>
                      ) : (
                        part
                      )
                    )
                : file.name}
            </div>
          ))
        )}
      </div>

      {errorModalOpen && (
        <div className="error-modal">
          <div className="error-modal-content">
            <h3>Failed to Fetch MPR Files</h3>
            <button onClick={() => setErrorModalOpen(false)}>OK</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default PartLabels;
