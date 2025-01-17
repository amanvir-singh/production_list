import { useState, useEffect, useContext } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import "../../css/Finishes/FinishForm.scss";
import { AuthContext } from "../../Components/AuthContext";
import ErrorModal from "../../Components/ErrorModal";

const EditFinish = () => {
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [backendError, setBackendError] = useState("");
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  const canEditFinish = user.role === "Editor" || user.role === "admin";

  useEffect(() => {
    fetchFinish();
  }, []);

  const fetchFinish = async () => {
    try {
      const response = await axios.get(
        `${import.meta.env.VITE_APP_ROUTE}/finishes/${id}`
      );
      const { name, code } = response.data;
      setName(name);
      setCode(code);
    } catch (error) {
      console.error("Error fetching finish:", error);
      setBackendError("Error fetching finish data. Please try again.");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.put(`${import.meta.env.VITE_APP_ROUTE}/finishes/${id}`, {
        name,
        code,
      });
      navigate("/manage/finishesList");
    } catch (error) {
      console.error("Error updating finish:", error);
      setBackendError(
        error.response?.data?.message ||
          "An error occurred while updating the finish."
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
      {canEditFinish ? (
        <div className="finish-form">
          <h1>Edit Finish</h1>
          <form onSubmit={handleSubmit}>
            <div>
              <label htmlFor="name">Name:</label>
              <input
                type="text"
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
            <div>
              <label htmlFor="code">Code:</label>
              <input
                type="text"
                id="code"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                required
              />
            </div>
            <button type="submit">Update Finish</button>
          </form>
        </div>
      ) : (
        "You do not have permission to edit a Finish. Please contact an administrator for assistance."
      )}
    </div>
  );
};

export default EditFinish;
