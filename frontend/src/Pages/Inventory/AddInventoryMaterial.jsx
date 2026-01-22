import { useContext, useState, useEffect } from "react";
import axios from "axios";
import "../../css/Inventory/AddInventoryMaterial.scss";
import { AuthContext } from "../../Components/AuthContext";
import ErrorModal from "../../Components/ErrorModal";

const AddInventoryMaterial = ({
  mode = "add",
  initialData = null,
  onSuccess,
  onCancel,
}) => {
  const isEdit = mode === "edit";
  const [suppliers, setSuppliers] = useState([]);
  const [finishes, setFinishes] = useState([]);
  const [thicknesses, setThicknesses] = useState([]);

  // Form fields
  const [supplier, setSupplier] = useState("");
  const [colorCode, setColorCode] = useState("");
  const [finish, setFinish] = useState("");
  const [thickness, setThickness] = useState("");
  const [length, setLength] = useState("");
  const [width, setWidth] = useState("");

  const [manualBoardCode, setManualBoardCode] = useState(false);
  const [boardCode, setBoardCode] = useState("");
  const [useAggregationKey, setUseAggregationKey] = useState(false);
  const [aggregationKey, setAggregationKey] = useState("");

  // Warehouse inventory fields
  const [format, setFormat] = useState("");
  const [warehouseQty, setWarehouseQty] = useState(0);
  const [tlfQty, setTlfQty] = useState(0);
  const [onHandQty, setOnHandQty] = useState(0);
  const [reservedQty, setReservedQty] = useState(0);
  const [availableQty, setAvailableQty] = useState(0);
  const [onOrderQty, setOnOrderQty] = useState(0);
  const [projectedQty, setProjectedQty] = useState(0);

  const [backendError, setBackendError] = useState("");

  const { user } = useContext(AuthContext);

  const canAddInventory = user.role === "Editor" || user.role === "admin";

  useEffect(() => {
    fetchSuppliers();
    fetchFinishes();
    fetchThicknesses();
  }, []);

  useEffect(() => {
    if (!initialData) return;

    setColorCode(initialData.code || "");
    setFinish(initialData.finish || "");
    setThickness(initialData.thickness || "");
    setBoardCode(initialData.boardCode || "");

    const fmt = (initialData.format || "").toString().trim();

    if (fmt) {
      const parts = fmt.split(/x/i).map((p) => p.trim());

      if (parts.length >= 2) {
        const w = parts[0];
        const l = parts[1];

        setWidth(w);
        setLength(l);
      }
    }

    const agg = (initialData.aggregationKey || "").toString().trim();
    setUseAggregationKey(agg !== "");
    setAggregationKey(agg);

    setWarehouseQty(initialData.warehouseQty ?? 0);
    setTlfQty(initialData.tlfQty ?? 0);
    setReservedQty(initialData.reservedQty ?? 0);
    setOnOrderQty(initialData.onOrderQty ?? 0);
  }, [initialData]);

  useEffect(() => {
    if (!initialData && !useAggregationKey) {
      setAggregationKey("");
    }
  }, [useAggregationKey, initialData]);

  useEffect(() => {
    if (!initialData || suppliers.length === 0) return;

    const supplierCode = initialData.supplier;
    const supplierMatch = suppliers.find((s) => s.code === supplierCode);

    if (supplierMatch) setSupplier(supplierMatch._id);
  }, [initialData, suppliers]);

  useEffect(() => {
    if (!initialData || thicknesses.length === 0) return;

    const thicknessCode = initialData.thickness;
    const thicknessMatch = thicknesses.find((t) => t.name === thicknessCode);

    if (thicknessMatch) setThickness(thicknessMatch._id);
  }, [initialData, thicknesses]);

  useEffect(() => {
    if (!initialData || finishes.length === 0) return;

    const finishCode = initialData.finish;
    const finishMatch = finishes.find((f) => f.name === finishCode);

    if (finishMatch) setFinish(finishMatch._id);
  }, [initialData, finishes]);

  // Generate boardCode automatically
  useEffect(() => {
    if (!manualBoardCode) {
      generateBoardCode();
    }
  }, [supplier, colorCode, finish, thickness, width, length, manualBoardCode]);

  useEffect(() => {
    const wh = Number(warehouseQty) || 0;
    const tlf = Number(tlfQty) || 0;
    const reserved = Number(reservedQty) || 0;
    const onOrder = Number(onOrderQty) || 0;

    const onHand = wh + tlf;
    const available = Math.max(0, onHand - reserved);
    const projected = available + onOrder;

    setOnHandQty(onHand);
    setAvailableQty(available);
    setProjectedQty(projected);
  }, [warehouseQty, tlfQty, reservedQty, onOrderQty]);

  useEffect(() => {
    setFormat(width + " X " + length);
  }, [width, length]);

  const fetchSuppliers = async () => {
    try {
      const response = await axios.get(
        `${import.meta.env.VITE_APP_ROUTE}/suppliers`
      );
      setSuppliers(response.data || []);
    } catch (error) {
      console.error("Error fetching suppliers:", error);
    }
  };

  const fetchFinishes = async () => {
    try {
      const response = await axios.get(
        `${import.meta.env.VITE_APP_ROUTE}/finishes`
      );

      const sorted = (response.data || []).sort((a, b) =>
        a.name.localeCompare(b.name, undefined, { numeric: true })
      );

      setFinishes(sorted);
    } catch (error) {
      console.error("Error fetching finishes:", error);
    }
  };

  const fetchThicknesses = async () => {
    try {
      const response = await axios.get(
        `${import.meta.env.VITE_APP_ROUTE}/thicknesses`
      );
      setThicknesses(response.data || []);
    } catch (error) {
      console.error("Error fetching thicknesses:", error);
    }
  };

  const generateBoardCode = () => {
    if (!supplier || !colorCode || !finish || !thickness || !width || !length) {
      setBoardCode("");
      return;
    }

    const supplierCode = suppliers.find((s) => s._id === supplier)?.code || "";
    const finishCode = finishes.find((f) => f._id === finish)?.code || "";
    const thicknessCode =
      thicknesses.find((t) => t._id === thickness)?.code || "";

    setBoardCode(
      `${supplierCode}_${colorCode}_${finishCode}_${thicknessCode}_${width}X${length}`
    );
  };

  const ensureMaterialExists = async ({
    materialCode,
    supplierName,
    finishName,
    thicknessName,
    widthNum,
    lengthNum,
  }) => {
    try {
      await axios.get(
        `${
          import.meta.env.VITE_APP_ROUTE
        }/materials/by-code/${encodeURIComponent(materialCode)}`
      );

      return;
    } catch (err) {
      // If not found, create it.
      const status = err?.response?.status;

      if (status && status !== 404) {
        throw err;
      }

      const materialPayload = {
        code: materialCode.replace(/X/g, "x"),
        colorCode,
        name: "",
        thickness: thicknessName,
        length: lengthNum,
        width: widthNum,
        supplier: supplierName,
        finish: finishName,
      };

      await axios.post(
        `${import.meta.env.VITE_APP_ROUTE}/materials/add`,
        materialPayload
      );

      await axios.post(`${import.meta.env.VITE_APP_ROUTE}/logs/add`, {
        user: user.username,
        action: `Auto-added Material from Inventory: ${materialCode}`,
        updatedData: materialPayload,
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const supplierObj = suppliers.find((s) => s._id === supplier);
      const finishObj = finishes.find((f) => f._id === finish);
      const thicknessObj = thicknesses.find((t) => t._id === thickness);

      const supplierName = supplierObj?.name || "";
      const supplierCode = supplierObj?.code || "";
      const finishName = finishObj?.name || "";
      const thicknessName = thicknessObj?.name || "";

      if (!supplierName || !finishName || !thicknessName) {
        setBackendError("Supplier / Finish / Thickness lookup failed.");
        return;
      }

      const widthNum = Number(width);
      const lengthNum = Number(length);

      if (!Number.isFinite(widthNum) || !Number.isFinite(lengthNum)) {
        setBackendError("Width and Length must be valid numbers.");
        return;
      }

      if (!boardCode) {
        setBackendError(
          "Board Code is empty. Fill required fields or enable manual."
        );
        return;
      }

      // 1) Ensure the Material exists (by code == boardCode)

      await ensureMaterialExists({
        materialCode: boardCode,
        supplierName,
        finishName,
        thicknessName,
        widthNum,
        lengthNum,
      });

      // 2) Create warehouse inventory record
      const inventoryPayload = {
        supplier: supplierCode,
        code: colorCode,
        finish: finishName,
        thickness: thicknessName,
        format,
        boardCode,
        aggregationKey: useAggregationKey ? aggregationKey.trim() : "",

        warehouseQty: Number(warehouseQty) || 0,
        tlfQty: Number(tlfQty) || 0,
        onHandQty: Number(onHandQty) || 0,
        reservedQty: Number(reservedQty) || 0,
        availableQty: Number(availableQty) || 0,
        onOrderQty: Number(onOrderQty) || 0,
        projectedQty: Number(projectedQty) || 0,
      };

      if (isEdit) {
        const id = initialData?._id;
        if (!id) {
          setBackendError("Missing _id for edit.");
          return;
        }

        //Fetch original data for logging
        const previousDataResponse = await axios.get(
          `${import.meta.env.VITE_APP_ROUTE}/warehouseInventory/${id}`
        );
        const previousData = previousDataResponse.data;

        await axios.put(
          `${import.meta.env.VITE_APP_ROUTE}/warehouseInventory/${id}`,
          inventoryPayload
        );
        // Log action
        await axios.post(`${import.meta.env.VITE_APP_ROUTE}/logs/add`, {
          user: user.username,
          action: `Edited Warehouse Inventory Material: ${boardCode}`,
          previousData: previousData,
          updatedData: inventoryPayload,
        });
      } else {
        await axios.post(
          `${import.meta.env.VITE_APP_ROUTE}/warehouseInventory/add`,
          inventoryPayload
        );

        // Log action
        await axios.post(`${import.meta.env.VITE_APP_ROUTE}/logs/add`, {
          user: user.username,
          action: `Added Warehouse Inventory Material: ${boardCode}`,
          updatedData: inventoryPayload,
        });
      }

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
          {isEdit
            ? "Edit Warehouse Inventory Material"
            : "Add Warehouse Inventory Material"}
        </h1>

        {canAddInventory ? (
          <form onSubmit={handleSubmit}>
            <div>
              <label htmlFor="supplier">Supplier:</label>
              <select
                id="supplier"
                value={supplier}
                onChange={(e) => setSupplier(e.target.value)}
                required
              >
                <option value="">Select a supplier</option>
                {suppliers.map((s) => (
                  <option key={s._id} value={s._id}>
                    {s.name} ({s.code})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="colorCode">Color Code:</label>
              <input
                type="text"
                id="colorCode"
                value={colorCode}
                onChange={(e) => setColorCode(e.target.value)}
                required
              />
            </div>

            <div>
              <label htmlFor="finish">Finish:</label>
              <select
                id="finish"
                value={finish}
                onChange={(e) => setFinish(e.target.value)}
                required
              >
                <option value="">Select a finish</option>
                {finishes.map((f) => (
                  <option key={f._id} value={f._id}>
                    {f.name} ({f.code})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="thickness">Thickness:</label>
              <select
                id="thickness"
                value={thickness}
                onChange={(e) => setThickness(e.target.value)}
                required
              >
                <option value="">Select a thickness</option>
                {thicknesses.map((t) => (
                  <option key={t._id} value={t._id}>
                    {t.name} ({t.code})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="width">Width (in feet):</label>
              <input
                type="number"
                id="width"
                value={width}
                onChange={(e) => setWidth(e.target.value)}
                required
              />
            </div>

            <div>
              <label htmlFor="length">Length (in feet):</label>
              <input
                type="number"
                id="length"
                value={length}
                onChange={(e) => setLength(e.target.value)}
                required
              />
            </div>

            <div>
              <label htmlFor="format">Format:</label>
              <input
                type="text"
                id="format"
                placeholder=""
                value={format}
                disabled
                onChange={(e) => setFormat(e.target.value)}
                required
              />
            </div>

            <div>
              <label htmlFor="boardCode">Board Code:</label>
              <input
                type="text"
                id="boardCode"
                value={boardCode}
                onChange={(e) => setBoardCode(e.target.value)}
                disabled={!manualBoardCode}
                required
              />
            </div>

            <div>
              <label>
                <input
                  type="checkbox"
                  checked={manualBoardCode}
                  onChange={(e) => setManualBoardCode(e.target.checked)}
                />
                Change Board Code Manually
              </label>
            </div>

            <div>
              <label>
                <input
                  type="checkbox"
                  checked={useAggregationKey}
                  onChange={(e) => setUseAggregationKey(e.target.checked)}
                />
                Use aggregation key
              </label>
            </div>

            {useAggregationKey && (
              <div>
                <label htmlFor="aggregationKey">Aggregation Key:</label>
                <input
                  type="text"
                  id="aggregationKey"
                  value={aggregationKey}
                  onChange={(e) => setAggregationKey(e.target.value)}
                  required
                />
              </div>
            )}

            <hr />

            <div>
              <label htmlFor="warehouseQty">Warehouse Qty:</label>
              <input
                type="number"
                id="warehouseQty"
                value={warehouseQty}
                onChange={(e) => setWarehouseQty(e.target.value)}
                min="0"
              />
            </div>

            <div>
              <label htmlFor="tlfQty">TLF Qty:</label>
              <input
                type="number"
                id="tlfQty"
                value={tlfQty}
                onChange={(e) => setTlfQty(e.target.value)}
                min="0"
                disabled
              />
            </div>

            <div>
              <label htmlFor="reservedQty">Reserved Qty:</label>
              <input
                type="number"
                id="reservedQty"
                value={reservedQty}
                onChange={(e) => setReservedQty(e.target.value)}
                min="0"
              />
            </div>

            <div>
              <label htmlFor="onHandQty">On-Hand Qty:</label>
              <input type="number" id="onHandQty" value={onHandQty} disabled />
            </div>

            <div>
              <label htmlFor="availableQty">Available Qty:</label>
              <input
                type="number"
                id="availableQty"
                value={availableQty}
                disabled
              />
            </div>

            <div>
              <label htmlFor="onOrderQty">On-Order Qty:</label>
              <input
                type="number"
                id="onOrderQty"
                value={onOrderQty}
                onChange={(e) => setOnOrderQty(e.target.value)}
                min="0"
              />
            </div>

            <div>
              <label htmlFor="projectedQty">Projected Qty:</label>
              <input
                type="number"
                id="projectedQty"
                value={projectedQty}
                disabled
              />
            </div>

            <button type="submit">
              {isEdit ? "Save Changes" : "Add Inventory Material"}
            </button>
            {isEdit && (
              <button
                type="button"
                className="secondary-btn"
                onClick={onCancel}
              >
                Cancel
              </button>
            )}
          </form>
        ) : (
          <span className="no_permission_text">
            You do not have permission to add Inventory. Please contact an
            administrator.
          </span>
        )}
      </div>
    </div>
  );
};

export default AddInventoryMaterial;
