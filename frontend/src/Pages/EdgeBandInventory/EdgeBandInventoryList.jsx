import { useState, useEffect, useContext, useMemo, useRef } from "react";
import axios from "axios";
import Select from "react-select";
import { AuthContext } from "../../Components/AuthContext";
import "../../css/EdgeBandInventory/EdgeBandInventoryList.scss";

const EDITABLE_ROLES = ["Editor", "Manager", "admin", "Edgebander"];
const LOCATION_PREVIEW_LIMIT = 2;

const EdgeBandInventoryList = ({ onEdit }) => {
  const { user } = useContext(AuthContext);
  const canEdit = EDITABLE_ROLES.includes(user?.role);
  const printRef = useRef();

  const handlePrint = () => window.print();

  const [inventory, setInventory] = useState([]);
  const [heights, setHeights] = useState([]);
  const [thicknesses, setThicknesses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedHeights, setSelectedHeights] = useState([]);
  const [selectedThicknesses, setSelectedThicknesses] = useState([]);

  // Add rolls modal
  const [addModal, setAddModal] = useState(null);
  const [addLocation, setAddLocation] = useState("");
  const [addQty, setAddQty] = useState("");
  const [addError, setAddError] = useState("");
  const [addLoading, setAddLoading] = useState(false);

  // Deduct rolls modal
  const [deductModal, setDeductModal] = useState(null);
  const [deductLocation, setDeductLocation] = useState("");
  const [deductQty, setDeductQty] = useState("");
  const [deductError, setDeductError] = useState("");
  const [deductLoading, setDeductLoading] = useState(false);

  // Delete confirmation
  const [deleteModal, setDeleteModal] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const fetchInventory = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await axios.get(
        `${import.meta.env.VITE_APP_ROUTE}/edgeBandInventory`
      );
      setInventory(res.data);
    } catch {
      setError("Failed to load edgeband inventory.");
    } finally {
      setLoading(false);
    }
  };

  const fetchFilters = async () => {
    try {
      const [hRes, tRes] = await Promise.all([
        axios.get(`${import.meta.env.VITE_APP_ROUTE}/edgeBandHeight`),
        axios.get(`${import.meta.env.VITE_APP_ROUTE}/edgeBandThickness`),
      ]);
      setHeights(hRes.data);
      setThicknesses(tRes.data);
    } catch {
      // non-critical
    }
  };

  useEffect(() => {
    fetchInventory();
    fetchFilters();
  }, []);

  const heightOptions = useMemo(
    () => heights.map((h) => ({ value: h.name, label: h.name })),
    [heights]
  );
  const thicknessOptions = useMemo(
    () => thicknesses.map((t) => ({ value: t.name, label: t.name })),
    [thicknesses]
  );

  const filtered = useMemo(() => {
    let list = inventory;

    if (searchTerm.trim()) {
      const term = searchTerm.trim().toLowerCase();
      list = list.filter(
        (eb) =>
          eb.code.toLowerCase().includes(term) ||
          eb.height.toLowerCase().includes(term) ||
          eb.thickness.toLowerCase().includes(term) ||
          eb.uniqueCode.toLowerCase().includes(term)
      );
    }

    if (selectedHeights.length > 0) {
      const vals = selectedHeights.map((o) => o.value);
      list = list.filter((eb) => vals.includes(eb.height));
    }

    if (selectedThicknesses.length > 0) {
      const vals = selectedThicknesses.map((o) => o.value);
      list = list.filter((eb) => vals.includes(eb.thickness));
    }

    return [...list].sort((a, b) => a.code.localeCompare(b.code));
  }, [inventory, searchTerm, selectedHeights, selectedThicknesses]);

  const highlight = (text, term) => {
    if (!term.trim()) return <span>{text}</span>;
    const regex = new RegExp(`(${term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`, "gi");
    const parts = String(text).split(regex);
    return (
      <span>
        {parts.map((part, i) =>
          regex.test(part) ? <mark key={i}>{part}</mark> : <span key={i}>{part}</span>
        )}
      </span>
    );
  };

  const LocationCell = ({ locations }) => {
    if (!locations || locations.length === 0) return <span className="eb-list__loc-empty">—</span>;

    const preview = locations.slice(0, LOCATION_PREVIEW_LIMIT);
    const rest = locations.slice(LOCATION_PREVIEW_LIMIT);

    return (
      <span className="eb-list__loc-wrap">
        <span className="eb-list__loc-preview">
          {preview.map((l) => (
            <span key={l.position} className="eb-list__loc-tag">
              {l.position}: {l.qty}
            </span>
          ))}
        </span>
        {rest.length > 0 && (
          <span className="eb-list__loc-more">
            +{rest.length} more
            <span className="eb-list__loc-tooltip">
              {locations.map((l) => (
                <span key={l.position} className="eb-list__loc-tooltip-row">
                  <strong>{l.position}</strong>: {l.qty}
                </span>
              ))}
            </span>
          </span>
        )}
      </span>
    );
  };

  // Add Rolls
  const openAddModal = (edgeBand) => {
    setAddModal({ edgeBand });
    setAddLocation("");
    setAddQty("");
    setAddError("");
  };

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    if (!addLocation.trim() || !addQty || Number(addQty) <= 0) {
      setAddError("Location and a positive quantity are required.");
      return;
    }
    setAddLoading(true);
    setAddError("");
    try {
      await axios.put(
        `${import.meta.env.VITE_APP_ROUTE}/edgeBandInventory/add-stock/${addModal.edgeBand._id}`,
        {
          locations: [{ position: addLocation.trim(), qty: Number(addQty) }],
          user: user.username,
        }
      );
      setAddModal(null);
      fetchInventory();
    } catch (err) {
      setAddError(err.response?.data?.message || "Failed to add stock.");
    } finally {
      setAddLoading(false);
    }
  };

  // Deduct Rolls
  const openDeductModal = (edgeBand) => {
    setDeductModal({ edgeBand });
    setDeductLocation(edgeBand.locations?.[0]?.position || "");
    setDeductQty("");
    setDeductError("");
  };

  const handleDeductSubmit = async (e) => {
    e.preventDefault();
    if (!deductLocation || !deductQty || Number(deductQty) <= 0) {
      setDeductError("Location and a positive quantity are required.");
      return;
    }
    setDeductLoading(true);
    setDeductError("");
    try {
      await axios.post(
        `${import.meta.env.VITE_APP_ROUTE}/edgeBandInventory/${deductModal.edgeBand._id}/use`,
        {
          location: deductLocation,
          qtyUsed: Number(deductQty),
          user: user.username,
        }
      );
      setDeductModal(null);
      fetchInventory();
    } catch (err) {
      setDeductError(err.response?.data?.message || "Failed to deduct stock.");
    } finally {
      setDeductLoading(false);
    }
  };

  // Delete
  const handleDeleteConfirm = async () => {
    setDeleteLoading(true);
    try {
      await axios.delete(
        `${import.meta.env.VITE_APP_ROUTE}/edgeBandInventory/${deleteModal._id}`,
        { data: { user: user.username } }
      );
      setDeleteModal(null);
      fetchInventory();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to delete.");
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <div className="eb-list" ref={printRef}>
      <div className="eb-list__print-header">
        <h2>Edgeband Inventory</h2>
        {user && <p>Printed by: {user.username}</p>}
        <p>Date: {new Date().toLocaleString()}</p>
      </div>

      <div className="eb-list__controls">
        <input
          className="eb-list__search"
          type="text"
          placeholder="Search..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <div className="eb-list__filters">
          <Select
            isMulti
            placeholder="Height..."
            options={heightOptions}
            value={selectedHeights}
            onChange={setSelectedHeights}
            className="eb-list__select"
            classNamePrefix="eb-select"
          />
          <Select
            isMulti
            placeholder="Thickness..."
            options={thicknessOptions}
            value={selectedThicknesses}
            onChange={setSelectedThicknesses}
            className="eb-list__select"
            classNamePrefix="eb-select"
          />
        </div>
        <button className="eb-list__print-btn" onClick={handlePrint}>
          Print
        </button>
      </div>

      {loading && <p className="eb-list__status">Loading...</p>}
      {error && <p className="eb-list__status eb-list__status--error">{error}</p>}

      {!loading && !error && (
        <div className="eb-list__table-wrap">
          <table className="eb-list__table">
            <thead>
              <tr>
                <th>Code</th>
                <th>Height</th>
                <th>Thickness</th>
                <th>Total Qty</th>
                <th>Locations</th>
                {canEdit && <th className="eb-list__no-print">Actions</th>}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={canEdit ? 6 : 5} className="eb-list__empty">
                    No edgebands found.
                  </td>
                </tr>
              ) : (
                filtered.map((eb) => (
                  <tr key={eb._id}>
                    <td>{highlight(eb.code, searchTerm)}</td>
                    <td>{highlight(eb.height, searchTerm)}</td>
                    <td>{highlight(eb.thickness, searchTerm)}</td>
                    <td className="eb-list__qty">{eb.totalQty}</td>
                    <td>
                      <LocationCell locations={eb.locations} />
                    </td>
                    {canEdit && (
                      <td className="eb-list__actions eb-list__no-print">
                        <div className="eb-list__actions-grid">
                          <button
                            className="eb-list__btn eb-list__btn--add"
                            onClick={() => openAddModal(eb)}
                          >
                            Add Rolls
                          </button>
                          <button
                            className="eb-list__btn eb-list__btn--deduct"
                            onClick={() => openDeductModal(eb)}
                            disabled={!eb.locations || eb.locations.length === 0}
                          >
                            Deduct
                          </button>
                          <button
                            className="eb-list__btn eb-list__btn--edit"
                            onClick={() => onEdit(eb)}
                          >
                            Edit
                          </button>
                          <button
                            className="eb-list__btn eb-list__btn--delete"
                            onClick={() => setDeleteModal(eb)}
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Add Rolls Modal */}
      {addModal && (
        <div className="eb-modal-overlay" onClick={() => setAddModal(null)}>
          <div className="eb-modal" onClick={(e) => e.stopPropagation()}>
            <h3>Add Rolls — {addModal.edgeBand.code} · {addModal.edgeBand.height} · {addModal.edgeBand.thickness}</h3>
            <form onSubmit={handleAddSubmit}>
              <div className="eb-modal__field">
                <label>Location</label>
                <input
                  type="text"
                  value={addLocation}
                  onChange={(e) => setAddLocation(e.target.value)}
                  placeholder="e.g. A, B, Rack 3"
                  autoFocus
                />
              </div>
              <div className="eb-modal__field">
                <label>Qty (rolls)</label>
                <input
                  type="number"
                  min="1"
                  value={addQty}
                  onChange={(e) => setAddQty(e.target.value)}
                />
              </div>
              {addError && <p className="eb-modal__error">{addError}</p>}
              <div className="eb-modal__actions">
                <button type="submit" className="eb-modal__btn eb-modal__btn--confirm" disabled={addLoading}>
                  {addLoading ? "Saving..." : "Add Rolls"}
                </button>
                <button type="button" className="eb-modal__btn eb-modal__btn--cancel" onClick={() => setAddModal(null)}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Deduct Rolls Modal */}
      {deductModal && (
        <div className="eb-modal-overlay" onClick={() => setDeductModal(null)}>
          <div className="eb-modal" onClick={(e) => e.stopPropagation()}>
            <h3>Deduct Rolls — {deductModal.edgeBand.code} · {deductModal.edgeBand.height} · {deductModal.edgeBand.thickness}</h3>
            <form onSubmit={handleDeductSubmit}>
              <div className="eb-modal__field">
                <label>Location</label>
                <select
                  value={deductLocation}
                  onChange={(e) => setDeductLocation(e.target.value)}
                >
                  {deductModal.edgeBand.locations.map((loc) => (
                    <option key={loc.position} value={loc.position}>
                      {loc.position} (available: {loc.qty})
                    </option>
                  ))}
                </select>
              </div>
              <div className="eb-modal__field">
                <label>Qty to Deduct</label>
                <input
                  type="number"
                  min="1"
                  value={deductQty}
                  onChange={(e) => setDeductQty(e.target.value)}
                />
              </div>
              {deductError && <p className="eb-modal__error">{deductError}</p>}
              <div className="eb-modal__actions">
                <button type="submit" className="eb-modal__btn eb-modal__btn--confirm" disabled={deductLoading}>
                  {deductLoading ? "Saving..." : "Deduct Rolls"}
                </button>
                <button type="button" className="eb-modal__btn eb-modal__btn--cancel" onClick={() => setDeductModal(null)}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteModal && (
        <div className="eb-modal-overlay" onClick={() => setDeleteModal(null)}>
          <div className="eb-modal" onClick={(e) => e.stopPropagation()}>
            <h3>Confirm Delete</h3>
            <p>Delete <strong>{deleteModal.uniqueCode}</strong>? This cannot be undone.</p>
            <div className="eb-modal__actions">
              <button
                className="eb-modal__btn eb-modal__btn--delete"
                onClick={handleDeleteConfirm}
                disabled={deleteLoading}
              >
                {deleteLoading ? "Deleting..." : "Yes, Delete"}
              </button>
              <button
                className="eb-modal__btn eb-modal__btn--cancel"
                onClick={() => setDeleteModal(null)}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EdgeBandInventoryList;
