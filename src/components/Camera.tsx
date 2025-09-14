import { useEffect, useRef, useState } from 'react';

interface CameraProps {
  onFrame: (imageData: ImageData) => void;
}

export default function Camera({ onFrame }: CameraProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [error, setError] = useState<string>('');
  const [isCameraAvailable, setIsCameraAvailable] = useState<boolean>(false);

  useEffect(() => {
    async function checkCameraAvailability() {
      try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const hasCamera = devices.some(device => device.kind === 'videoinput');
        setIsCameraAvailable(hasCamera);
        
        if (!hasCamera) {
          setError('No se detectó ninguna cámara. Por favor, conecta una cámara o usa un dispositivo móvil.');
          return;
        }

        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: 'environment',
            width: { ideal: 1280 },
            height: { ideal: 720 }
          }
        });

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (err) {
        console.error('Error accessing camera:', err);
        if ((err as Error).name === 'NotFoundError') {
          setError('No se encontró ninguna cámara disponible. Por favor, verifica que tu cámara esté conectada y no esté siendo usada por otra aplicación.');
        } else if ((err as Error).name === 'NotAllowedError') {
          setError('Necesitamos permiso para usar la cámara. Por favor, permite el acceso en la configuración de tu navegador.');
        } else {
          setError('Error al acceder a la cámara. Por favor, recarga la página o intenta en otro navegador.');
        }
      }
    }

    checkCameraAvailability();

    return () => {
      if (videoRef.current?.srcObject) {
        const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
        tracks.forEach(track => track.stop());
      }
    };
  }, []);

  useEffect(() => {
    if (!videoRef.current || !canvasRef.current || !isCameraAvailable) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');
    if (!context) return;

    let animationFrame: number;

    const processFrame = () => {
      if (video.readyState === video.HAVE_ENOUGH_DATA) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        context.drawImage(video, 0, 0);
        const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
        onFrame(imageData);
      }
      animationFrame = requestAnimationFrame(processFrame);
    };

    video.addEventListener('play', () => {
      animationFrame = requestAnimationFrame(processFrame);
    });

    return () => {
      cancelAnimationFrame(animationFrame);
    };
  }, [onFrame, isCameraAvailable]);

  if (error) {
    return (
      <div className="relative w-full max-w-2xl mx-auto p-4">
        <div className="bg-red-50 border-l-4 border-red-400 p-4 rounded">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Error de cámara</h3>
              <p className="mt-2 text-sm text-red-700">{error}</p>
              {!isCameraAvailable && (
                <p className="mt-2 text-sm text-red-700">
                  Sugerencia: Esta aplicación requiere una cámara para funcionar. 
                  Puedes acceder desde tu teléfono móvil o conectar una webcam a tu computadora.
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full max-w-2xl mx-auto">
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className="w-full aspect-video bg-gray-900 rounded-lg"
      />
      <canvas
        ref={canvasRef}
        className="hidden"
      />
    </div>
  );
} 