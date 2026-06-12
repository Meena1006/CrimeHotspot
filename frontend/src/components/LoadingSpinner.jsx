const LoadingSpinner = ({ size = 'medium' }) => {
  return (
    <div className={`spinner spinner-${size}`}>
      <div className="spinner-ring"></div>
      <div className="spinner-ring"></div>
      <div className="spinner-ring"></div>
    </div>
  );
};

export default LoadingSpinner;
