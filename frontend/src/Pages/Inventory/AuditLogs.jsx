import { useState, useEffect, useContext, useRef } from "react";
import axios from "axios";
import "../../css/Inventory/AuditLogs.scss";
import { AuthContext } from "../../Components/AuthContext";

const AuditLogs = () => {
  const { user } = useContext(AuthContext);
  const [audits, setAudits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedAudits, setExpandedAudits] = useState(new Set());
  const [expandedBoards, setExpandedBoards] = useState(new Set());
  const [searchTerm, setSearchTerm] = useState("");
  const [hideEmptyLogs, setHideEmptyLogs] = useState(false);
  const printRef = useRef();

  const fetchAudits = async () => {
    try {
      setLoading(true);
      const response = await axios.get(
        `${import.meta.env.VITE_APP_ROUTE}/tlfSyncAudit?limit=10000`,
      );
      setAudits(response.data);
    } catch (error) {
      console.error("Error fetching audit logs:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAudits();
  }, []);

  const handlePrint = () => {
    window.print();
  };

  const toggleAudit = (syncId) => {
    const newExpanded = new Set(expandedAudits);
    if (newExpanded.has(syncId)) {
      newExpanded.delete(syncId);
    } else {
      newExpanded.add(syncId);
    }
    setExpandedAudits(newExpanded);
  };

  const toggleBoard = (key) => {
    const newExpanded = new Set(expandedBoards);
    if (newExpanded.has(key)) {
      newExpanded.delete(key);
    } else {
      newExpanded.add(key);
    }
    setExpandedBoards(newExpanded);
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return "Unknown";
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  const formatDateTimeLocal = (dateString) => {
    if (!dateString) return "Unknown";
    const dateStr = dateString.replace("Z", "").replace(/[+-]\d{2}:\d{2}$/, "");
    const date = new Date(dateStr);
    return date.toLocaleString();
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
      ),
    );
  };

  const filteredAudits = audits.filter((audit) => {
    const term = searchTerm.toLowerCase();
    const matchesSearch =
      (audit.syncId || "").toLowerCase().includes(term) ||
      audit.boards?.some((b) =>
        (b.boardCode || "").toLowerCase().includes(term),
      );

    if (!matchesSearch) return false;

    if (hideEmptyLogs) {
      const hasBoards = audit.boards && audit.boards.length > 0;
      const hasEvents = (audit.summary?.totalEvents || 0) > 0;
      const cursorChanged =
        (audit.cursor?.previous || 0) !== (audit.cursor?.next || 0);

      if (!hasBoards && !hasEvents && !cursorChanged) {
        return false;
      }
    }

    return true;
  });

  return (
    <div className="audit-logs" ref={printRef}>
      <div className="print-header">
        {user && <p>Printed by: {user.username}</p>}
      </div>
      {loading ? (
        <p>Loading...</p>
      ) : filteredAudits.length === 0 && !searchTerm ? (
        <p className="no-data">No audit logs found.</p>
      ) : (
        <div className="audit-groups">
          <h1>TLF Sync Audit Logs</h1>
          <div className="controls-container">
            <input
              type="text"
              placeholder="Search by Sync ID or Board Code..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={hideEmptyLogs}
                onChange={(e) => setHideEmptyLogs(e.target.checked)}
                className="hide-empty-checkbox"
              />
              <span>Hide Empty Logs</span>
            </label>
            <button className="print-button" onClick={handlePrint}>
              Print
            </button>
          </div>

          {filteredAudits.map((audit) => {
            const isExpanded = expandedAudits.has(audit.syncId);
            const duration =
              audit.startedAt && audit.finishedAt
                ? (
                    (new Date(audit.finishedAt) - new Date(audit.startedAt)) /
                    1000
                  ).toFixed(2)
                : "N/A";

            return (
              <div key={audit._id} className="audit-group-block">
                <div
                  className="group-header"
                  onClick={() => toggleAudit(audit.syncId)}
                >
                  <span className="toggle-icon">{isExpanded ? "▼" : "▶"}</span>
                  <span className="sync-id">{audit.syncId}</span>
                  <span className="date">
                    {formatDateTime(audit.startedAt)}
                  </span>
                  <span className="duration">Duration: {duration}s</span>
                </div>

                {isExpanded && (
                  <div className="audit-content">
                    {/* Summary Section */}
                    <div className="summary-section">
                      <h3>Summary</h3>
                      <div className="summary-grid">
                        <div className="summary-item">
                          <span className="label">Boards Touched:</span>
                          <span className="value">
                            {audit.summary?.boardsTouched || 0}
                          </span>
                        </div>
                        <div className="summary-item">
                          <span className="label">Total Events:</span>
                          <span className="value">
                            {audit.summary?.totalEvents || 0}
                          </span>
                        </div>
                        <div className="summary-item">
                          <span className="label">Total Warehouse Delta:</span>
                          <span className="value">
                            {audit.summary?.totalWarehouseDelta || 0}
                          </span>
                        </div>
                        <div className="summary-item">
                          <span className="label">Total Orphans:</span>
                          <span className="value orphans">
                            {audit.summary?.totalOrphans || 0}
                          </span>
                        </div>
                        <div className="summary-item">
                          <span className="label">Cursor Previous:</span>
                          <span className="value">
                            {audit.cursor?.previous || 0}
                          </span>
                        </div>
                        <div className="summary-item">
                          <span className="label">Cursor Next:</span>
                          <span className="value">
                            {audit.cursor?.next || 0}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Boards Section */}
                    {audit.boards && audit.boards.length > 0 && (
                      <div className="boards-section">
                        <h3>Board Details ({audit.boards.length})</h3>
                        {audit.boards.map((board, idx) => {
                          const boardKey = `${audit.syncId}-${board.boardCode}-${idx}`;
                          const isBoardExpanded = expandedBoards.has(boardKey);

                          return (
                            <div key={boardKey} className="board-item">
                              <div
                                className="board-header"
                                onClick={() => toggleBoard(boardKey)}
                              >
                                <span className="toggle-icon">
                                  {isBoardExpanded ? "▼" : "▶"}
                                </span>
                                <span className="board-code">
                                  {highlightText(board.boardCode, searchTerm)}
                                </span>
                                <span className="board-stats">
                                  Events: {board.events?.total || 0} | TLF:{" "}
                                  {board.events?.fromTLF || 0} | WH:{" "}
                                  {board.events?.fromWarehouse || 0} | Unknown:{" "}
                                  {board.events?.unknown || 0}
                                </span>
                              </div>

                              {isBoardExpanded && (
                                <div className="board-details">
                                  {/* Snapshot Info */}
                                  <div className="detail-section">
                                    <h4>TLF Snapshot</h4>
                                    <table className="detail-table">
                                      <tbody>
                                        <tr>
                                          <td>Old TLF Qty:</td>
                                          <td>
                                            {board.snapshot?.oldTlfQty || 0}
                                          </td>
                                        </tr>
                                        <tr>
                                          <td>New TLF Qty:</td>
                                          <td>
                                            {board.snapshot?.newTlfQty || 0}
                                          </td>
                                        </tr>
                                        <tr>
                                          <td>Delta T:</td>
                                          <td
                                            className={
                                              board.snapshot?.deltaT < 0
                                                ? "negative"
                                                : "positive"
                                            }
                                          >
                                            {board.snapshot?.deltaT || 0}
                                          </td>
                                        </tr>
                                        <tr>
                                          <td>Old TLF Debt:</td>
                                          <td>
                                            {board.snapshot?.oldTlfDebt || 0}
                                          </td>
                                        </tr>
                                        <tr>
                                          <td>New TLF Debt:</td>
                                          <td>
                                            {board.snapshot?.newTlfDebt || 0}
                                          </td>
                                        </tr>
                                      </tbody>
                                    </table>
                                  </div>

                                  {/* Warehouse Info */}
                                  <div className="detail-section">
                                    <h4>Warehouse Snapshot</h4>
                                    <table className="detail-table">
                                      <tbody>
                                        <tr>
                                          <td>Existed:</td>
                                          <td>
                                            {board.warehouse?.existed
                                              ? "Yes"
                                              : "No"}
                                          </td>
                                        </tr>
                                        <tr>
                                          <td>Old Qty:</td>
                                          <td>
                                            {board.warehouse?.warehouseOld || 0}
                                          </td>
                                        </tr>
                                        <tr>
                                          <td>New Qty:</td>
                                          <td>
                                            {board.warehouse?.warehouseNew ??
                                              "N/A"}
                                          </td>
                                        </tr>
                                        <tr>
                                          <td>Delta Raw:</td>
                                          <td
                                            className={
                                              board.warehouse
                                                ?.warehouseDeltaRaw < 0
                                                ? "negative"
                                                : "positive"
                                            }
                                          >
                                            {board.warehouse
                                              ?.warehouseDeltaRaw || 0}
                                          </td>
                                        </tr>
                                        <tr>
                                          <td>Delta Applied:</td>
                                          <td
                                            className={
                                              board.warehouse
                                                ?.warehouseDeltaApplied < 0
                                                ? "negative"
                                                : "positive"
                                            }
                                          >
                                            {board.warehouse
                                              ?.warehouseDeltaApplied || 0}
                                          </td>
                                        </tr>
                                        <tr>
                                          <td>Deficit:</td>
                                          <td
                                            className={
                                              board.warehouse?.deficit > 0
                                                ? "deficit"
                                                : ""
                                            }
                                          >
                                            {board.warehouse?.deficit || 0}
                                          </td>
                                        </tr>
                                      </tbody>
                                    </table>
                                  </div>

                                  {/* Events Details */}
                                  {board.events?.details &&
                                    board.events.details.length > 0 && (
                                      <div className="detail-section full-width">
                                        <h4>
                                          Events ({board.events.details.length})
                                        </h4>
                                        <div className="table-container">
                                          <table>
                                            <thead>
                                              <tr>
                                                <th>Row ID</th>
                                                <th>Auslager ID</th>
                                                <th>Dest</th>
                                                <th>Source</th>
                                                <th>Job Name</th>
                                                <th>Plan</th>
                                                <th>Event Time</th>
                                              </tr>
                                            </thead>
                                            <tbody>
                                              {board.events.details.map(
                                                (event, eventIdx) => (
                                                  <tr
                                                    key={eventIdx}
                                                    className={`source-${event.source?.toLowerCase()}`}
                                                  >
                                                    <td>
                                                      {event.auslagerRowId}
                                                    </td>
                                                    <td>{event.auslagerId}</td>
                                                    <td>{event.dest}</td>
                                                    <td>
                                                      <span
                                                        className={`source-badge ${event.source?.toLowerCase()}`}
                                                      >
                                                        {event.source}
                                                      </span>
                                                    </td>
                                                    <td>
                                                      {event.jobName || "-"}
                                                    </td>
                                                    <td>{event.plan || "-"}</td>
                                                    <td>
                                                      {formatDateTimeLocal(
                                                        event.eventTime,
                                                      )}
                                                    </td>
                                                  </tr>
                                                ),
                                              )}
                                            </tbody>
                                          </table>
                                        </div>
                                      </div>
                                    )}

                                  {/* Orphans Details */}
                                  {board.orphans?.details &&
                                    board.orphans.details.length > 0 && (
                                      <div className="detail-section full-width orphan-section">
                                        <h4>Orphans ({board.orphans.count})</h4>
                                        <div className="table-container">
                                          <table>
                                            <thead>
                                              <tr>
                                                <th>Row ID</th>
                                                <th>Auslager ID</th>
                                                <th>Dest</th>
                                                <th>Source</th>
                                                <th>Job Name</th>
                                                <th>Plan</th>
                                                <th>Event Time</th>
                                              </tr>
                                            </thead>
                                            <tbody>
                                              {board.orphans.details.map(
                                                (orphan, orphanIdx) => (
                                                  <tr
                                                    key={orphanIdx}
                                                    className="orphan-row"
                                                  >
                                                    <td>
                                                      {orphan.auslagerRowId}
                                                    </td>
                                                    <td>{orphan.auslagerId}</td>
                                                    <td>{orphan.dest}</td>
                                                    <td>
                                                      <span className="source-badge unknown">
                                                        {orphan.source}
                                                      </span>
                                                    </td>
                                                    <td>
                                                      {orphan.jobName || "-"}
                                                    </td>
                                                    <td>
                                                      {orphan.plan || "-"}
                                                    </td>
                                                    <td>
                                                      {formatDateTime(
                                                        orphan.eventTime,
                                                      )}
                                                    </td>
                                                  </tr>
                                                ),
                                              )}
                                            </tbody>
                                          </table>
                                        </div>
                                      </div>
                                    )}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default AuditLogs;
