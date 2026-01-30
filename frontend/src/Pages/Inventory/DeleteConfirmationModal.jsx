import '../../css/Inventory/DeleteConfirmationModal.scss';

const DeleteConfirmationModal = ({ isOpen, onClose, onConfirm, itemName, message }) => {
  if (!isOpen) return null;

  return (
    <div className="delete-modal-overlay">
      <div className="delete-modal">
        <h3>Confirm Delete</h3>
        <p>
            {message ? message : `Do you really want to delete ${itemName}?`}
        </p>
        <div className="delete-modal__actions">
          <button className="confirm-btn" onClick={onConfirm}>
            Yes, Delete
          </button>
          <button className="cancel-btn" onClick={onClose}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeleteConfirmationModal;
