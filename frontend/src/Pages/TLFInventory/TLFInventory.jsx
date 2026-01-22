import { useState, useEffect, useContext, useRef } from "react";
import axios from "axios";
import "../../css/TLFInventory/TLFInventory.scss";
import { AuthContext } from "../../Components/AuthContext";

const TLFInventory = () => {
  const [inventoryData, setInventoryData] = useState([]);
  const [isHideZeroQty, setIsHideZeroQty] = useState(false);
  const [lastFetchedAt, setLastFetchedAt] = useState(null);
  const [errorModalOpen, setErrorModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const { user } = useContext(AuthContext);
  const printRef = useRef();
  const [selectedRowIndex, setSelectedRowIndex] = useState(null);

  // Initial load from REST (latest snapshot)
  useEffect(() => {
    const loadInitial = async () => {
      try {
        const res = await axios.get(
          `${import.meta.env.VITE_APP_ROUTE}/TLFInventory`
        );
        const doc = res.data;
        if (doc) {
          setInventoryData(doc.boards || []);
          setLastFetchedAt(
            doc.FetchedAt ? new Date(doc.FetchedAt).toLocaleString() : null
          );
        }
      } catch (error) {
        console.error("Error fetching initial TLF Inventory data:", error);
        setErrorModalOpen(true);
      }
    };
    loadInitial();
  }, []);

  // SSE subscription for raw snapshot updates
  useEffect(() => {
    const url = `${import.meta.env.VITE_APP_ROUTE}/tlf/stream`;
    const es = new EventSource(url);

    es.addEventListener("tlf_snapshot_raw", (event) => {
      try {
        const snapshot = JSON.parse(event.data);
        setInventoryData(snapshot.boards || []);
        setLastFetchedAt(
          snapshot.FetchedAt
            ? new Date(snapshot.FetchedAt).toLocaleString()
            : null
        );
      } catch (e) {
        console.error("Error parsing tlf_snapshot_raw:", e);
      }
    });

    es.addEventListener("tlf_sync_error", (event) => {
      try {
        const payload = JSON.parse(event.data);
        console.warn("TLF sync error:", payload);
        setErrorModalOpen(true);
      } catch (e) {
        console.error("Error parsing tlf_sync_error:", e);
      }
    });

    es.onerror = (err) => {
      console.error("TLF SSE error:", err);
    };

    return () => es.close();
  }, []);

  const handleSearch = (e) => {
    setSearchQuery(e.target.value);
  };

  const filteredData = inventoryData.filter((item) => {
    const q = searchQuery.toLowerCase();
    const matchesText =
      item.BoardCode?.toLowerCase().includes(q) ||
      item.Length?.$numberDecimal?.toString().includes(searchQuery) ||
      item.Width?.$numberDecimal?.toString().includes(searchQuery) ||
      item.Thickness?.$numberDecimal?.toString().includes(searchQuery) ||
      item.TotalQty?.toString().includes(searchQuery);

    const qtyOk = !isHideZeroQty || item.TotalQty !== 0;

    return qtyOk && matchesText;
  });

  const handlePrint = () => {
    window.print();
  };

  const handleHideZeroQtyChange = () => {
    setIsHideZeroQty((prev) => !prev);
  };

  const getLastFetchedStyle = () => {
    if (!lastFetchedAt) return {};
    const lastFetchedTime = new Date(lastFetchedAt);
    const currentTime = new Date();
    const timeDifference = (currentTime - lastFetchedTime) / 1000 / 60 / 60; // hours

    if (timeDifference > 6) {
      return {
        backgroundColor: "red",
        color: "white",
        fontSize: "20px",
      };
    } else if (timeDifference > 2) {
      return {
        backgroundColor: "yellow",
        fontSize: "20px",
      };
    }
    return {};
  };

  const handleRowClick = (index) => {
    setSelectedRowIndex(index === selectedRowIndex ? null : index);
  };

  return (
    <div className="tlf-inventory-list" ref={printRef}>
      <div className="print-header">
        {user && <p>Printed by: {user.username}</p>}
      </div>
      <h2>TLF Inventory</h2>

      <div className="controls">
        <input
          type="text"
          placeholder="Search..."
          value={searchQuery}
          onChange={handleSearch}
        />

        <label className="hide-zero-qty">
          <input
            type="checkbox"
            checked={isHideZeroQty}
            onChange={handleHideZeroQtyChange}
          />
          <span>Hide Inventory with Qty = 0</span>
        </label>

        <p style={getLastFetchedStyle()}>
          Fetched At: {lastFetchedAt || "N/A"} (every 5 min.)
        </p>

        <button className="btn-print" onClick={handlePrint}>
          Print
        </button>
      </div>

      <table>
        <thead>
          <tr>
            <th>Board Code</th>
            <th>Quantity</th>
            <th>Length</th>
            <th>Width</th>
            <th>Thickness</th>
          </tr>
        </thead>
        <tbody>
          {filteredData.length === 0 ? (
            <tr>
              <td colSpan="5">No data to display</td>
            </tr>
          ) : (
            filteredData.map((item, index) => (
              <tr
                key={index}
                onClick={() => handleRowClick(index)}
                style={{
                  backgroundColor: selectedRowIndex === index ? "skyblue" : "",
                }}
              >
                <td>
                  {item.BoardCode?.split(
                    new RegExp(`(${searchQuery})`, "gi")
                  ).map((part, i) =>
                    searchQuery &&
                    part.toLowerCase() === searchQuery.toLowerCase() ? (
                      <span key={i} style={{ backgroundColor: "yellow" }}>
                        {part}
                      </span>
                    ) : (
                      part
                    )
                  )}
                </td>
                <td style={{ textAlign: "center" }}>{item.TotalQty}</td>
                <td style={{ textAlign: "center" }}>
                  {item.Length?.$numberDecimal}
                </td>
                <td style={{ textAlign: "center" }}>
                  {item.Width?.$numberDecimal}
                </td>
                <td style={{ textAlign: "center" }}>
                  {item.Thickness?.$numberDecimal}
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>

      {errorModalOpen && (
        <div className="error-modal">
          <div className="error-modal-content">
            <h3>Failed to Fetch Latest TLF Inventory</h3>
            <button onClick={() => setErrorModalOpen(false)}>OK</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default TLFInventory;
