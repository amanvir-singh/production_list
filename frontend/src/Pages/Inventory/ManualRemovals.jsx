import { useState, useEffect } from "react";
import axios from "axios";
import "../../css/Inventory/ManualRemovals.scss";

const API = import.meta.env.VITE_APP_ROUTE;

const formatDT = (d) => {
  if (!d) return "-";
  return new Date(d).toLocaleString();
};

const toDatetimeLocal = (date) => {
  if (!date) return "";
  const d = new Date(date);
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 16);
};

// ── Section A: Auto-cleared records from TLFManualRemoval ──────────────────

const AutoClearedSection = () => {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fromDT, setFromDT] = useState("");
  const [toDT, setToDT] = useState("");

  const fetch = async (f = fromDT, t = toDT) => {
    setLoading(true);
    try {
      const params = {};
      if (f) params.from = new Date(f).toISOString();
      if (t) params.to   = new Date(t).toISOString();
      const res = await axios.get(`${API}/tlfManualRemoval`, { params });
      setRecords(res.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetch(); }, []);

  return (
    <>
      <div className="filters">
        <label>From</label>
        <input type="datetime-local" value={fromDT} onChange={(e) => setFromDT(e.target.value)} />
        <label>To</label>
        <input type="datetime-local" value={toDT}   onChange={(e) => setToDT(e.target.value)} />
        <button className="filter-btn" onClick={() => fetch()}>Apply</button>
        <button className="clear-btn" onClick={() => { setFromDT(""); setToDT(""); fetch("", ""); }}>Reset</button>
      </div>

      {loading ? (
        <p className="no-data">Loading...</p>
      ) : records.length === 0 ? (
        <p className="no-data">No auto-cleared removals found in this period.</p>
      ) : (
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Board Code</th>
                <th>Qty Written Off</th>
                <th>Stale Syncs</th>
                <th>Detected At</th>
                <th>Note</th>
              </tr>
            </thead>
            <tbody>
              {records.map((r) => (
                <tr key={r._id}>
                  <td>{r.boardCode}</td>
                  <td className="qty-cell">{r.qty}</td>
                  <td className="stale-cell">{r.staleSyncs} syncs</td>
                  <td>{formatDT(r.detectedAt)}</td>
                  <td>{r.note}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
};

// ── Section B: Historical stale debts from TLFSyncAudit ───────────────────

const BoardDebtNode = ({ board }) => {
  const [expanded, setExpanded] = useState(false);
  const sorted = [...board.history].sort((a, b) => new Date(a.startedAt) - new Date(b.startedAt));

  return (
    <div className={`board-node ${expanded ? "expanded" : ""}`}>
      <div className="board-header" onClick={() => setExpanded((p) => !p)}>
        <span className="chevron">{expanded ? "▼" : "▶"}</span>
        <span className="board-code">{board._id}</span>
        <div className="meta">
          <span className="sync-count">{board.syncCount} sync{board.syncCount !== 1 ? "s" : ""} in debt</span>
          <span className="debt-badge">max {board.maxDebt} · current {board.lastDebt}</span>
          <span className="last-seen">last {formatDT(board.lastSeen)}</span>
        </div>
      </div>

      {expanded && (
        <div className="debt-table-wrapper">
          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>Sync Time</th>
                <th>deltaT</th>
                <th>Debt Before</th>
                <th>Debt After</th>
                <th>Change</th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((s, i) => {
                const change = s.newDebt - s.oldDebt;
                return (
                  <tr key={s.syncId}>
                    <td>{i + 1}</td>
                    <td>{formatDT(s.startedAt)}</td>
                    <td>{s.deltaT >= 0 ? `+${s.deltaT}` : s.deltaT}</td>
                    <td>{s.oldDebt}</td>
                    <td>{s.newDebt}</td>
                    <td className={change > 0 ? "debt-change-pos" : change < 0 ? "debt-change-neg" : ""}>
                      {change > 0 ? `+${change}` : change}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

const HistoricalDebtsSection = () => {
  const [boards, setBoards] = useState([]);
  const [loading, setLoading] = useState(false);
  const [earliestSync, setEarliestSync] = useState(null);
  const [fromDT, setFromDT] = useState("");
  const [toDT, setToDT] = useState("");

  useEffect(() => {
    axios.get(`${API}/tlfSyncAudit/earliest`).then((res) => {
      if (res.data?.startedAt) {
        setEarliestSync(res.data.startedAt);
        const dt = toDatetimeLocal(res.data.startedAt);
        setFromDT(dt);
        fetchData(dt, "");
      } else {
        fetchData("", "");
      }
    }).catch(() => fetchData("", ""));
  }, []);

  const fetchData = async (f = fromDT, t = toDT) => {
    setLoading(true);
    try {
      const params = {};
      if (f) params.from = new Date(f).toISOString();
      if (t) params.to   = new Date(t).toISOString();
      const res = await axios.get(`${API}/tlfSyncAudit/stale-debts`, { params });
      setBoards(res.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    const dt = earliestSync ? toDatetimeLocal(earliestSync) : "";
    setFromDT(dt);
    setToDT("");
    fetchData(dt, "");
  };

  return (
    <>
      <div className="filters">
        <label>From</label>
        <input type="datetime-local" value={fromDT} onChange={(e) => setFromDT(e.target.value)} />
        <label>To</label>
        <input type="datetime-local" value={toDT}   onChange={(e) => setToDT(e.target.value)} />
        <button className="filter-btn" onClick={() => fetchData()}>Apply</button>
        <button className="clear-btn" onClick={handleReset}>Reset</button>
      </div>

      {loading ? (
        <p className="no-data">Loading...</p>
      ) : boards.length === 0 ? (
        <p className="no-data">No persistent debts found in this period.</p>
      ) : (
        <div className="board-list">
          {boards.map((b) => (
            <BoardDebtNode key={b._id} board={b} />
          ))}
        </div>
      )}
    </>
  );
};

// ── Main page ─────────────────────────────────────────────────────────────

const ManualRemovals = () => {
  const [activeTab, setActiveTab] = useState("historical");

  return (
    <div className="manual-removals">
      <h1>Manual Removals & Stale Debts</h1>

      <div className="section-tabs">
        <button
          className={activeTab === "historical" ? "active" : ""}
          onClick={() => setActiveTab("historical")}
        >
          Historical Stale Debts
        </button>
        <button
          className={activeTab === "autoCleared" ? "active" : ""}
          onClick={() => setActiveTab("autoCleared")}
        >
          Auto-Cleared Removals
        </button>
      </div>

      <div className="section-body">
        {activeTab === "historical" ? <HistoricalDebtsSection /> : <AutoClearedSection />}
      </div>
    </div>
  );
};

export default ManualRemovals;
