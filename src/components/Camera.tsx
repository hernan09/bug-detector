import { useEffect, useRef, useState } from 'react';

interface CameraProps {
  onFrame: (imageData: ImageData) => void;
}

export default function Camera({ onFrame }: CameraProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [error, setError] = useState<string>('');
  const [isCameraAvailable, setIsCameraAvailable] = useState<boolean>(false);
  const [permissionStatus, setPermissionStatus] = useState<'prompt' | 'granted' | 'denied'>('prompt');

  const stopCurrentStream = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
  };

  const requestCameraPermission = async () => {
    try {
      // Detener cualquier stream existente
      stopCurrentStream();

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: 'environment' },
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      });

      streamRef.current = stream;
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setPermissionStatus('granted');
        setError('');
        
        // Guardar el estado del permiso
        try {
          localStorage.setItem('cameraPermission', 'granted');
        } catch (e) {
          console.warn('No se pudo guardar el estado del permiso:', e);
        }
      }
    } catch (err) {
      console.error('Error accessing camera:', err);
      if ((err as Error).name === 'NotAllowedError') {
        setPermissionStatus('denied');
        setError('Acceso a la cámara denegado. Por favor, permite el acceso en la configuración de tu dispositivo.');
        try {
          localStorage.setItem('cameraPermission', 'denied');
        } catch (e) {
          console.warn('No se pudo guardar el estado del permiso:', e);
        }
      } else {
        setError('Error al acceder a la cámara. Por favor, recarga la página o verifica los permisos del sistema.');
      }
    }
  };

  useEffect(() => {
    async function checkCameraAvailability() {
      try {
        // Intentar recuperar el estado guardado del permiso
        const savedPermission = localStorage.getItem('cameraPermission');
        if (savedPermission === 'granted') {
          await requestCameraPermission();
          return;
        }

        const devices = await navigator.mediaDevices.enumerateDevices();
        const hasCamera = devices.some(device => device.kind === 'videoinput');
        setIsCameraAvailable(hasCamera);
        
        if (!hasCamera) {
          setError('No se detectó ninguna cámara. Por favor, verifica que tu dispositivo tenga una cámara disponible.');
          return;
        }

        // Verificar el estado actual del permiso
        if ('permissions' in navigator) {
          const permission = await navigator.permissions.query({ name: 'camera' as PermissionName });
          setPermissionStatus(permission.state as 'prompt' | 'granted' | 'denied');
          
          // Escuchar cambios en el permiso
          permission.addEventListener('change', () => {
            setPermissionStatus(permission.state as 'prompt' | 'granted' | 'denied');
            if (permission.state === 'granted') {
              requestCameraPermission();
            }
          });

          if (permission.state === 'granted') {
            requestCameraPermission();
          }
        }
      } catch (err) {
        console.error('Error checking camera:', err);
        setError('Error al verificar la cámara. Por favor, asegúrate de que tu navegador tenga acceso a la cámara.');
      }
    }

    checkCameraAvailability();

    return () => {
      stopCurrentStream();
    };
  }, []);

  useEffect(() => {
    if (!videoRef.current || !canvasRef.current || !isCameraAvailable || permissionStatus !== 'granted') return;

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
  }, [onFrame, isCameraAvailable, permissionStatus]);

  if (!isCameraAvailable) {
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
              <h3 className="text-sm font-medium text-red-800">No hay cámara disponible</h3>
              <p className="mt-2 text-sm text-red-700">
                Esta aplicación requiere una cámara para funcionar. 
                Por favor, verifica que tu dispositivo tenga una cámara disponible.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (permissionStatus === 'prompt') {
    return (
      <div className="relative w-full max-w-2xl mx-auto p-4">
        <div className="bg-blue-50 border-l-4 border-blue-400 p-4 rounded">
          <div className="flex flex-col items-center text-center">
            <svg className="h-12 w-12 text-blue-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <h3 className="text-lg font-medium text-blue-800 mb-2">Permiso de cámara necesario</h3>
            <p className="text-sm text-blue-700 mb-4">
              Para detectar insectos, necesitamos acceder a tu cámara.
              Tus datos son procesados localmente y no se almacenan.
            </p>
            <button
              onClick={requestCameraPermission}
              className="bg-blue-500 hover:bg-blue-600 text-white font-medium py-2 px-4 rounded-lg transition-colors"
            >
              Permitir acceso a la cámara
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (permissionStatus === 'denied') {
    return (
      <div className="relative w-full max-w-2xl mx-auto p-4">
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded">
          <div className="flex flex-col items-center text-center">
            <svg className="h-12 w-12 text-yellow-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <h3 className="text-lg font-medium text-yellow-800 mb-2">Acceso a la cámara bloqueado</h3>
            <p className="text-sm text-yellow-700 mb-4">
              Para usar la cámara en este dispositivo:
              <br />
              1. Ve a Configuración &gt; Aplicaciones &gt; Permisos
              <br />
              2. Busca esta aplicación y permite el acceso a la cámara
              <br />
              3. Vuelve aquí y presiona el botón de recargar
            </p>
            <button
              onClick={() => {
                stopCurrentStream();
                window.location.reload();
              }}
              className="bg-yellow-500 hover:bg-yellow-600 text-white font-medium py-2 px-4 rounded-lg transition-colors"
            >
              Recargar aplicación
            </button>
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
      {error && (
        <div className="absolute top-0 left-0 right-0 bg-red-500 text-white p-2 text-center rounded-t-lg">
          {error}
        </div>
      )}
    </div>
  );
} 