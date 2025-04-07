/* eslint-disable react/prop-types */
import "react";
import "../../css/ProductionList/ConfirmationModal.scss";

const ConfirmationModal = ({ isOpen, onClose, onConfirm, message }) => {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h2>Confirmation</h2>
        <p>{message}</p>
        <div className="modal-actions">
          <button className="cancel" onClick={onClose}>
            Cancel
          </button>
          <button className="confirm" onClick={onConfirm}>
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmationModal;
