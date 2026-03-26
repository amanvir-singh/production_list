import { useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { AuthContext } from "../../Components/AuthContext";
import ErrorModal from "../../Components/ErrorModal";
import "../../css/EdgeBandHeights/EdgeBandHeightsForm.scss";

const AddEdgeBandHeight = () => {
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [backendError, setBackendError] = useState("");
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  const canAdd = user.role === "Editor" || user.role === "admin";

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${import.meta.env.VITE_APP_ROUTE}/edgeBandHeight/add`, {
        name,
        code,
      });
      await axios.post(`${import.meta.env.VITE_APP_ROUTE}/edgeBandLog/add`, {
        user: user.username,
        action: `Added Edgeband Height: ${name} (${code})`,
        updatedData: { name, code },
      });
      navigate("/manage/edgeBandHeightsList");
    } catch (error) {
      setBackendError(
        error.response?.data?.message ||
          "An error occurred while adding the edgeband height."
      );
    }
  };

  return (
    <div>
      <ErrorModal
        message={backendError}
        onClose={() => setBackendError("")}
        show={!!backendError}
      />
      <div className="eb-form-page__form-wrap">
        <h1>Add Edgeband Height</h1>
        {canAdd ? (
          <form onSubmit={handleSubmit}>
            <div>
              <label htmlFor="name">Name (display):</label>
              <input
                type="text"
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder='e.g. 1-3/4"'
                required
              />
            </div>
            <div>
              <label htmlFor="code">Code (decimal):</label>
              <input
                type="text"
                id="code"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="e.g. 1.75"
                required
              />
            </div>
            <button type="submit">Add Height</button>
          </form>
        ) : (
          <p>You do not have permission to add edgeband heights.</p>
        )}
      </div>
    </div>
  );
};

export default AddEdgeBandHeight;
