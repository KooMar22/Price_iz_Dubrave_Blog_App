import "../../styles/LoadingSpinner.css";

const LoadingSpinner = ({ size = "medium", message = "Učitavanje..." }) => {
  return (
    <div className={`loading-container ${size}`}>
      <div className="spinner"></div>
      <p className="loading-message">{message}</p>
    </div>
  );
};

export default LoadingSpinner;