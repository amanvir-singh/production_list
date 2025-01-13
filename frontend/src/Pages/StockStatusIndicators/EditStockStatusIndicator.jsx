import { useState, useEffect, useContext } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import "../../css/StockStatusIndicators/StockStatusIndicatorForm.scss";
import { AuthContext } from "../../Components/AuthContext";
import ErrorModal from "../../Components/ErrorModal";

const EditStockStatusIndicator = () => {
  const [name, setName] = useState("");
  const [color, setColor] = useState("#000000");
  const [backendError, setBackendError] = useState("");
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  const canEditIndicator =
    user.role === "Editor" ||
    user.role === "Manager" ||
    user.role === "Inventory Associate" ||
    user.role === "admin";

  useEffect(() => {
    fetchIndicator();
  }, []);

  const fetchIndicator = async () => {
    try {
      const response = await axios.get(
        `${import.meta.env.VITE_APP_ROUTE}/stockStatusIndicators/${id}`
      );
      const { name, color } = response.data;
      setName(name);
      setColor(color);
    } catch (error) {
      console.error("Error fetching stock status indicator:", error);
      setBackendError(
        "Error fetching stock status indicator data. Please try again."
      );
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.put(
        `${import.meta.env.VITE_APP_ROUTE}/stockStatusIndicators/${id}`,
        {
          name,
          color,
        }
      );
      navigate("/manage/stockStatusIndicatorsList");
    } catch (error) {
      console.error("Error updating stock status indicator:", error);
      setBackendError(
        error.response?.data?.message ||
          "An error occurred while updating the stock status indicator."
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
      {canEditIndicator ? (
        <div className="stock-status-indicator-form">
          <h1>Edit Stock Status Indicator</h1>
          <form onSubmit={handleSubmit}>
            <div>
              <label htmlFor="name">Status Name:</label>
              <input
                type="text"
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
            <div>
              <label htmlFor="color">Color:</label>
              <input
                type="color"
                id="color"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                required
              />
            </div>
            <button type="submit">Update Stock Status Indicator</button>
          </form>
        </div>
      ) : (
        "You do not have permission to edit a Stock Status Indicator. Please contact an administrator for assistance."
      )}
    </div>
  );
};

export default EditStockStatusIndicator;
