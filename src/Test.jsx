import React from 'react';
import '@google/model-viewer';

const GoogleWebARTest = () => {
  return (
    <div style={{
      width: '100vw',
      height: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
    }}>
      <h1 style={{ textAlign: 'center', marginBottom: '20px' }}>WebAR Test</h1>
      
      <model-viewer
        src="https://modelviewer.dev/shared-assets/models/Astronaut.glb" // Replace with your model
        alt="A 3D model for AR testing"
        ar
        ar-modes="webxr scene-viewer quick-look"
        camera-controls
        environment-image="neutral"
        shadow-intensity="1"
        style={{
          width: '90%',
          height: '70%',
          maxWidth: '600px',
          margin: '0 auto'
        }}
      >
        <button slot="ar-button" style={{
          position: 'absolute',
          bottom: '16px',
          left: '50%',
          transform: 'translateX(-50%)',
          padding: '12px 24px',
          background: 'white',
          color: 'black',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer'
        }}>
          View in AR
        </button>
      </model-viewer>

      <p style={{ marginTop: '20px', textAlign: 'center' }}>
        {navigator.xr ? 
          "Your device supports WebXR!" : 
          "AR mode may not be supported on your device"}
      </p>
    </div>
  );
};

export default GoogleWebARTest;