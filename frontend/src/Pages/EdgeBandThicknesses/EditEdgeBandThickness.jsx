import { useState, useEffect, useContext } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { AuthContext } from "../../Components/AuthContext";
import ErrorModal from "../../Components/ErrorModal";
import "../../css/EdgeBandThicknesses/EdgeBandThicknessesForm.scss";

const EditEdgeBandThickness = () => {
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [backendError, setBackendError] = useState("");
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  const canEdit = user.role === "Editor" || user.role === "admin";

  useEffect(() => {
    const fetchThickness = async () => {
      try {
        const response = await axios.get(
          `${import.meta.env.VITE_APP_ROUTE}/edgeBandThickness/${id}`
        );
        setName(response.data.name);
        setCode(response.data.code);
      } catch (error) {
        setBackendError("Error fetching edgeband thickness data.");
      }
    };
    fetchThickness();
  }, [id]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const originalRes = await axios.get(
        `${import.meta.env.VITE_APP_ROUTE}/edgeBandThickness/${id}`
      );
      await axios.put(
        `${import.meta.env.VITE_APP_ROUTE}/edgeBandThickness/${id}`,
        { name, code }
      );
      await axios.post(`${import.meta.env.VITE_APP_ROUTE}/edgeBandLog/add`, {
        user: user.username,
        action: `Edited Edgeband Thickness: ${originalRes.data.name} (${originalRes.data.code})`,
        previousData: originalRes.data,
        updatedData: { name, code },
      });
      navigate("/manage/edgeBandThicknessesList");
    } catch (error) {
      setBackendError(
        error.response?.data?.message ||
          "An error occurred while updating the edgeband thickness."
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
        <h1>Edit Edgeband Thickness</h1>
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
            <button type="submit">Update Thickness</button>
          </form>
        ) : (
          <p>You do not have permission to edit edgeband thicknesses.</p>
        )}
      </div>
    </div>
  );
};

export default EditEdgeBandThickness;
