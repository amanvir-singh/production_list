import { useState, useContext } from "react";
import axios from "axios";
import "../../css/Inventory/ReceiveOrderModal.scss"; 
import { AuthContext } from "../../Components/AuthContext";

const MarkOrderedModal = ({ order, isOpen, onClose, onSuccess }) => {
  const { user } = useContext(AuthContext);
  const [orderedQty, setOrderedQty] = useState(order?.orderedQty || 0);
  const [anticipatedDate, setAnticipatedDate] = useState(order?.anticipatedDate?.split('T')[0] || "");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen || !order) return null;

  const handleConfirm = async () => {
    setError("");
    setIsSubmitting(true);

    try {
      const updatePayload = {
        status: "On Order",
        orderedQty: Number(orderedQty),
        anticipatedDate: new Date(anticipatedDate),
        orderedDate: new Date(),
      };

      await axios.put(
        `${import.meta.env.VITE_APP_ROUTE}/materialOrders/${order._id}`,
        updatePayload
      );

      // Log the Action
      await axios.post(
        `${import.meta.env.VITE_APP_ROUTE}/logs/add`,
        {
            user: user.username,
            action: `Marked Material as Ordered: ${order.boardCode}`,
            previousData: { ...order, status: "To Order" },
            updatedData: { ...order, ...updatePayload },
        }
      );

      onSuccess();
      onClose();
    } catch (err) {
      console.error("Error marking ordered:", err);
      setError(err.response?.data?.message || "Failed to update order.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h2>Mark as Ordered</h2>
        <div className="modal-body">
            <p><strong>Material:</strong> {order.boardCode}</p>
            <p><strong>Supplier:</strong> {order.supplier}</p>
            
            <div className="form-group">
                <label>Ordered Qty:</label>
                <input 
                    type="number" 
                    value={orderedQty} 
                    onChange={(e) => setOrderedQty(e.target.value)}
                    min="0"
                />
            </div>

            <div className="form-group">
                <label>Anticipated Delivery Date:</label>
                <input 
                    type="date" 
                    value={anticipatedDate} 
                    onChange={(e) => setAnticipatedDate(e.target.value)}
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

export default MarkOrderedModal;
