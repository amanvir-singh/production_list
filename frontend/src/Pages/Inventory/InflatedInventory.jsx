import { useState, useEffect } from "react";
import axios from "axios";
import "../../css/Inventory/InflatedInventory.scss";

const API = import.meta.env.VITE_APP_ROUTE;

const formatDT = (dateStr) => {
  if (!dateStr) return "-";
  return new Date(dateStr).toLocaleString();
};

const toDatetimeLocal = (date) => {
  if (!date) return "";
  const d = new Date(date);
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 16);
};

const BoardNode = ({ board }) => {
  const [expanded, setExpanded] = useState(false);
  const sorted = [...board.syncs].sort((a, b) => new Date(a.startedAt) - new Date(b.startedAt));

  return (
    <div className={`board-node ${expanded ? "expanded" : ""}`}>
      <div className="board-header" onClick={() => setExpanded((p) => !p)}>
        <span className="chevron">{expanded ? "▼" : "▶"}</span>
        <span className="board-code">{board._id}</span>
        <div className="meta">
          <span className="sync-count">{board.syncCount} sync{board.syncCount !== 1 ? "s" : ""}</span>
          <span className="inflation-total">{board.totalInflation}</span>
        </div>
      </div>

      {expanded && (
        <div className="sync-table-wrapper">
          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>Sync Time</th>
                <th>TLF Δ (deltaT)</th>
                <th>Raw Δ</th>
                <th>Applied Δ</th>
                <th>Qty Change</th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((s, i) => (
                <tr key={s.syncId}>
                  <td>{i + 1}</td>
                  <td>{formatDT(s.startedAt)}</td>
                  <td>{s.deltaT >= 0 ? `+${s.deltaT}` : s.deltaT}</td>
                  <td className="delta-raw">+{s.warehouseDeltaRaw}</td>
                  <td className="delta-applied">+{s.warehouseDeltaApplied}</td>
                  <td className="qty-change">
                    {s.warehouseOld}
                    <span className="arrow">→</span>
                    {s.warehouseNew}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

const InflatedInventory = () => {
  const [boards, setBoards] = useState([]);
  const [loading, setLoading] = useState(false);
  const [earliestSync, setEarliestSync] = useState(null);

  const [fromDT, setFromDT] = useState("");
  const [toDT, setToDT] = useState("");

  // Load earliest sync date on mount to set default "from"
  useEffect(() => {
    axios.get(`${API}/tlfSyncAudit/earliest`).then((res) => {
      if (res.data?.startedAt) {
        setEarliestSync(res.data.startedAt);
        setFromDT(toDatetimeLocal(res.data.startedAt));
      }
    }).catch(() => {});
  }, []);

  // Fetch once "from" default is ready
  useEffect(() => {
    if (fromDT !== "" || earliestSync !== null) {
      fetchInflated();
    }
  }, [earliestSync]);

  const fetchInflated = async () => {
    setLoading(true);
    try {
      const params = {};
      if (fromDT) params.from = new Date(fromDT).toISOString();
      if (toDT)   params.to   = new Date(toDT).toISOString();

      const res = await axios.get(`${API}/tlfSyncAudit/inflated`, { params });
      setBoards(res.data);
    } catch (err) {
      console.error("Error fetching inflated inventory:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleClear = () => {
    setFromDT(earliestSync ? toDatetimeLocal(earliestSync) : "");
    setToDT("");
    fetchInflated();
  };

  const totalInflation = boards.reduce((sum, b) => sum + b.totalInflation, 0);

  return (
    <div className="inflated-inventory">
      <h1>Phantom Inventory Inflation</h1>

      <div className="filters">
        <label>From</label>
        <input
          type="datetime-local"
          value={fromDT}
          onChange={(e) => setFromDT(e.target.value)}
        />
        <label>To</label>
        <input
          type="datetime-local"
          value={toDT}
          onChange={(e) => setToDT(e.target.value)}
          placeholder="Now"
        />
        <button className="filter-btn" onClick={fetchInflated}>
          Apply
        </button>
        <button className="clear-btn" onClick={handleClear}>
          Reset
        </button>
        {!loading && boards.length > 0 && (
          <span className="summary-badge">
            {boards.length} board{boards.length !== 1 ? "s" : ""} affected · +{totalInflation} phantom panels total
          </span>
        )}
      </div>

      {loading ? (
        <p className="no-data">Loading...</p>
      ) : boards.length === 0 ? (
        <p className="no-data">No phantom inflation found in this period.</p>
      ) : (
        <div className="board-list">
          {boards.map((board) => (
            <BoardNode key={board._id} board={board} />
          ))}
        </div>
      )}
    </div>
  );
};

export default InflatedInventory;
