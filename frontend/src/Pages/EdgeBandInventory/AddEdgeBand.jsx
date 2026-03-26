import { useState, useEffect, useContext } from "react";
import axios from "axios";
import Select from "react-select";
import { AuthContext } from "../../Components/AuthContext";
import "../../css/EdgeBandInventory/AddEdgeBand.scss";

const EDITABLE_ROLES = ["Editor", "Manager", "admin", "Edgebander"];

const AddEdgeBand = ({ mode = "add", initialData = null, onSuccess, onCancel }) => {
  const { user } = useContext(AuthContext);
  const canEdit = EDITABLE_ROLES.includes(user?.role);

  const [code, setCode] = useState("");
  const [height, setHeight] = useState(null);
  const [thickness, setThickness] = useState(null);

  const [heightOptions, setHeightOptions] = useState([]);
  const [thicknessOptions, setThicknessOptions] = useState([]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    const fetchOptions = async () => {
      try {
        const [hRes, tRes] = await Promise.all([
          axios.get(`${import.meta.env.VITE_APP_ROUTE}/edgeBandHeight`),
          axios.get(`${import.meta.env.VITE_APP_ROUTE}/edgeBandThickness`),
        ]);
        setHeightOptions(hRes.data.map((h) => ({ value: h.name, label: h.name })));
        setThicknessOptions(tRes.data.map((t) => ({ value: t.name, label: t.name })));
      } catch {
        setError("Failed to load height/thickness options.");
      }
    };
    fetchOptions();
  }, []);

  useEffect(() => {
    if (mode === "edit" && initialData) {
      setCode(initialData.code || "");
      setHeight(initialData.height ? { value: initialData.height, label: initialData.height } : null);
      setThickness(initialData.thickness ? { value: initialData.thickness, label: initialData.thickness } : null);
    }
  }, [mode, initialData]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!code.trim() || !height || !thickness) {
      setError("Code, height, and thickness are required.");
      return;
    }

    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const payload = {
        code: code.trim(),
        height: height.value,
        thickness: thickness.value,
        user: user.username,
      };

      if (mode === "edit" && initialData?._id) {
        await axios.put(
          `${import.meta.env.VITE_APP_ROUTE}/edgeBandInventory/${initialData._id}`,
          payload
        );
        setSuccess("Edgeband updated.");
      } else {
        await axios.post(
          `${import.meta.env.VITE_APP_ROUTE}/edgeBandInventory/add`,
          payload
        );
        setSuccess("Edgeband added.");
        setCode("");
        setHeight(null);
        setThickness(null);
      }

      if (onSuccess) onSuccess();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to save edgeband.");
    } finally {
      setLoading(false);
    }
  };

  if (!canEdit) {
    return (
      <div className="add-eb">
        <p className="add-eb__no-permission">
          You do not have permission to add or edit edgebands.
        </p>
      </div>
    );
  }

  return (
    <div className="add-eb">
      <h2 className="add-eb__title">
        {mode === "edit" ? "Edit Edgeband" : "Add New Edgeband"}
      </h2>

      <form className="add-eb__form" onSubmit={handleSubmit}>
        <div className="add-eb__field">
          <label>Edgeband Code</label>
          <input
            type="text"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="e.g. 555"
          />
        </div>

        <div className="add-eb__field">
          <label>Height</label>
          <Select
            options={heightOptions}
            value={height}
            onChange={setHeight}
            placeholder="Select height..."
            isClearable
            classNamePrefix="add-eb-select"
          />
        </div>

        <div className="add-eb__field">
          <label>Thickness</label>
          <Select
            options={thicknessOptions}
            value={thickness}
            onChange={setThickness}
            placeholder="Select thickness..."
            isClearable
            classNamePrefix="add-eb-select"
          />
        </div>

        {error && <p className="add-eb__error">{error}</p>}
        {success && <p className="add-eb__success">{success}</p>}

        <div className="add-eb__actions">
          <button type="submit" className="add-eb__btn add-eb__btn--submit" disabled={loading}>
            {loading ? "Saving..." : mode === "edit" ? "Save Changes" : "Add Edgeband"}
          </button>
          {onCancel && (
            <button type="button" className="add-eb__btn add-eb__btn--cancel" onClick={onCancel}>
              Cancel
            </button>
          )}
        </div>
      </form>
    </div>
  );
};

export default AddEdgeBand;
