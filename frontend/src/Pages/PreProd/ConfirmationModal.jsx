/* eslint-disable react/prop-types */
import "react";
import "../../css/PreProd/ConfirmationModal.scss";

const ConfirmationModal = ({ isOpen, onClose, onConfirm, item }) => {
  if (!isOpen || !item) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h2>Confirm Completion</h2>
        <p>Are you sure you want to mark the following item as complete?</p>
        <div className="item-details">
          <p>
            <strong>Material:</strong> {item.material.material}
          </p>
          <p>
            <strong>Cutlist Name:</strong> {item.cutlist.name}
          </p>
          <p>
            <strong>Quantity:</strong> {item.cutlist.quantity}
          </p>
        </div>
        <p>
          The Stock Status will be changed to:{" "}
          <strong>{item.completedStatus}</strong>
        </p>
        <div className="modal-actions">
          <button onClick={onClose}>Cancel</button>
          <button onClick={onConfirm}>Confirm</button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmationModal;
