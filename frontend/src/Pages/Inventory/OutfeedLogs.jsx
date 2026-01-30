import { useState, useEffect } from "react";
import axios from "axios";
import "../../css/Inventory/OutfeedLogs.scss";

const OutfeedLogs = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${import.meta.env.VITE_APP_ROUTE}/outfeedLogs`);
      setLogs(response.data);
    } catch (error) {
      console.error("Error fetching outfeed logs:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const formatDate = (dateString) => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleString();
  };

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

  const filteredLogs = logs.filter((log) => {
    const term = searchTerm.toLowerCase();
    return (
      (log.boardCode || "").toLowerCase().includes(term) ||
      (log.jobName || "").toLowerCase().includes(term) ||
      (log.plan || "").toLowerCase().includes(term) ||
      (log.dest || "").toLowerCase().includes(term) ||
      (log.source || "").toLowerCase().includes(term)
    );
  });

  return (
    <div className="outfeed-logs">
      <h1>Outfeed Logs</h1>
      <input
        type="text"
        placeholder="Search logs..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="search-input"
      />
      {loading ? (
        <p>Loading...</p>
      ) : filteredLogs.length === 0 ? (
        <p className="no-data">No outfeed logs found.</p>
      ) : (
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Board Code</th>
                <th>Job Name</th>
                <th>Plan</th>
                <th>Dest</th>
                <th>Source</th>
                <th>Qty</th>
                <th>Processed At</th>
                <th>Event Time</th>
              </tr>
            </thead>
            <tbody>
              {filteredLogs.map((log) => (
                <tr key={log._id}>
                  <td>{highlightText(log.boardCode, searchTerm)}</td>
                  <td>{highlightText(log.jobName, searchTerm)}</td>
                  <td>{highlightText(log.plan, searchTerm)}</td>
                  <td>
                    <span className="dest-badge">{highlightText(log.dest, searchTerm)}</span>
                  </td>
                  <td>
                    <span className={`source-badge ${log.source}`}>{highlightText(log.source, searchTerm)}</span>
                  </td>
                  <td className="qty-cell">{log.quantity}</td>
                  <td>{formatDate(log.processedAt)}</td>
                  <td>{formatDate(log.eventTime)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default OutfeedLogs;
