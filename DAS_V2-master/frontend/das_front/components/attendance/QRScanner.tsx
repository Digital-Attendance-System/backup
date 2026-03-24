'use client';

import { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';

interface QRScannerProps {
  onScanSuccess: (decodedText: string) => void;
  onScanError?: (error: string) => void;
}

export function QRScanner({ onScanSuccess, onScanError }: QRScannerProps) {
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const qrCodeRegionId = 'qr-reader';

  useEffect(() => {
    return () => {
      // Cleanup on unmount
      if (scannerRef.current && isScanning) {
        scannerRef.current.stop().catch(console.error);
      }
    };
  }, [isScanning]);

  const startScanning = async () => {
    try {
      setError(null);
      
      // Create scanner instance
      const html5QrCode = new Html5Qrcode(qrCodeRegionId);
      scannerRef.current = html5QrCode;

      // Start scanning
      await html5QrCode.start(
        { facingMode: 'environment' }, // Use back camera
        {
          fps: 10, // Frames per second
          qrbox: { width: 250, height: 250 }, // Scanning box size
        },
        (decodedText) => {
          // Success callback
          onScanSuccess(decodedText);
          
          // Optional: play sound
          playBeep();
        },
        (errorMessage) => {
          // Error callback (fires frequently, ignore)
          // console.log(errorMessage);
        }
      );

      setIsScanning(true);
    } catch (err: any) {
      console.error('Failed to start scanner:', err);
      setError(err.message || 'Failed to start camera');
      if (onScanError) {
        onScanError(err.message);
      }
    }
  };

  const stopScanning = async () => {
    if (scannerRef.current && isScanning) {
      try {
        await scannerRef.current.stop();
        scannerRef.current.clear();
        setIsScanning(false);
      } catch (err) {
        console.error('Failed to stop scanner:', err);
      }
    }
  };

  const playBeep = () => {
    // Simple beep sound using Web Audio API
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    oscillator.frequency.value = 800;
    oscillator.type = 'sine';

    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);

    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.1);
  };

  return (
    <div className="space-y-4">
      {/* Camera Preview */}
      <div className="relative">
        <div id={qrCodeRegionId} className="rounded-lg overflow-hidden border-4 border-blue-500"></div>
        
        {!isScanning && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-900 bg-opacity-50 rounded-lg">
            <div className="text-center text-white p-6">
              <svg className="w-16 h-16 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <p className="text-lg font-medium">Camera Ready</p>
              <p className="text-sm text-gray-300 mt-2">Click start to begin scanning</p>
            </div>
          </div>
        )}
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-start">
            <svg className="w-5 h-5 text-red-600 mt-0.5 mr-3" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            <div>
              <h3 className="text-sm font-medium text-red-800">Camera Error</h3>
              <p className="text-sm text-red-700 mt-1">{error}</p>
              <p className="text-xs text-red-600 mt-2">Please allow camera permissions and try again.</p>
            </div>
          </div>
        </div>
      )}

      {/* Controls */}
      <div className="flex space-x-3">
        {!isScanning ? (
          <button
            onClick={startScanning}
            className="flex-1 bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors"
          >
            Start Scanning
          </button>
        ) : (
          <button
            onClick={stopScanning}
            className="flex-1 bg-red-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-red-700 transition-colors"
          >
            Stop Scanning
          </button>
        )}
      </div>

      {/* Instructions */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="text-sm font-medium text-blue-900 mb-2">📱 Scanning Instructions:</h3>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• Hold student ID card steady in camera view</li>
          <li>• Ensure good lighting on the QR code</li>
          <li>• Keep camera 6-12 inches from QR code</li>
          <li>• Scanner will beep when successful</li>
        </ul>
      </div>
    </div>
  );
}