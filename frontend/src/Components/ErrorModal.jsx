/* eslint-disable react/prop-types */
import "../css/ErrorModal.scss";

const ErrorModal = ({ message, onClose }) => {
  if (!message) return null;

  return (
    <div className="modal-overlay">
      <div className="modal">
        <div className="modal-content">
          <p>{message}</p>
          <button onClick={onClose} className="close-btn">
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default ErrorModal;
