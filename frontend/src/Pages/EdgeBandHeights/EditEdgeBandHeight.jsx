import { useState, useEffect, useContext } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { AuthContext } from "../../Components/AuthContext";
import ErrorModal from "../../Components/ErrorModal";
import "../../css/EdgeBandHeights/EdgeBandHeightsForm.scss";

const EditEdgeBandHeight = () => {
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [backendError, setBackendError] = useState("");
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  const canEdit = user.role === "Editor" || user.role === "admin";

  useEffect(() => {
    const fetchHeight = async () => {
      try {
        const response = await axios.get(
          `${import.meta.env.VITE_APP_ROUTE}/edgeBandHeight/${id}`
        );
        setName(response.data.name);
        setCode(response.data.code);
      } catch (error) {
        setBackendError("Error fetching edgeband height data.");
      }
    };
    fetchHeight();
  }, [id]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const originalRes = await axios.get(
        `${import.meta.env.VITE_APP_ROUTE}/edgeBandHeight/${id}`
      );
      await axios.put(
        `${import.meta.env.VITE_APP_ROUTE}/edgeBandHeight/${id}`,
        { name, code }
      );
      await axios.post(`${import.meta.env.VITE_APP_ROUTE}/edgeBandLog/add`, {
        user: user.username,
        action: `Edited Edgeband Height: ${originalRes.data.name} (${originalRes.data.code})`,
        previousData: originalRes.data,
        updatedData: { name, code },
      });
      navigate("/manage/edgeBandHeightsList");
    } catch (error) {
      setBackendError(
        error.response?.data?.message ||
          "An error occurred while updating the edgeband height."
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
        <h1>Edit Edgeband Height</h1>
        {canEdit ? (
          <form onSubmit={handleSubmit}>
            <div>
              <label htmlFor="name">Name (display):</label>
              <input
                type="text"
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
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
                required
              />
            </div>
            <button type="submit">Update Height</button>
          </form>
        ) : (
          <p>You do not have permission to edit edgeband heights.</p>
        )}
      </div>
    </div>
  );
};

export default EditEdgeBandHeight;
