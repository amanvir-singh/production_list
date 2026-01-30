import { useState, useEffect } from "react";
import axios from "axios";
import "../../css/Inventory/OrphanPanels.scss";

const highlightText = (text, highlight) => {
    if (!highlight || !highlight.trim()) {
      return text;
    }
    const regex = new RegExp(`(${highlight})`, "gi");
    const parts = String(text).split(regex);
    return parts.map((part, i) =>
      regex.test(part) ? <mark key={i}>{part}</mark> : <span key={i}>{part}</span>
    );
  };

const JobGroup = ({ jobName, events, searchTerm }) => {
  const [expanded, setExpanded] = useState(false);
  const formattedDate = (d) => new Date(d).toLocaleString();

  return (
    <div className="job-group">
      <div className="job-header" onClick={() => setExpanded(!expanded)}>
        <span className="toggle-icon">{expanded ? "▼" : "▶"}</span>
        <span className="job-name">{highlightText(jobName || "Unknown Job", searchTerm)}</span>
        <span className="job-qty">Count: {events.length}</span>
      </div>
      {expanded && (
        <div className="job-events">
            <table>
                <thead>
                    <tr>
                        <th>Destination</th>
                        <th>Plan</th>
                        <th>Event Time</th>
                    </tr>
                </thead>
                <tbody>
                    {events.map((evt, idx) => (
                        <tr key={idx}>
                            <td>{evt.dest}</td>
                            <td>{evt.plan}</td>
                            <td>{formattedDate(evt.eventTime)}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
      )}
    </div>
  );
};

const OrphanPanelRow = ({ panel, searchTerm }) => {
    const [expanded, setExpanded] = useState(false);

    const eventsByJob = panel.events ? panel.events.reduce((acc, evt) => {
        const jName = evt.jobName || "Unknown";
        if (!acc[jName]) acc[jName] = [];
        acc[jName].push(evt);
        return acc;
    }, {}) : {};

    const jobNames = Object.keys(eventsByJob).sort();

    return (
        <>
            <tr className={`panel-row ${expanded ? 'expanded' : ''}`} onClick={() => setExpanded(!expanded)}>
                <td>{highlightText(panel.boardCode, searchTerm)}</td>
                <td>{panel.totalQty}</td>
                <td>{new Date(panel.firstSeenAt).toLocaleDateString()}</td>
                <td>{new Date(panel.lastSeenAt).toLocaleDateString()}</td>
            </tr>
            {expanded && (
                <tr>
                    <td colSpan="4" style={{ padding: 0 }}>
                        <div className="events-section">
                           <div className="tree-root">
                                <h3>Events Breakdown</h3>
                                {jobNames.length === 0 ? <p>No events recorded.</p> : (
                                    jobNames.map(jName => (
                                        <JobGroup key={jName} jobName={jName} events={eventsByJob[jName]} searchTerm={searchTerm} />
                                    ))
                                )}
                           </div>
                        </div>
                    </td>
                </tr>
            )}
        </>
    )
}

const OrphanPanels = () => {
  const [panels, setPanels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  const fetchPanels = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${import.meta.env.VITE_APP_ROUTE}/orphanPanels`);
      setPanels(response.data);
    } catch (error) {
      console.error("Error fetching orphan panels:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPanels();
  }, []);

  const filteredPanels = panels.filter((panel) => {
    const term = searchTerm.toLowerCase();
    const boardCodeMatch = (panel.boardCode || "").toLowerCase().includes(term);
    const eventMatch = panel.events && panel.events.some(evt => 
        (evt.jobName || "").toLowerCase().includes(term)
    );

    return boardCodeMatch || eventMatch;
  });

  return (
    <div className="orphan-panels">
      <h1>Orphan Panels</h1>
      <input
        type="text"
        placeholder="Search..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="search-input"
      />
      {loading ? (
        <p>Loading...</p>
      ) : filteredPanels.length === 0 ? (
        <p className="no-data">No orphan panels found.</p>
      ) : (
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Board Code</th>
                <th>Total Qty</th>
                <th>First Seen At</th>
                <th>Last Seen At</th>
              </tr>
            </thead>
            <tbody>
              {filteredPanels.map((panel) => (
                <OrphanPanelRow key={panel._id} panel={panel} searchTerm={searchTerm} />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default OrphanPanels;
