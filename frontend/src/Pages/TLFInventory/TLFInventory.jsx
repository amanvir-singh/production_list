import { useState, useEffect, useContext, useRef } from "react";
import axios from "axios";
import "../../css/TLFInventory/TLFInventory.scss";
import { AuthContext } from "../../Components/AuthContext";

const TLFInventory = () => {
  const [inventoryData, setInventoryData] = useState([]);
  const [fixersData, setFixersData] = useState([]); // Added fixersData state
  const [isHideZeroQty, setIsHideZeroQty] = useState(false);
  const [lastFetchedAt, setLastFetchedAt] = useState(null);
  const [errorModalOpen, setErrorModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const { user } = useContext(AuthContext);
  const printRef = useRef();
  const [isFetching, setIsFetching] = useState(false);
  const [selectedRowIndex, setSelectedRowIndex] = useState(null);

  useEffect(() => {
    fetchTLFInventory(); // Fetch inventory and fixers on component mount
  }, []);

  const fetchTLFInventory = async () => {
    try {
      const inventoryResponse = await axios.get(
        `${import.meta.env.VITE_APP_ROUTE}/TLFInventory`
      );
      const boards = inventoryResponse.data[0]?.boards || [];
      setInventoryData(boards);
      setLastFetchedAt(
        new Date(inventoryResponse.data[0]?.FetchedAt).toLocaleString()
      );

      // Fetch the fixers data
      const fixersResponse = await axios.get(
        `${import.meta.env.VITE_APP_ROUTE}/tlfinventoryfixer`
      );
      setFixersData(fixersResponse.data || []);

      // Update the inventory data based on fixers
      const updatedInventoryData = boards.map((board) => {
        // Find the corresponding fixer for the board (if any)
        const fixer = fixersResponse.data.find(
          (fixerItem) => fixerItem.BoardCode === board.BoardCode
        );
        if (fixer) {
          // Adjust the board's TotalQty based on the fixer quantity
          board.TotalQty += fixer.QtytoFix;
        }

        return board;
      });

      setInventoryData(updatedInventoryData);
    } catch (error) {
      console.error("Error fetching TLF Inventory data:", error);
      setErrorModalOpen(true);
    }
  };

  const fetchNow = async () => {
    setIsFetching(true);
    try {
      const response = await axios.get(
        `${import.meta.env.VITE_APP_ROUTE}/TLFInventory/fetch-now`
      );
      fetchTLFInventory();
      setIsFetching(false);
    } catch (error) {
      console.error("Error fetching latest data:", error);
      setErrorModalOpen(true);
      setIsFetching(false);
    }
  };

  const handleSearch = (e) => {
    setSearchQuery(e.target.value);
  };

  const filteredData = inventoryData.filter(
    (item) =>
      (!isHideZeroQty || item.TotalQty !== 0) &&
      (item.BoardCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.Length?.$numberDecimal.toString().includes(searchQuery) ||
        item.Width?.$numberDecimal.toString().includes(searchQuery) ||
        item.Thickness?.$numberDecimal.toString().includes(searchQuery) ||
        item.TotalQty.toString().includes(searchQuery))
  );

  const handlePrint = () => {
    window.print();
  };

  const handleHideZeroQtyChange = () => {
    setIsHideZeroQty((prev) => !prev);
  };

  const getLastFetchedStyle = () => {
    const lastFetchedTime = new Date(lastFetchedAt);
    const currentTime = new Date();
    const timeDifference = (currentTime - lastFetchedTime) / 1000 / 60 / 60; // in hours

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
        <button className="btn-fetch-now" onClick={fetchNow}>
          {!isFetching ? "Fetch Now" : "Fetching..."}
        </button>
        <label className="hide-zero-qty">
          <input
            type="checkbox"
            checked={isHideZeroQty}
            onChange={handleHideZeroQtyChange}
          />
          <span>Hide Inventory with Qty = 0</span>
        </label>
        <p style={getLastFetchedStyle()}>Fetched At: {lastFetchedAt}</p>
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
                  {item.BoardCode.split(
                    new RegExp(`(${searchQuery})`, "gi")
                  ).map((part, i) =>
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

      {/* Error Modal */}
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
