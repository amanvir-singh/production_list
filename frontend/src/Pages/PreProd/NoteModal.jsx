/* eslint-disable react/prop-types */
import "react";
import "../../css/PreProd/NoteModal.scss";

const NoteModal = ({ isOpen, onClose, onConfirm, note, setNote }) => {
  if (!isOpen) return null;

  return (
    <div className="note-modal">
      <div className="note-modal-content">
        <h2>Enter Note for Partial Completion</h2>
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Enter your note here..."
        />
        <div className="modal-actions">
          <button onClick={onClose}>Cancel</button>
          <button onClick={onConfirm}>Confirm</button>
        </div>
      </div>
    </div>
  );
};

export default NoteModal;
