import { useState, useEffect, useContext } from "react";
import axios from "axios";
import Select from "react-select";
import { AuthContext } from "../../Components/AuthContext";
import "../../css/EdgeBandInventory/AddEdgeBandStock.scss";

const EDITABLE_ROLES = ["Editor", "Manager", "admin", "Edgebander"];

const AddEdgeBandStock = ({ onSuccess, onCancel }) => {
  const { user } = useContext(AuthContext);
  const canEdit = EDITABLE_ROLES.includes(user?.role);

  const [edgeBands, setEdgeBands] = useState([]);
  const [selectedEdgeBand, setSelectedEdgeBand] = useState(null);
  const [location, setLocation] = useState("");
  const [qty, setQty] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    const fetchEdgeBands = async () => {
      try {
        const res = await axios.get(
          `${import.meta.env.VITE_APP_ROUTE}/edgeBandInventory`
        );
        setEdgeBands(res.data);
      } catch {
        setError("Failed to load edgebands.");
      }
    };
    fetchEdgeBands();
  }, []);

  const edgeBandOptions = edgeBands.map((eb) => ({
    value: eb._id,
    label: `${eb.code} · ${eb.height} · ${eb.thickness}`,
    eb,
  }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedEdgeBand) {
      setError("Please select an edgeband.");
      return;
    }
    if (!location.trim() || !qty || Number(qty) <= 0) {
      setError("Location and a positive quantity are required.");
      return;
    }

    setLoading(true);
    setError("");
    setSuccess("");

    try {
      await axios.put(
        `${import.meta.env.VITE_APP_ROUTE}/edgeBandInventory/add-stock/${selectedEdgeBand.value}`,
        {
          locations: [{ position: location.trim(), qty: Number(qty) }],
          user: user.username,
        }
      );
      setSuccess(`Added ${qty} roll(s) at ${location} to ${selectedEdgeBand.eb.uniqueCode}.`);
      setSelectedEdgeBand(null);
      setLocation("");
      setQty("");
      if (onSuccess) onSuccess();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to add stock.");
    } finally {
      setLoading(false);
    }
  };

  if (!canEdit) {
    return (
      <div className="add-eb-stock">
        <p className="add-eb-stock__no-permission">
          You do not have permission to add edgeband stock.
        </p>
      </div>
    );
  }

  return (
    <div className="add-eb-stock">
      <h2 className="add-eb-stock__title">Add Edgeband Stock</h2>

      <form className="add-eb-stock__form" onSubmit={handleSubmit}>
        <div className="add-eb-stock__field">
          <label>Select Edgeband</label>
          <Select
            options={edgeBandOptions}
            value={selectedEdgeBand}
            onChange={setSelectedEdgeBand}
            placeholder="Search and select edgeband..."
            isClearable
            classNamePrefix="add-eb-stock-select"
          />
        </div>

        <div className="add-eb-stock__field">
          <label>Location</label>
          <input
            type="text"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="e.g. A, Rack 3, Shelf B"
          />
        </div>

        <div className="add-eb-stock__field">
          <label>Qty (rolls)</label>
          <input
            type="number"
            min="1"
            value={qty}
            onChange={(e) => setQty(e.target.value)}
          />
        </div>

        {error && <p className="add-eb-stock__error">{error}</p>}
        {success && <p className="add-eb-stock__success">{success}</p>}

        <div className="add-eb-stock__actions">
          <button
            type="submit"
            className="add-eb-stock__btn"
            disabled={loading}
          >
            {loading ? "Saving..." : "Add Stock"}
          </button>
          {onCancel && (
            <button
              type="button"
              className="add-eb-stock__btn add-eb-stock__btn--cancel"
              onClick={onCancel}
            >
              Cancel
            </button>
          )}
        </div>
      </form>
    </div>
  );
};

export default AddEdgeBandStock;
