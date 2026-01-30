import { useContext, useState, useEffect, useMemo } from "react";
import axios from "axios";
import "../../css/Inventory/AddStock.scss";
import { AuthContext } from "../../Components/AuthContext";
import ErrorModal from "../../Components/ErrorModal";
import Select from "react-select";

const AddStock = ({
  onSuccess,
  onCancel,
}) => {
  
  const [warehouseInventory, setWarehouseInventory] = useState([]);
  const [selectedBoardCode, setSelectedBoardCode] = useState("");
  const [qtyToAdd, setQtyToAdd] = useState(0);

  const [backendError, setBackendError] = useState("");

  const { user } = useContext(AuthContext);

  const canAddStock = user.role === "Editor" || user.role === "admin";

  useEffect(() => {
    fetchWarehouseInventory();
  }, []);

const fetchWarehouseInventory = async () => {
  try {
    const response = await axios.get(
      `${import.meta.env.VITE_APP_ROUTE}/warehouseInventory`
    );
    
    const data = response.data;
    setWarehouseInventory(data || []);
  } catch (error) {
    console.error("Error fetching board code:", error);
  }
};

const dropdownOptions = useMemo(() => {
    const options = new Set();
    const optionMap = new Map();

    warehouseInventory.forEach((item) => {
      const key = item.boardCode;
      if (key && !options.has(key)) {
        options.add(key);
        optionMap.set(key, item);
      }
    });

    return Array.from(options).sort().map(opt => ({ value: opt, label: opt }));
  }, [warehouseInventory]);

 const handleSelectChange = (selectedOption) => {
    const value = selectedOption ? selectedOption.value : "";
    setSelectedBoardCode(value);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      if (!selectedBoardCode) {
        setBackendError(
          "Board Code is empty. Fill required fields or enable manual."
        );
        return;
      }

      if (!Number.isFinite(qtyToAdd)) {
        setBackendError("Qty to add must be a valid number.");
        return;
      }

      if (!selectedBoardCode) {
        setBackendError(
          "Board Code is empty. Fill required fields or enable manual."
        );
        return;
      }

      const addStockPayload = {
        qtyToAdd: Number(qtyToAdd)
      };
      
      await axios.put(
        `${import.meta.env.VITE_APP_ROUTE}/warehouseInventory/add-stock/${selectedBoardCode}`,
        addStockPayload
      );

        // Log action
        await axios.post(`${import.meta.env.VITE_APP_ROUTE}/logs/add`, {
          user: user.username,
          action: `Added Stock for Board Code: ${selectedBoardCode} with Qty: ${qtyToAdd}`,
          updatedData: qtyToAdd,
        });

      if (typeof onSuccess === "function") onSuccess();
    } catch (error) {
      console.error("Error adding inventory material:", error);
      setBackendError(
        error.response?.data?.message ||
          "An error occurred while adding the inventory material."
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

      <div className="inventory-form">
        <h1>
          Add Stock
        </h1>

        {canAddStock ? (
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="boardCodeSelect">Select Board Code:</label>
              <Select
                id="boardCodeSelect"
                className="react-select-container"
                classNamePrefix="react-select"
                value={dropdownOptions.find(opt => opt.value === selectedBoardCode) || null}
                onChange={handleSelectChange}
                options={dropdownOptions}
                isClearable
                placeholder="-- Select Board Code --"
                required
              />
            </div>


            <div>
              <label htmlFor="qtyToAdd">Qty to add:</label>
              <input
                type="number"
                id="qtyToAdd"
                value={qtyToAdd}
                onChange={(e) => setQtyToAdd(e.target.valueAsNumber)}
                min="0"
              />
            </div>

            <button type="submit">
              Add Stock
            </button>
              <button
                type="button"
                className="secondary-btn"
                onClick={onCancel}
              >
                Cancel
              </button>
          </form>
        ) : (
          <span className="no_permission_text">
            You do not have permission to add Stock. Please contact an
            administrator.
          </span>
        )}
      </div>
    </div>
  );
};

export default AddStock;
