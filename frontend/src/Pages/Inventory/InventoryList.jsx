import { useState, useEffect, useContext, useMemo } from "react";
import axios from "axios";
import "../../css/Inventory/InventoryList.scss";
import { AuthContext } from "../../Components/AuthContext";

const SORT_FIELDS = [
  { key: "boardCode", label: "Board Code" },
  { key: "code", label: "Code" },
  { key: "supplier", label: "Supplier" },
];

const InventoryList = ({ onEdit = () => {} }) => {
  const [inventory, setInventory] = useState([]);
  const [filteredInventory, setFilteredInventory] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [finishes, setFinishes] = useState([]);
  const [fetchedAtDB, setFetchedAtDB] = useState(null);

  // SSE agg payload: { fetchedAt, qtyByKey: { [aggKeyOrBoardCode]: qty } }
  const [tlfAgg, setTlfAgg] = useState({ fetchedAt: null, qtyByKey: {} });

  const [sortFieldIndex, setSortFieldIndex] = useState(0);
  const [isSortModalOpen, setIsSortModalOpen] = useState(false);
  const [pendingSortIndex, setPendingSortIndex] = useState(0);

  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [activeFilters, setActiveFilters] = useState({
    supplier: "",
    finish: "",
    thickness: "",
  });
  const [pendingFilters, setPendingFilters] = useState({
    supplier: "",
    finish: "",
    thickness: "",
  });

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [recordToDelete, setRecordToDelete] = useState(null);

  const [showChooseRecordModal, setShowChooseRecordModal] = useState(false);
  const [chooseActionType, setChooseActionType] = useState(null);
  const [chooseCandidates, setChooseCandidates] = useState([]);
  const [chooseHeaderLabel, setChooseHeaderLabel] = useState("");

  const { user } = useContext(AuthContext);

  const canPerformActions = user.role === "Editor" || user.role === "admin";

  const normalize = (v) => (v === null || v === undefined ? "" : String(v));

  const getField = (obj, keys, fallback = "") => {
    for (const k of keys) {
      const val = obj?.[k];
      if (val !== undefined && val !== null) return val;
    }
    return fallback;
  };

  const getAggregationCode = (row) => {
    const agg = normalize(
      getField(row, ["aggregationKey", "AggregationKey"])
    ).trim();
    const bc = normalize(
      getField(row, ["boardCode", "BoardCode", "Identnummer"])
    ).trim();
    return agg || bc;
  };

  const toNumber = (v) => {
    const n = Number(v);
    return Number.isFinite(n) ? n : 0;
  };

  const fetchFinishes = async () => {
    try {
      const response = await axios.get(
        `${import.meta.env.VITE_APP_ROUTE}/finishes`
      );
      const sorted = (response.data || []).sort((a, b) =>
        a.name.localeCompare(b.name, undefined, { numeric: true })
      );
      setFinishes(sorted);
    } catch (error) {
      console.error("Error fetching finishes:", error);
    }
  };

  const formatFinishForTable = (finishNameRaw) => {
    const finishName = normalize(finishNameRaw).trim();
    if (!finishName) return "";

    if (finishName.length <= 10) return finishName;

    const match = finishes.find((f) => f.name === finishName);
    return match?.code || finishName;
  };

  // Aggregate warehouse rows by aggregationKey/boardCode and sum quantities
  const aggregatedInventory = useMemo(() => {
    if (!Array.isArray(inventory)) return [];

    const map = new Map();

    for (const row of inventory) {
      const key = getAggregationCode(row);
      if (!key) continue;

      if (!map.has(key)) {
        map.set(key, {
          _id: key,
          _sourceRows: [row],

          boardCode: key,
          supplier: getField(row, ["supplier", "Supplier"]),
          code: getField(row, ["code", "Code"]),
          finish: (() => {
             if (key) {
                 const parts = key.split('_');
                 if (parts.length > 2) return parts[2];
             }
             return getField(row, ["finish", "Finish"]);
          })(),
          thickness: getField(row, ["thickness", "Thickness"]),
          format: getField(row, ["format", "Format"]),

          warehouseQty: 0,
          tlfQty: 0,
          onHandQty: 0,
          reservedQty: 0,
          availableQty: 0,
          onOrderQty: 0,
          projectedQty: 0,
        });
      } else {
        map.get(key)._sourceRows.push(row);
      }

      const acc = map.get(key);
      acc.warehouseQty += toNumber(
        getField(row, ["warehouseQty", "WarehouseQty"])
      );
      acc.tlfQty += toNumber(getField(row, ["tlfQty", "TLFQty"]));
      acc.onHandQty += toNumber(getField(row, ["onHandQty", "OnHandQty"]));
      acc.reservedQty += toNumber(
        getField(row, ["reservedQty", "ReservedQty"])
      );
      acc.availableQty += toNumber(
        getField(row, ["availableQty", "AvailableQty"])
      );
      acc.onOrderQty += toNumber(getField(row, ["onOrderQty", "OnOrderQty"]));
      acc.projectedQty += toNumber(
        getField(row, ["projectedQty", "ProjectedQty"])
      );
    }

    return Array.from(map.values());
  }, [inventory]);

  // Merge SSE agg TLF qty into aggregated inventory rows
  const aggregatedWithLiveTLF = useMemo(() => {
    const qtyByKey = tlfAgg?.qtyByKey || {};
    if (!aggregatedInventory.length) return aggregatedInventory;

    return aggregatedInventory.map((row) => {
      const key = row.boardCode;
      const hasLiveTLF = qtyByKey.hasOwnProperty(key);
      const liveTLF = hasLiveTLF ? Number(qtyByKey[key]) || 0 : row.tlfQty;

      const onHand = row.warehouseQty + liveTLF;
      const available = Math.max(0, onHand - row.reservedQty);
      const projected = available + row.onOrderQty;

      return {
        ...row,
        tlfQty: liveTLF,
        onHandQty: onHand,
        availableQty: available,
        projectedQty: projected,
      };
    });
  }, [aggregatedInventory, tlfAgg]);

  // TLF-only boards (in SSE, qty>0, not present in warehouse)
  const tlfOnlyBoards = useMemo(() => {
    const qtyByKey = tlfAgg?.qtyByKey || {};
    const warehouseKeys = new Set(aggregatedInventory.map((r) => r.boardCode));

    const rows = Object.entries(qtyByKey)
      .filter(([, qty]) => Number(qty) > 0)
      .filter(([key]) => !warehouseKeys.has(key))
      .map(([key, qty]) => ({
        boardCode: key,
        tlfQty: Number(qty) || 0,
      }));

    // sort
    return rows.sort((a, b) =>
      String(a.boardCode).localeCompare(String(b.boardCode), undefined, {
        numeric: true,
      })
    );
  }, [tlfAgg, aggregatedInventory]);

  const applySort = (rows, indexOverride = null) => {
    const idx = indexOverride !== null ? indexOverride : sortFieldIndex;
    const { key } = SORT_FIELDS[idx];

    const keyToPaths = {
      boardCode: ["boardCode"],
      code: ["code"],
      supplier: ["supplier"],
    };

    const paths = keyToPaths[key] || [key];

    return [...rows].sort((a, b) => {
      const aVal = normalize(getField(a, paths));
      const bVal = normalize(getField(b, paths));
      return aVal.localeCompare(bVal, undefined, { numeric: true });
    });
  };

  const applyFilters = (rows, filters) => {
    const supplierFilter = filters.supplier.trim().toLowerCase();
    const finishFilter = filters.finish.trim().toLowerCase();
    const thicknessFilter = filters.thickness.trim().toLowerCase();

    if (!supplierFilter && !finishFilter && !thicknessFilter) return rows;

    return rows.filter((row) => {
      const supplierVal = normalize(getField(row, ["supplier"])).toLowerCase();
      const finishVal = normalize(getField(row, ["finish"])).toLowerCase();
      const thicknessVal = normalize(
        getField(row, ["thickness"])
      ).toLowerCase();

      const supplierMatch = supplierFilter
        ? supplierVal === supplierFilter
        : true;
      const finishMatch = finishFilter ? finishVal === finishFilter : true;
      const thicknessMatch = thicknessFilter
        ? thicknessVal === thicknessFilter
        : true;

      return supplierMatch && finishMatch && thicknessMatch;
    });
  };

  const hasActiveFilters =
    activeFilters.supplier.trim() !== "" ||
    activeFilters.finish.trim() !== "" ||
    activeFilters.thickness.trim() !== "";

  const fetchInventory = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await axios.get(
        `${import.meta.env.VITE_APP_ROUTE}/warehouseInventory`
      );
      setInventory(Array.isArray(response.data) ? response.data : []);

      const latestUpdatedAt = response.data
        ?.map((r) => r.updatedAt)
        ?.filter(Boolean)
        ?.reduce((max, d) => (new Date(d) > new Date(max) ? d : max), null);

      setFetchedAtDB(
        latestUpdatedAt ? new Date(latestUpdatedAt).toLocaleString() : null
      );
    } catch (e) {
      console.error("Error fetching inventory:", e);
      setError(e?.message || "Error fetching inventory");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInventory();
    fetchFinishes();
  }, []);

  // Subscribe to SSE aggregated snapshot
  useEffect(() => {
    const url = `${import.meta.env.VITE_APP_ROUTE}/tlf/stream`;
    const es = new EventSource(url);

    es.addEventListener("tlf_snapshot_agg", (event) => {
      try {
        const payload = JSON.parse(event.data);
        // payload
        setTlfAgg({
          fetchedAt: payload.fetchedAt || null,
          qtyByKey: payload.qtyByKey || {},
        });
      } catch (e) {
        console.error("Error parsing tlf_snapshot_agg:", e);
      }
    });

    es.addEventListener("tlf_sync_error", (event) => {
      try {
        const payload = JSON.parse(event.data);
        console.warn("TLF sync error:", payload);
      } catch (e) {
        console.error("Error parsing tlf_sync_error:", e);
      }
    });

    es.onerror = (err) => {
      console.error("Warehouse TLF SSE error:", err);
    };

    return () => es.close();
  }, []);

  useEffect(() => {
    const q = searchTerm.trim().toLowerCase();

    let base = applySort(aggregatedWithLiveTLF);
    base = applyFilters(base, activeFilters);

    if (!q) {
      setFilteredInventory(base);
      return;
    }

    const filtered = base.filter((row) =>
      Object.values(row || {}).some((value) =>
        normalize(value).toLowerCase().includes(q)
      )
    );

    setFilteredInventory(filtered);
  }, [searchTerm, aggregatedWithLiveTLF, sortFieldIndex, activeFilters]);

  const openChooseModal = (actionType, aggregatedRow) => {
    const candidates = aggregatedRow?._sourceRows || [];
    setChooseActionType(actionType);
    setChooseCandidates(candidates);
    setChooseHeaderLabel(aggregatedRow?.boardCode || "");
    setShowChooseRecordModal(true);
  };

  const handleEditClick = (aggregatedRow) => {
    const candidates = aggregatedRow?._sourceRows || [];
    if (candidates.length <= 1) {
      onEdit(candidates[0] || aggregatedRow);
      return;
    }
    openChooseModal("edit", aggregatedRow);
  };

  const handleDeleteClick = (aggregatedRow) => {
    const candidates = aggregatedRow?._sourceRows || [];
    if (candidates.length <= 1) {
      setRecordToDelete(candidates[0] || aggregatedRow);
      setShowDeleteConfirm(true);
      return;
    }
    openChooseModal("delete", aggregatedRow);
  };

  const handleChooseCandidate = (candidate) => {
    setShowChooseRecordModal(false);

    if (chooseActionType === "edit") {
      onEdit(candidate);
      return;
    }

    if (chooseActionType === "delete") {
      setRecordToDelete(candidate);
      setShowDeleteConfirm(true);
    }
  };

  const handleDeleteConfirm = async (selectedId) => {
    try {
      const originalResponse = await axios.get(
        `${import.meta.env.VITE_APP_ROUTE}/warehouseInventory/${selectedId}`
      );
      const originalMaterialData = originalResponse.data;

      await axios.delete(
        `${import.meta.env.VITE_APP_ROUTE}/warehouseInventory/${selectedId}`
      );

      await axios.post(`${import.meta.env.VITE_APP_ROUTE}/logs/add`, {
        user: user.username,
        action: `Deleted Warehouse Inventory Material: ${originalMaterialData.boardCode}`,
        previousData: originalMaterialData,
        updatedData: null,
      });

      setShowDeleteConfirm(false);
      fetchInventory();
    } catch (error) {
      console.error("Error deleting inventory record:", error);
    }
  };

  const currentSortLabel = SORT_FIELDS[sortFieldIndex].label;

  const uniqueSuppliers = Array.from(
    new Set(aggregatedWithLiveTLF.map((row) => normalize(row.supplier)))
  ).filter((v) => v);

  const uniqueFinishes = Array.from(
    new Set(aggregatedWithLiveTLF.map((row) => normalize(row.finish)))
  ).filter((v) => v);

  const uniqueThicknesses = Array.from(
    new Set(aggregatedWithLiveTLF.map((row) => normalize(row.thickness)))
  ).filter((v) => v);

  const openSortModal = () => {
    setPendingSortIndex(sortFieldIndex);
    setIsSortModalOpen(true);
  };

  const cancelSort = () => setIsSortModalOpen(false);

  const openFilterModal = () => {
    setPendingFilters(activeFilters);
    setIsFilterModalOpen(true);
  };

  const confirmFilter = () => {
    setActiveFilters(pendingFilters);
    setIsFilterModalOpen(false);
  };

  const cancelFilter = () => setIsFilterModalOpen(false);

  const clearFilters = () => {
    setActiveFilters({ supplier: "", finish: "", thickness: "" });
  };

  const filterButtonLabel = hasActiveFilters ? "Clear Filters" : "Filter";

  return (
    <div className="inventory-list">
      <h1>Warehouse Inventory</h1>

      <div className="inventory-list-header">
        <input
          type="text"
          placeholder="Search inventory..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="search-input"
        />
        <p>
          Fetched At:{" "}
          {tlfAgg?.fetchedAt
            ? new Date(tlfAgg.fetchedAt).toLocaleString()
            : fetchedAtDB ?? "N/A"}{" "}
          (every 5 min.)
        </p>

        <div className="inventory-list-header-actions">
          <button className="refresh-button" onClick={fetchInventory}>
            Refresh
          </button>

          <button
            className={`filter-button ${
              hasActiveFilters ? "filter-button--active" : ""
            }`}
            onClick={hasActiveFilters ? clearFilters : openFilterModal}
          >
            {filterButtonLabel}
          </button>

          <button className="sort-button" onClick={openSortModal}>
            Sort By: {currentSortLabel}
          </button>
        </div>
      </div>

      {loading && <div className="loading-state">Loading...</div>}
      {error && !loading && <div className="error-state">{error}</div>}

      <table>
        <thead>
          <tr>
            <th>Supplier</th>
            <th>Code</th>
            <th>Finish</th>
            <th>Thickness</th>
            <th>Format</th>
            <th>Board Code</th>
            <th>Warehouse Qty</th>
            <th>TLF Qty</th>
            <th>On-Hand Qty</th>
            <th>Reserved Qty</th>
            <th>Available Qty</th>
            <th>On-Order Qty</th>
            <th>Projected Qty</th>
            <th>Actions</th>
          </tr>
        </thead>

        <tbody>
          {filteredInventory.map((row, idx) => {
            const key = row?._id || `${row.boardCode}-${idx}`;
            return (
              <tr key={key}>
                <td>{row.supplier}</td>
                <td>{row.code}</td>
                <td>{formatFinishForTable(row.finish)}</td>
                <td>{row.thickness}</td>
                <td>{row.format}</td>
                <td>{row.boardCode}</td>

                <td>{row.warehouseQty}</td>
                <td>{row.tlfQty}</td>
                <td>{row.onHandQty}</td>
                <td>{row.reservedQty}</td>
                <td>{row.availableQty}</td>
                <td>{row.onOrderQty}</td>
                <td>{row.projectedQty}</td>

                <td>
                  {canPerformActions ? (
                    <>
                      <button
                        className="edit-button"
                        onClick={() => handleEditClick(row)}
                      >
                        Edit
                      </button>
                      <button
                        className="delete-button"
                        onClick={() => handleDeleteClick(row)}
                      >
                        Delete
                      </button>
                    </>
                  ) : (
                    "Elevation required to perform Actions"
                  )}
                </td>
              </tr>
            );
          })}

          {!loading && filteredInventory.length === 0 && (
            <tr>
              <td colSpan={14} className="empty-state">
                No inventory records found.
              </td>
            </tr>
          )}
        </tbody>
      </table>

      {/* TLF-only boards section */}
      {tlfOnlyBoards.length > 0 && (
        <>
          <h2 style={{ marginTop: "24px" }}>
            Boards in TLF but not in Warehouse
          </h2>
          <table>
            <thead>
              <tr>
                <th>Board Code</th>
                <th>TLF Qty</th>
              </tr>
            </thead>
            <tbody>
              {tlfOnlyBoards.map((row) => (
                <tr key={row.boardCode}>
                  <td>{row.boardCode}</td>
                  <td>{row.tlfQty}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}

      {showChooseRecordModal && (
        <div className="inventory-modal-overlay">
          <div className="inventory-modal">
            <h3>
              Choose record ({chooseActionType}) — {chooseHeaderLabel}
            </h3>

            <div className="inventory-modal__body">
              {chooseCandidates.map((c) => (
                <button
                  type="button"
                  key={c._id}
                  className="inventory-modal__list-item"
                  onClick={() => handleChooseCandidate(c)}
                >
                  <div>
                    <div>
                      <strong>Board:</strong> {c.boardCode}
                    </div>
                    <div>
                      <strong>Finish:</strong> {formatFinishForTable(c.finish)}
                    </div>
                    <div>
                      <strong>Thickness:</strong> {c.thickness}
                    </div>
                    <div>
                      <strong>Format:</strong> {c.format}
                    </div>
                  </div>
                </button>
              ))}
            </div>

            <div className="inventory-modal__actions">
              <button
                className="secondary-btn"
                onClick={() => setShowChooseRecordModal(false)}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {showDeleteConfirm && (
        <div className="inventory-modal-overlay">
          <div className="inventory-modal">
            <h3>Confirm Delete</h3>
            <p>
              Do you really want to delete{" "}
              {recordToDelete?.boardCode || recordToDelete?.code}?
            </p>
            <div className="inventory-modal__actions">
              <button
                className="confirm-delete-btn"
                onClick={() => handleDeleteConfirm(recordToDelete._id)}
              >
                Yes, Delete
              </button>
              <button
                className="cancel-delete-btn"
                onClick={() => setShowDeleteConfirm(false)}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {isSortModalOpen && (
        <div className="inventory-modal-overlay">
          <div className="inventory-modal">
            <h3>Sort Inventory</h3>
            <div className="inventory-modal__body">
              {SORT_FIELDS.map((field, index) => (
                <label key={field.key} className="inventory-modal__radio-label">
                  <input
                    type="radio"
                    name="sortField"
                    value={field.key}
                    checked={pendingSortIndex === index}
                    onChange={() => setPendingSortIndex(index)}
                  />
                  {field.label}
                </label>
              ))}
            </div>
            <div className="inventory-modal__actions">
              <button
                className="primary-btn"
                onClick={() => {
                  setSortFieldIndex(pendingSortIndex);
                  setIsSortModalOpen(false);
                }}
              >
                Apply
              </button>
              <button className="secondary-btn" onClick={cancelSort}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {isFilterModalOpen && (
        <div className="inventory-modal-overlay">
          <div className="inventory-modal">
            <h3>Filter Inventory</h3>
            <div className="inventory-modal__body">
              <div className="inventory-modal__field">
                <label>Supplier</label>
                <select
                  value={pendingFilters.supplier}
                  onChange={(e) =>
                    setPendingFilters((prev) => ({
                      ...prev,
                      supplier: e.target.value,
                    }))
                  }
                >
                  <option value="">All</option>
                  {uniqueSuppliers.map((s) => (
                    <option key={s} value={s.toLowerCase()}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>

              <div className="inventory-modal__field">
                <label>Finish</label>
                <select
                  value={pendingFilters.finish}
                  onChange={(e) =>
                    setPendingFilters((prev) => ({
                      ...prev,
                      finish: e.target.value,
                    }))
                  }
                >
                  <option value="">All</option>
                  {uniqueFinishes.map((f) => (
                    <option key={f} value={f.toLowerCase()}>
                      {f}
                    </option>
                  ))}
                </select>
              </div>

              <div className="inventory-modal__field">
                <label>Thickness</label>
                <select
                  value={pendingFilters.thickness}
                  onChange={(e) =>
                    setPendingFilters((prev) => ({
                      ...prev,
                      thickness: e.target.value,
                    }))
                  }
                >
                  <option value="">All</option>
                  {uniqueThicknesses.map((t) => (
                    <option key={t} value={t.toLowerCase()}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="inventory-modal__actions">
              <button className="primary-btn" onClick={confirmFilter}>
                Apply Filters
              </button>
              <button className="secondary-btn" onClick={cancelFilter}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InventoryList;
