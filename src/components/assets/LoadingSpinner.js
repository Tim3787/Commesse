import React from "react";
import Lottie from "lottie-react";
import loadingAnimation from "./path-to-animation.json"; // Inserisci qui il percorso corretto del file JSON

const LoadingSpinner = () => {
  return (
    <div className="loading-container">
      <Lottie animationData={loadingAnimation} loop={true} style={{ height: 150, width: 150 }} />
      <p>Caricamento in corso...</p>
    </div>
  );
};

export default LoadingSpinner;
