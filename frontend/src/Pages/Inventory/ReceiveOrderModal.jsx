import { useState, useContext } from "react";
import axios from "axios";
import "../../css/Inventory/ReceiveOrderModal.scss";
import { AuthContext } from "../../Components/AuthContext";
import ErrorModal from "../../Components/ErrorModal";

const ReceiveOrderModal = ({ order, isOpen, onClose, onSuccess }) => {
  const { user } = useContext(AuthContext);
  const [receivedQty, setReceivedQty] = useState(order?.orderedQty || 0);
  const [receivedDate, setReceivedDate] = useState(new Date().toISOString().split('T')[0]);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen || !order) return null;

  const handleConfirm = async () => {
    setError("");
    setIsSubmitting(true);

    try {
      // 1. Update Material Order
      const updateOrderPayload = {
        status: "Received",
        receivedQty: Number(receivedQty),
        receivedDate: new Date(receivedDate),
      };

      await axios.put(
        `${import.meta.env.VITE_APP_ROUTE}/materialOrders/${order._id}`,
        updateOrderPayload
      );

      // 2. Update Warehouse Inventory Stock
      const addStockPayload = {
        qtyToAdd: Number(receivedQty)
      };
      
      await axios.put(
        `${import.meta.env.VITE_APP_ROUTE}/warehouseInventory/add-stock/${order.boardCode}`,
        addStockPayload
      );

      // 3. Log the Action
      const logPayload = {
        user: user.username,
        action: `Received Material Order for ${order.boardCode}`,
        previousData: { ...order, status: "On Order" },
        updatedData: { ...order, ...updateOrderPayload },
      };


      
      await axios.post(
        `${import.meta.env.VITE_APP_ROUTE}/logs/add`,
        logPayload
      );

      onSuccess();
      onClose();
    } catch (err) {
      console.error("Error receiving order:", err);
      setError(err.response?.data?.message || "Failed to process receipt.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h2>Receive Order</h2>
        <div className="modal-body">
            <p><strong>Material:</strong> {order.boardCode}</p>
            <p><strong>Supplier:</strong> {order.supplier}</p>
            
            <div className="form-group">
                <label>Received Qty:</label>
                <input 
                    type="number" 
                    value={receivedQty} 
                    onChange={(e) => setReceivedQty(e.target.value)}
                    min="0"
                />
            </div>

            <div className="form-group">
                <label>Received Date:</label>
                <input 
                    type="date" 
                    value={receivedDate} 
                    onChange={(e) => setReceivedDate(e.target.value)}
                />
            </div>

            {error && <p className="error-message">{error}</p>}
        </div>
        <div className="modal-actions">
          <button onClick={onClose} disabled={isSubmitting} className="secondary-btn">Cancel</button>
          <button onClick={handleConfirm} disabled={isSubmitting} className="primary-btn">
            {isSubmitting ? "Processing..." : "Confirm"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ReceiveOrderModal;
