import { useState, useEffect } from "react";
import axios from "axios";
import "../../css/Inventory/InfeedLogs.scss";

const InfeedLogs = () => {
  const [logs, setLogs] = useState([]);
  const [daily, setDaily] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  const fetchData = async () => {
    try {
      setLoading(true);
      const [logsRes, dailyRes] = await Promise.all([
        axios.get(`${import.meta.env.VITE_APP_ROUTE}/tlfInfeedLog`),
        axios.get(`${import.meta.env.VITE_APP_ROUTE}/tlfInfeedLog/daily`),
      ]);
      setLogs(logsRes.data);
      setDaily(dailyRes.data);
    } catch (error) {
      console.error("Error fetching infeed logs:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const formatDate = (dateString) => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleString();
  };

  const formatDateTimeLocal = (dateString) => {
    if (!dateString) return "Unknown";
    const dateStr = dateString.replace("Z", "").replace(/[+-]\d{2}:\d{2}$/, "");
    return new Date(dateStr).toLocaleString();
  };

  const highlightText = (text, highlight) => {
    if (!highlight.trim()) return text;
    const regex = new RegExp(`(${highlight})`, "gi");
    const parts = String(text).split(regex);
    return parts.map((part, i) =>
      regex.test(part) ? <mark key={i}>{part}</mark> : <span key={i}>{part}</span>
    );
  };

  const filteredLogs = logs.filter((log) => {
    const term = searchTerm.toLowerCase();
    return (log.boardCode || "").toLowerCase().includes(term);
  });

  return (
    <div className="infeed-logs">
      <h1>Infeed Logs</h1>

      <p className="section-title">Daily Summary</p>
      {loading ? (
        <p>Loading...</p>
      ) : daily.length === 0 ? (
        <p className="no-data">No infeed data found.</p>
      ) : (
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Total Panels In</th>
                <th>Board Codes</th>
              </tr>
            </thead>
            <tbody>
              {daily.map((row) => (
                <tr key={row._id}>
                  <td>{row._id}</td>
                  <td className="qty-cell">{row.totalPanels}</td>
                  <td>
                    {row.boardCodes
                      .sort((a, b) => b.count - a.count)
                      .map((bc) => `${bc.boardCode} (${bc.count})`)
                      .join(", ")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <p className="section-title">Full Log</p>
      <input
        type="text"
        placeholder="Search by board code..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="search-input"
      />
      {loading ? (
        <p>Loading...</p>
      ) : filteredLogs.length === 0 ? (
        <p className="no-data">No infeed logs found.</p>
      ) : (
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Board Code</th>
                <th>From Position</th>
                <th>To Position</th>
                <th>Qty</th>
                <th>Event Time</th>
                <th>Processed At</th>
              </tr>
            </thead>
            <tbody>
              {filteredLogs.map((log) => (
                <tr key={log._id}>
                  <td>{highlightText(log.boardCode, searchTerm)}</td>
                  <td>
                    <span className="pos-badge">{log.fromPosition}</span>
                  </td>
                  <td>
                    <span className="pos-badge">{log.toPosition}</span>
                  </td>
                  <td className="qty-cell">{log.quantity}</td>
                  <td>{formatDateTimeLocal(log.eventTime)}</td>
                  <td>{formatDate(log.processedAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default InfeedLogs;
