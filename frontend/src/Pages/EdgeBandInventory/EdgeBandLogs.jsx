import { useState, useEffect } from "react";
import axios from "axios";
import "../../css/Logs/LogList.scss";

const EdgeBandLogs = () => {
  const [logs, setLogs] = useState([]);
  const [filteredLogs, setFilteredLogs] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedLog, setSelectedLog] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    if (searchTerm) {
      searchLogs();
    } else {
      fetchLogs();
    }
  }, [currentPage, searchTerm]);

  const fetchLogs = async () => {
    try {
      const response = await axios.get(
        `${import.meta.env.VITE_APP_ROUTE}/edgeBandLog?page=${currentPage}&limit=50`
      );
      setLogs(response.data.logs);
      setFilteredLogs(response.data.logs);
      setTotalPages(response.data.totalPages);
      setIsSearching(false);
    } catch (error) {
      console.error("Error fetching edgeband logs:", error);
    }
  };

  const searchLogs = async () => {
    setIsSearching(true);
    try {
      const response = await axios.get(
        `${import.meta.env.VITE_APP_ROUTE}/edgeBandLog/search?term=${searchTerm}`
      );
      setFilteredLogs(response.data.logs);
      setTotalPages(1);
    } catch (error) {
      console.error("Error searching edgeband logs:", error);
    }
  };

  const handlePageChange = (newPage) => {
    setCurrentPage(newPage);
  };

  const handleSearch = (event) => {
    setSearchTerm(event.target.value);
    setCurrentPage(1);
  };

  const openModal = (log) => {
    setSelectedLog(log);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedLog(null);
  };

  const highlightText = (text, highlight) => {
    if (!highlight.trim()) {
      return <span>{text}</span>;
    }
    const regex = new RegExp(`(${highlight})`, "gi");
    const parts = text.split(regex);
    return (
      <span>
        {parts
          .filter(String)
          .map((part, i) =>
            regex.test(part) ? (
              <mark key={i}>{part}</mark>
            ) : (
              <span key={i}>{part}</span>
            )
          )}
      </span>
    );
  };

  const renderDataComparison = (previousData, updatedData) => {
    const allKeys = new Set([
      ...Object.keys(previousData || {}),
      ...Object.keys(updatedData || {}),
    ]);
    return Array.from(allKeys).map((key) => (
      <tr key={key}>
        <td>{key}</td>
        <td>{JSON.stringify(previousData?.[key])}</td>
        <td>{JSON.stringify(updatedData?.[key])}</td>
      </tr>
    ));
  };

  return (
    <div className="log-list">
      <input
        type="text"
        placeholder="Search logs..."
        value={searchTerm}
        onChange={handleSearch}
        className="search-input"
      />
      <table>
        <thead>
          <tr>
            <th>User</th>
            <th>Action</th>
            <th>Logged At</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {filteredLogs.map((log) => (
            <tr key={log._id}>
              <td>{highlightText(log.user, searchTerm)}</td>
              <td>{highlightText(log.action, searchTerm)}</td>
              <td>{new Date(log.loggedAt).toLocaleString()}</td>
              <td>
                <button onClick={() => openModal(log)}>Details</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {!isSearching && (
        <div className="pagination">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
            <button
              key={page}
              onClick={() => handlePageChange(page)}
              className={currentPage === page ? "active" : ""}
            >
              {page}
            </button>
          ))}
        </div>
      )}
      {isModalOpen && (
        <div className="modal">
          <div className="modal-content">
            <h2>Log Details</h2>
            <p>
              <strong>User:</strong>{" "}
              {highlightText(selectedLog.user, searchTerm)}
            </p>
            <p>
              <strong>Action:</strong>{" "}
              {highlightText(selectedLog.action, searchTerm)}
            </p>
            <p>
              <strong>Logged At:</strong>{" "}
              {new Date(selectedLog.loggedAt).toLocaleString()}
            </p>
            {(selectedLog.previousData || selectedLog.updatedData) && (
              <div className="data-comparison">
                <h3>Data Comparison</h3>
                <table>
                  <thead>
                    <tr>
                      <th>Field</th>
                      <th>Previous Value</th>
                      <th>Updated Value</th>
                    </tr>
                  </thead>
                  <tbody>
                    {renderDataComparison(
                      selectedLog.previousData,
                      selectedLog.updatedData
                    )}
                  </tbody>
                </table>
              </div>
            )}
            <button onClick={closeModal}>Close</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default EdgeBandLogs;
