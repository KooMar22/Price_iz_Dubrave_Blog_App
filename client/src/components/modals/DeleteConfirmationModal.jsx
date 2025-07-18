import PropTypes from "prop-types";
import "../../styles/DeleteConfirmationModal.css";

const DeleteConfirmationModal = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = "Izbriši",
  cancelText = "Odustani",
  isDeleting = false,
}) => {
  if (!isOpen) return null;

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget && !isDeleting) {
      onClose();
    }
  };

  return (
    <div className="modal-overlay" onClick={handleOverlayClick}>
      <div className="modal-container delete-modal">
        <div className="modal-header">
          <h2>{title}</h2>
          <button
            className="modal-close"
            onClick={onClose}
            disabled={isDeleting}
            aria-label="Zatvori"
          >
            ✕
          </button>
        </div>

        <div className="modal-body">
          <div className="delete-warning-icon">⚠️</div>
          <p className="delete-message">{message}</p>
        </div>

        <div className="modal-footer">
          <button
            className="modal-button cancel"
            onClick={onClose}
            disabled={isDeleting}
          >
            {cancelText}
          </button>
          <button
            className="modal-button delete"
            onClick={onConfirm}
            disabled={isDeleting}
          >
            {isDeleting ? (
              <span className="loading-spinner">Brisanje...</span>
            ) : (
              confirmText
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

DeleteConfirmationModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onConfirm: PropTypes.func.isRequired,
  title: PropTypes.string.isRequired,
  message: PropTypes.string.isRequired,
  confirmText: PropTypes.string,
  cancelText: PropTypes.string,
  isDeleting: PropTypes.bool,
};

export default DeleteConfirmationModal;