import { useContext, useState, useEffect, useMemo } from "react";
import axios from "axios";
import "../../css/Inventory/AddMaterialOrder.scss";
import { AuthContext } from "../../Components/AuthContext";
import ErrorModal from "../../Components/ErrorModal";

const AddMaterialOrder = ({
  mode = "add",
  initialData = null,
  onSuccess,
  onCancel,
}) => {
  const isEdit = mode === "edit";
  const { user } = useContext(AuthContext);
  const canManageOrders = user.role === "Editor" || user.role === "admin";

  const [warehouseInventory, setWarehouseInventory] = useState([]);
  const [backendError, setBackendError] = useState("");

  // Form Fields
  const [selectedIdentifier, setSelectedIdentifier] = useState(""); // The value in the dropdown
  const [boardCode, setBoardCode] = useState("");
  const [supplier, setSupplier] = useState("");
  const [finish, setFinish] = useState("");
  const [code, setCode] = useState("");
  const [thickness, setThickness] = useState("");
  const [format, setFormat] = useState("");
  
  const [qtyOrdered, setQtyOrdered] = useState("");
  const [anticipatedDate, setAnticipatedDate] = useState("");
  const [status, setStatus] = useState("To Order");

  // Fetch warehouse inventory on mount
  useEffect(() => {
    const fetchWarehouseInventory = async () => {
      try {
        const response = await axios.get(
          `${import.meta.env.VITE_APP_ROUTE}/warehouseInventory`
        );
        setWarehouseInventory(response.data || []);
      } catch (error) {
        console.error("Error fetching warehouse inventory:", error);
        setBackendError("Failed to load warehouse inventory.");
      }
    };

    fetchWarehouseInventory();
  }, []);

  // Initialize data for Edit mode
  useEffect(() => {
    if (isEdit && initialData && warehouseInventory.length > 0) {
      // Find the identifying key used (try to match boardCode)
      // Note: If original creation used aggregation key, we might need to find which one matches.
      // But for edit, we primarily trust the saved data.
      // However, to make the dropdown work, we need to find if there is a matching entry.
      setBoardCode(initialData.boardCode);
      setSupplier(initialData.supplier);
      setFinish(initialData.finish);
      setCode(initialData.code);
      setThickness(initialData.thickness);
      setFormat(initialData.format);
      setQtyOrdered(initialData.orderedQty);
      if (initialData.anticipatedDate) {
        setAnticipatedDate(initialData.anticipatedDate.split('T')[0]);
      }
      setStatus(initialData.status);

      // Try to set the identifier in dropdown.
      // We look for an item with matching boardCode. 
      // If found, what identifier does it use?
      const match = warehouseInventory.find(w => w.boardCode === initialData.boardCode);
      if(match) {
         if(match.aggregationKey) setSelectedIdentifier(match.aggregationKey);
         else setSelectedIdentifier(match.boardCode);
      } else {
         // Fallback if item no longer exists in current inventory, just show boardCode
         setSelectedIdentifier(initialData.boardCode); 
      }
    }
  }, [isEdit, initialData, warehouseInventory]);

  // Compute unique dropdown options
  const dropdownOptions = useMemo(() => {
    const options = new Set();
    const optionMap = new Map(); // key -> example item (to help with finding details later if needed)

    warehouseInventory.forEach((item) => {
      const key = item.aggregationKey ? item.aggregationKey : item.boardCode;
      if (key && !options.has(key)) {
        options.add(key);
        optionMap.set(key, item);
      }
    });

    return Array.from(options).sort();
  }, [warehouseInventory]);

  const handleIdentifierChange = (e) => {
    const value = e.target.value;
    setSelectedIdentifier(value);

    if (!value) {
      setBoardCode("");
      setSupplier("");
      setFinish("");
      setCode("");
      setThickness("");
      setFormat("");
      return;
    }

    // Find corresponding item in warehouseInventory
    // We prioritize items that match this key as aggregationKey OR boardCode
    const match = warehouseInventory.find(item => 
        (item.aggregationKey && item.aggregationKey === value) ||
        (!item.aggregationKey && item.boardCode === value)
    );

    if (match) {
      setBoardCode(match.boardCode);
      setSupplier(match.supplier);
      setCode(match.code);
      setThickness(match.thickness);
      setFormat(match.format);

      // Finish Extra logic
      if (match.aggregationKey && match.aggregationKey === value) {
          // Extract finish from aggregation key: between second and third underscore
          // Example: T_PM115_G1S_.75_5X9 -> G1S (index 2)
          const parts = value.split('_');
          if (parts.length > 2) {
              setFinish(parts[2]);
          } else {
              setFinish(match.finish);
          }
      } else {
          setFinish(match.finish);
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!boardCode) {
        setBackendError("Please select a valid material.");
        return;
    }

    const payload = {
        boardCode,
        supplier,
        finish,
        code,
        thickness,
        format,
        orderedQty: Number(qtyOrdered),
        anticipatedDate: anticipatedDate ? new Date(anticipatedDate) : null,
        status
    };

    try {
        if (isEdit && initialData?._id) {
            await axios.put(
                `${import.meta.env.VITE_APP_ROUTE}/materialOrders/${initialData._id}`,
                payload
            );
        } else {
            await axios.post(
                `${import.meta.env.VITE_APP_ROUTE}/materialOrders/add`,
                payload
            );
        }

        if (onSuccess) onSuccess();
    } catch (error) {
        console.error("Error saving material order:", error);
        setBackendError(error.response?.data?.message || "Failed to save order.");
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
        <h1>{isEdit ? "Edit Material Order" : "Add Material Order"}</h1>

        {canManageOrders ? (
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="materialSelect">Select Material (Board Code):</label>
              <select
                id="materialSelect"
                value={selectedIdentifier}
                onChange={handleIdentifierChange}
                required
                disabled={isEdit} 
              >
                <option value="">-- Select Material --</option>
                {dropdownOptions.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>Board Code:</label>
              <input type="text" value={boardCode} disabled />
            </div>

            <div className="form-group">
              <label>Supplier:</label>
              <input type="text" value={supplier} disabled />
            </div>

            <div className="form-group">
              <label>Code:</label>
              <input type="text" value={code} disabled />
            </div>

            <div className="form-group">
              <label>Finish:</label>
              <input type="text" value={finish} disabled />
            </div>

            <div className="form-group">
              <label>Thickness:</label>
              <input type="text" value={thickness} disabled />
            </div>

            <div className="form-group">
              <label>Format:</label>
              <input type="text" value={format} disabled />
            </div>

            <hr />

            <div className="form-group">
              <label htmlFor="qtyOrdered">Quantity to Order:</label>
              <input
                type="number"
                id="qtyOrdered"
                value={qtyOrdered}
                onChange={(e) => setQtyOrdered(e.target.value)}
                min="0"
                required
              />
            </div>

            <div className="form-group">
                <label htmlFor="anticipatedDate">Anticipated Delivery Date:</label>
                <input 
                    type="date" 
                    id="anticipatedDate"
                    value={anticipatedDate}
                    onChange={(e) => setAnticipatedDate(e.target.value)}
                />
            </div>

            <div className="form-group">
                <label htmlFor="status">Status:</label>
                <select 
                    id="status" 
                    value={status} 
                    onChange={(e) => setStatus(e.target.value)}
                    required
                >
                    <option value="To Order">To Order</option>
                    <option value="On Order">On Order</option>
                    <option value="Received">Received</option>
                    <option value="Cancelled">Cancelled</option>
                </select>
            </div>

            <button type="submit">
              {isEdit ? "Save Changes" : "Create Order"}
            </button>
            
            {onCancel && (
                <button type="button" className="secondary-btn" onClick={onCancel}>
                    Cancel
                </button>
            )}
          </form>
        ) : (
          <span className="no_permission_text">
            You do not have permission to manage orders.
          </span>
        )}
      </div>
    </div>
  );
};

export default AddMaterialOrder;
