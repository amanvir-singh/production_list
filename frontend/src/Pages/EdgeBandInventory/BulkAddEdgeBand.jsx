import { useState, useEffect, useContext } from "react";
import axios from "axios";
import Select from "react-select";
import { AuthContext } from "../../Components/AuthContext";
import "../../css/EdgeBandInventory/BulkAddEdgeBand.scss";

const EDITABLE_ROLES = ["Editor", "Manager", "admin", "Edgebander"];

const BulkAddEdgeBand = ({ onCancel }) => {
  const { user } = useContext(AuthContext);
  const canEdit = EDITABLE_ROLES.includes(user?.role);

  const [height, setHeight] = useState(null);
  const [thickness, setThickness] = useState(null);
  const [codesInput, setCodesInput] = useState("");

  const [heightOptions, setHeightOptions] = useState([]);
  const [thicknessOptions, setThicknessOptions] = useState([]);

  const [results, setResults] = useState([]); // [{ code, status, message }]
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

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

  const parsedCodes = codesInput
    .split(",")
    .map((c) => c.trim())
    .filter((c) => c.length > 0);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!height || !thickness) {
      setError("Height and thickness are required.");
      return;
    }
    if (parsedCodes.length === 0) {
      setError("Enter at least one edgeband code.");
      return;
    }

    setLoading(true);
    setResults([]);

    const newResults = [];

    for (const code of parsedCodes) {
      try {
        await axios.post(`${import.meta.env.VITE_APP_ROUTE}/edgeBandInventory/add`, {
          code,
          height: height.value,
          thickness: thickness.value,
          user: user.username,
        });
        newResults.push({ code, status: "success", message: "Added" });
      } catch (err) {
        const msg = err.response?.data?.message || "Failed";
        const isDupe = err.response?.status === 400 && msg.toLowerCase().includes("already exists");
        newResults.push({ code, status: isDupe ? "duplicate" : "error", message: msg });
      }
    }

    setResults(newResults);
    setLoading(false);

    const allFailed = newResults.every((r) => r.status !== "success");
    if (!allFailed) {
      setCodesInput("");
    }
  };

  const handleReset = () => {
    setHeight(null);
    setThickness(null);
    setCodesInput("");
    setResults([]);
    setError("");
  };

  if (!canEdit) {
    return (
      <div className="bulk-eb">
        <p className="bulk-eb__no-permission">You do not have permission to add edgebands.</p>
      </div>
    );
  }

  const successCount = results.filter((r) => r.status === "success").length;
  const dupeCount = results.filter((r) => r.status === "duplicate").length;
  const errorCount = results.filter((r) => r.status === "error").length;

  return (
    <div className="bulk-eb">
      <h2 className="bulk-eb__title">Bulk Add Edgebands</h2>

      <form className="bulk-eb__form" onSubmit={handleSubmit}>
        <div className="bulk-eb__row">
          <div className="bulk-eb__field">
            <label>Height</label>
            <Select
              options={heightOptions}
              value={height}
              onChange={setHeight}
              placeholder="Select height..."
              isClearable
              classNamePrefix="bulk-eb-select"
            />
          </div>

          <div className="bulk-eb__field">
            <label>Thickness</label>
            <Select
              options={thicknessOptions}
              value={thickness}
              onChange={setThickness}
              placeholder="Select thickness..."
              isClearable
              classNamePrefix="bulk-eb-select"
            />
          </div>
        </div>

        <div className="bulk-eb__field">
          <label>
            Edgeband Codes{" "}
            <span className="bulk-eb__label-hint">(comma-separated)</span>
          </label>
          <textarea
            className="bulk-eb__textarea"
            value={codesInput}
            onChange={(e) => setCodesInput(e.target.value)}
            placeholder="e.g. 555, 556, 557A, 600"
            rows={3}
          />
          {parsedCodes.length > 0 && (
            <div className="bulk-eb__preview">
              {parsedCodes.map((c) => (
                <span key={c} className="bulk-eb__tag">{c}</span>
              ))}
            </div>
          )}
        </div>

        {error && <p className="bulk-eb__error">{error}</p>}

        <div className="bulk-eb__actions">
          <button
            type="submit"
            className="bulk-eb__btn bulk-eb__btn--submit"
            disabled={loading}
          >
            {loading ? `Adding... (${results.length}/${parsedCodes.length})` : `Add ${parsedCodes.length > 0 ? parsedCodes.length : ""} Edgeband${parsedCodes.length !== 1 ? "s" : ""}`}
          </button>
          <button
            type="button"
            className="bulk-eb__btn bulk-eb__btn--reset"
            onClick={handleReset}
            disabled={loading}
          >
            Reset
          </button>
          {onCancel && (
            <button
              type="button"
              className="bulk-eb__btn bulk-eb__btn--cancel"
              onClick={onCancel}
              disabled={loading}
            >
              Cancel
            </button>
          )}
        </div>
      </form>

      {results.length > 0 && (
        <div className="bulk-eb__results">
          <div className="bulk-eb__results-summary">
            {successCount > 0 && (
              <span className="bulk-eb__summary-badge bulk-eb__summary-badge--success">
                {successCount} added
              </span>
            )}
            {dupeCount > 0 && (
              <span className="bulk-eb__summary-badge bulk-eb__summary-badge--dupe">
                {dupeCount} already exist
              </span>
            )}
            {errorCount > 0 && (
              <span className="bulk-eb__summary-badge bulk-eb__summary-badge--error">
                {errorCount} failed
              </span>
            )}
          </div>

          <table className="bulk-eb__table">
            <thead>
              <tr>
                <th>Code</th>
                <th>Result</th>
              </tr>
            </thead>
            <tbody>
              {results.map((r) => (
                <tr key={r.code} className={`bulk-eb__row--${r.status}`}>
                  <td>{r.code}</td>
                  <td>{r.message}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default BulkAddEdgeBand;
