'use client';

import { useEffect, useState, useCallback } from 'react';
import * as tf from '@tensorflow/tfjs';
import * as mobilenet from '@tensorflow-models/mobilenet';
import Camera from '@/components/Camera';

interface Prediction {
  className: string;
  probability: number;
}

export default function Home() {
  const [model, setModel] = useState<mobilenet.MobileNet | null>(null);
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    async function loadModel() {
      try {
        await tf.ready();
        const loadedModel = await mobilenet.load();
        setModel(loadedModel);
        setIsLoading(false);
      } catch (err) {
        console.error('Error loading model:', err);
        setError('Error al cargar el modelo de IA. Por favor, recarga la página.');
        setIsLoading(false);
      }
    }

    loadModel();
  }, []);

  const processFrame = useCallback(async (imageData: ImageData) => {
    if (!model) return;

    try {
      // Convertir ImageData a tensor
      const tensor = tf.browser.fromPixels(imageData);
      
      // Realizar predicción
      const predictions = await model.classify(tensor);
      
      // Limpiar tensor para evitar memory leaks
      tensor.dispose();

      // Actualizar predicciones
      setPredictions(predictions);
    } catch (err) {
      console.error('Error processing frame:', err);
    }
  }, [model]);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center p-8 bg-white rounded-lg shadow-xl">
          <h2 className="text-2xl font-bold text-red-600 mb-4">Error</h2>
          <p className="text-gray-700">{error}</p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center p-8">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-xl text-gray-700">Cargando modelo de IA...</p>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-gray-100 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-8 text-gray-800">
          Detector de Insectos
        </h1>
        
        <div className="bg-white rounded-lg shadow-xl overflow-hidden">
          <Camera onFrame={processFrame} />
          
          <div className="p-4">
            <h2 className="text-xl font-semibold mb-4 text-gray-700">
              Predicciones
            </h2>
            
            {predictions.length > 0 ? (
              <ul className="space-y-2">
                {predictions.map((prediction, index) => (
                  <li
                    key={index}
                    className="flex justify-between items-center p-3 bg-gray-50 rounded"
                  >
                    <span className="text-gray-800">
                      {prediction.className}
                    </span>
                    <span className="text-gray-600 font-mono">
                      {(prediction.probability * 100).toFixed(1)}%
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-gray-500 text-center py-4">
                Apunta la cámara hacia un insecto para comenzar...
              </p>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
