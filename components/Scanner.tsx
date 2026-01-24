import React, { useCallback, useRef, useState } from 'react';
import { geminiService, AnalyzedFood } from '../services/geminiService';
import { useAppStore } from '../store';
import { FoodItem } from '../types';
import { v4 as uuidv4 } from 'uuid';
import { useTranslation } from '../utils/i18n';

const MAX_UPLOAD_BYTES = 4.5 * 1024 * 1024;
const DEFAULT_ANALYSIS_MAX_DIMENSION = 1280;
const HIGH_QUALITY_MAX_DIMENSION = 1600;
const FILE_UPLOAD_MAX_DIMENSION = 4096; // Permitir imagens maiores do file system
const FILE_UPLOAD_MAX_BYTES = 20 * 1024 * 1024; // Até 20MB para arquivos do sistema

type OptimizeOptions = {
  maxDimension?: number;
  maxBytes?: number;
  initialQuality?: number;
  minQuality?: number;
  qualityStep?: number;
  scaleStep?: number;
  isFileUpload?: boolean; // Flag para indicar se é upload de arquivo
};

const getDataUrlByteLength = (dataUrl: string): number => {
  const base64 = dataUrl.split(',')[1];
  return base64 ? Math.ceil((base64.length * 3) / 4) : 0;
};

const openFilePickerWithFallback = async (): Promise<File | null> => {
  try {
    // Tenta usar File System Access API (Chrome, Edge)
    if ('showOpenFilePicker' in window) {
      const [handle] = await (window as any).showOpenFilePicker({
        types: [{
          description: 'Images',
          accept: { 'image/*': ['.png', '.jpg', '.jpeg', '.webp', '.gif', '.bmp'] }
        }],
        multiple: false
      });
      return await handle.getFile();
    }
  } catch (err) {
    console.log('File System Access API not available or user cancelled');
  }

  // Fallback: usar input file tradicional
  return new Promise((resolve) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = (e: any) => {
      const file = e.target.files?.[0];
      resolve(file || null);
    };
    input.click();
  });
};

const fileToDataUrl = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

const loadImageElement = (dataUrl: string): Promise<HTMLImageElement> => {
  return new Promise((resolve, reject) => {
    if (typeof Image === 'undefined') {
      reject(new Error('Image constructor unavailable'));
      return;
    }

    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Image load failed'));
    img.src = dataUrl;
  });
};

const drawOptimizedDataUrl = (
  img: HTMLImageElement,
  canvas: HTMLCanvasElement,
  ctx: CanvasRenderingContext2D,
  scale: number,
  quality: number
): string => {
  const width = Math.max(1, Math.round(img.width * scale));
  const height = Math.max(1, Math.round(img.height * scale));
  canvas.width = width;
  canvas.height = height;
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.clearRect(0, 0, width, height);
  ctx.drawImage(img, 0, 0, width, height);
  return canvas.toDataURL('image/jpeg', quality);
};

// Keeps uploaded frames within the Gemini upload size constraints.
const optimizeImageDataUrl = async (dataUrl: string, options?: OptimizeOptions): Promise<string> => {
  if (typeof document === 'undefined') {
    return dataUrl;
  }

  const {
    maxDimension = DEFAULT_ANALYSIS_MAX_DIMENSION,
    maxBytes = MAX_UPLOAD_BYTES,
    initialQuality = 0.92,
    minQuality = 0.6,
    qualityStep = 0.08,
    scaleStep = 0.85,
    isFileUpload = false
  } = options ?? {};

  try {
    const img = await loadImageElement(dataUrl);
    const effectiveMaxDimension = isFileUpload ? FILE_UPLOAD_MAX_DIMENSION : maxDimension;
    const effectiveMaxBytes = isFileUpload ? FILE_UPLOAD_MAX_BYTES : maxBytes;
    const needsResize = Math.max(img.width, img.height) > effectiveMaxDimension;
    const originalBytes = getDataUrlByteLength(dataUrl);
    const needsByteReduction = originalBytes > effectiveMaxBytes;

    if (!needsResize && !needsByteReduction) {
      return dataUrl;
    }

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      return dataUrl;
    }

    let scale = needsResize ? Math.min(1, effectiveMaxDimension / Math.max(img.width, img.height)) : 1;
    let quality = Math.min(1, Math.max(0.1, initialQuality));
    let optimized = drawOptimizedDataUrl(img, canvas, ctx, scale, quality);
    let optimizedBytes = getDataUrlByteLength(optimized);
    let attempts = 0;

    while (optimizedBytes > effectiveMaxBytes && attempts < 15) {
      attempts += 1;
      if (quality - qualityStep >= minQuality) {
        quality = Math.max(minQuality, quality - qualityStep);
      } else if (scale * scaleStep >= 0.2) {
        scale = scale * scaleStep;
      } else {
        break;
      }

      optimized = drawOptimizedDataUrl(img, canvas, ctx, scale, quality);
      optimizedBytes = getDataUrlByteLength(optimized);
    }

    if (optimizedBytes > effectiveMaxBytes) {
      console.warn('Image optimization could not reach target size limit.');
    }

    return optimized;
  } catch (error) {
    console.warn('Image optimization failed, using original data URL.', error);
    return dataUrl;
  }
};

interface ScannerProps {
  onClose: () => void;
}

export const Scanner: React.FC<ScannerProps> = ({ onClose }) => {
  const { user, addFood } = useAppStore();
  const [image, setImage] = useState<string | null>(null);
  const [uploadId, setUploadId] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<AnalyzedFood | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const isAnalyzingRef = useRef(false);
  const originalImageRef = useRef<string | null>(null);
  const { t, locale } = useTranslation();

  // Camera refs
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const streamRef = useRef<MediaStream | null>(null);

  const analyze = useCallback(async (base64Full: string) => {
    // Expect a dataURL (e.g. data:image/jpeg;base64,....)
    try {
      setIsAnalyzing(true);
      isAnalyzingRef.current = true;
      let base64Data = base64Full.split(',')[1];

      // First, upload image to temporary server so we have an id and persistent URL
      let uploadedId: string | null = null;
      try {
        const resp = await fetch(('http://localhost:5050') + '/api/upload', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ imageBase64: base64Full, filename: 'scan.jpg', metadata: { source: 'scanner' } })
        });
        if (resp.ok) {
          const json = await resp.json();
          uploadedId = json.id;
          setUploadId(uploadedId);
        } else {
          console.warn('Upload server responded with', resp.status);
        }
      } catch (e) {
        console.warn('Upload failed, continuing without server storage', e);
      }

      const context = `${user?.somatotype} with goal to ${user?.goal}${uploadedId ? `; uploadId:${uploadedId}` : ''}`;

      let analysisAttempt = 0;
      let lastError: Error | null = null;

      // Tentar análise até 3 vezes com diferentes estratégias
      while (analysisAttempt < 3) {
        try {
          const data = await geminiService.analyzeFoodImage(base64Data, context, locale);
          setResult(data);

          // Speak the result details in the appropriate language
          if (data.foodName) {
            const voiceMessage = geminiService.generateFoodVoiceMessage(
              data.foodName,
              data.calories,
              data.protein,
              data.carbs,
              data.fats,
              locale
            );
            
            try {
              setIsPlayingAudio(true);
              await geminiService.speakMessage(voiceMessage, locale);
            } catch (audioError) {
              console.warn('Audio playback failed:', audioError);
            } finally {
              setIsPlayingAudio(false);
            }
          }
          return; // Sucesso, sair do loop
        } catch (error) {
          lastError = error as Error;
          console.warn(`Analysis attempt ${analysisAttempt + 1} failed:`, error);
          analysisAttempt++;
          
          // Se falhar, tentar com diferentes estratégias
          if (analysisAttempt < 3) {
            if (analysisAttempt === 1) {
              // Segunda tentativa: compressão moderada
              console.log('Retrying with moderate compression...');
              const recompressedFrame = await optimizeImageDataUrl(base64Full, {
                maxDimension: 1024,
                maxBytes: 2 * 1024 * 1024, // 2MB
                initialQuality: 0.85,
                minQuality: 0.55,
                qualityStep: 0.10,
                scaleStep: 0.88
              });
              base64Full = recompressedFrame;
              base64Data = base64Full.split(',')[1];
            } else if (analysisAttempt === 2) {
              // Terceira tentativa: compressão agressiva
              console.log('Retrying with aggressive compression...');
              const aggressiveFrame = await optimizeImageDataUrl(base64Full, {
                maxDimension: 768,
                maxBytes: 1024 * 1024, // 1MB
                initialQuality: 0.75,
                minQuality: 0.40,
                qualityStep: 0.15,
                scaleStep: 0.80
              });
              base64Full = aggressiveFrame;
              base64Data = base64Full.split(',')[1];
            }
          }
        }
      }

      // Se chegou aqui, todas as tentativas falharam
      if (lastError) {
        throw lastError;
      }
    } catch (error) {
      console.error('Analysis error:', error);
      
      // Provide specific error messages
      if (error instanceof Error) {
        const errorMsg = error.message.toLowerCase();
        if (errorMsg.includes("does not contain identifiable food") || 
            errorMsg.includes("does not contain food") ||
            errorMsg.includes("not_food")) {
          setErrorMessage(t('scanner.errors.notFood'));
        } else if (errorMsg.includes("invalid json") || errorMsg.includes("failed to parse")) {
          setErrorMessage(t('scanner.errors.analyzeFailed'));
        } else if (errorMsg.includes("no response") || errorMsg.includes("timeout")) {
          setErrorMessage(t('scanner.errors.analyzeTimeout'));
        } else {
          // Log full error for debugging
          console.error('Full error details:', error.message);
          setErrorMessage(t('scanner.errors.analyzeFailed'));
        }
      } else {
        setErrorMessage(t('scanner.errors.analyzeFailed'));
      }
    } finally {
      setIsAnalyzing(false);
      isAnalyzingRef.current = false;
    }
  }, [locale, t, user?.goal, user?.somatotype]);

  const handleImportFile = useCallback(async () => {
    if (isAnalyzingRef.current) return;

    try {
      const file = await openFilePickerWithFallback();
      if (!file) return;

      // Verificar tamanho do arquivo
      if (file.size > FILE_UPLOAD_MAX_BYTES) {
        setErrorMessage(t('scanner.errors.fileTooLarge', { maxSize: '20MB' }));
        return;
      }

      const dataUrl = await fileToDataUrl(file);
      originalImageRef.current = dataUrl;

      // Para arquivos importados, usar otimização mais permissiva
      const optimizedFrame = await optimizeImageDataUrl(dataUrl, {
        maxDimension: FILE_UPLOAD_MAX_DIMENSION,
        maxBytes: FILE_UPLOAD_MAX_BYTES,
        initialQuality: 0.80,
        minQuality: 0.35,
        qualityStep: 0.12,
        scaleStep: 0.75,
        isFileUpload: true
      });

      setImage(optimizedFrame);
      await analyze(optimizedFrame);
    } catch (error) {
      console.error('File import failed:', error);
      setErrorMessage(t('scanner.errors.fileImportFailed'));
    }
  }, [analyze, t]);

  // Initialize camera
  const initializeCamera = useCallback(async () => {
    try {
      const constraints = {
        video: {
          facingMode: 'environment',
          width: { ideal: 1280 },
          height: { ideal: 720 }
        },
        audio: false
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
        setIsCameraActive(true);
      }
    } catch (error) {
      console.error('Camera access denied:', error);
      if (error instanceof Error) {
        if (error.name === 'NotAllowedError') {
          setErrorMessage(t('scanner.errors.cameraPermissionDenied'));
        } else if (error.name === 'NotFoundError') {
          setErrorMessage(t('scanner.errors.cameraNotFound'));
        } else {
          setErrorMessage(t('scanner.errors.cameraAccessDenied'));
        }
      }
    }
  }, [t]);

  // Stop camera
  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setIsCameraActive(false);
  }, []);

  // Capture frame from camera
  const captureFrame = useCallback(async () => {
    if (!videoRef.current || !canvasRef.current) return;

    const ctx = canvasRef.current.getContext('2d');
    if (!ctx) return;

    try {
      // Set canvas dimensions to match video
      canvasRef.current.width = videoRef.current.videoWidth;
      canvasRef.current.height = videoRef.current.videoHeight;

      // Draw current video frame to canvas with better rendering
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(videoRef.current, 0, 0);

      // Get data URL with high quality (0.95 instead of 0.9)
      let dataUrl = canvasRef.current.toDataURL('image/jpeg', 0.95);
      originalImageRef.current = dataUrl;

      // For camera capture, use more conservative optimization
      // Don't compress too aggressively - better to keep quality
      const optimizedFrame = await optimizeImageDataUrl(dataUrl, {
        maxDimension: 1024, // Reduce dimension but keep good quality
        maxBytes: MAX_UPLOAD_BYTES,
        initialQuality: 0.90, // Start higher
        minQuality: 0.70, // Don't go too low
        qualityStep: 0.05, // Smaller steps
        scaleStep: 0.90, // Smaller scale reductions
        isFileUpload: false
      });

      setImage(optimizedFrame);
      stopCamera();
      await analyze(optimizedFrame);
    } catch (error) {
      console.error('Capture failed:', error);
      setErrorMessage(t('scanner.errors.captureFailed'));
    }
  }, [analyze, stopCamera, t]);

  // Initialize camera on mount
  React.useEffect(() => {
    initializeCamera();
    return () => {
      stopCamera();
    };
  }, [initializeCamera, stopCamera]);

  // Handle component close with cleanup
  const handleClose = useCallback(() => {
    stopCamera();
    setImage(null);
    setResult(null);
    setErrorMessage(null);
    setUploadId(null);
    originalImageRef.current = null;
    isAnalyzingRef.current = false;
    onClose();
  }, [stopCamera, onClose]);

  const handleConfirm = () => {
    if (!result) return;

    const newFood: FoodItem = {
      id: uuidv4(),
      name: result.foodName,
      calories: result.calories,
      protein: result.protein,
      carbs: result.carbs,
      fats: result.fats,
      weight: result.weightEstimate,
      timestamp: Date.now(),
      imageUrl: image || undefined
    };

    addFood(newFood);
    
    // Reset all internal state before closing
    setImage(null);
    setResult(null);
    setErrorMessage(null);
    setUploadId(null);
    originalImageRef.current = null;
    isAnalyzingRef.current = false;
    
    onClose();
  };

  const handleRetake = () => {
    setImage(null);
    setResult(null);
    setErrorMessage(null);
    originalImageRef.current = null;
    setUploadId(null);
  };

  // (Removed manual-edit inputs; keep model estimates read-only)

  // Re-analyze the current image attempting to use a higher export quality / larger size
  const reAnalyzeHighQuality = async () => {
    const sourceImage = originalImageRef.current ?? image;
    if (!sourceImage) return;

    setIsAnalyzing(true);
    isAnalyzingRef.current = true;
    try {
      const highQualityFrame = await optimizeImageDataUrl(sourceImage, {
        maxDimension: HIGH_QUALITY_MAX_DIMENSION,
        maxBytes: MAX_UPLOAD_BYTES,
        initialQuality: 0.80,
        minQuality: 0.35,
        qualityStep: 0.12,
        scaleStep: 0.75
      });

      setImage(highQualityFrame);
      await analyze(highQualityFrame);
    } catch (err) {
      console.error('Reanalysis failed', err);
      setErrorMessage(t('scanner.errors.reanalyzeFailed'));
    } finally {
      setIsAnalyzing(false);
      isAnalyzingRef.current = false;
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-dark flex flex-col h-full animate-fade-in">
      {/* Header Overlay */}
      <div className="absolute top-0 left-0 right-0 p-6 flex justify-between items-center z-20 bg-gradient-to-b from-dark/80 to-transparent">
        <button onClick={handleClose} className="w-10 h-10 rounded-full glass-lg flex items-center justify-center text-textLight hover:glass transition-all">
            <span className="material-icons">close</span>
        </button>
        <h2 className="text-textLight font-semibold tracking-wide uppercase text-sm opacity-80">{t('scanner.headerTitle')}</h2>
        <div className="w-10"></div>
      </div>

      {/* Error banner */}
      {errorMessage && (
        <div className="absolute top-20 left-1/2 transform -translate-x-1/2 z-30 px-4 py-2 bg-red-600/80 text-white rounded-lg shadow-lg glow-indigo flex items-center gap-3">
          <div className="text-sm">{errorMessage}</div>
          <button onClick={() => setErrorMessage(null)} className="ml-2 text-white/80 hover:text-white">{t('common.close')}</button>
        </div>
      )}

      <div className="flex-1 relative flex flex-col">
        <div className="relative flex-1 bg-black">
          {/* Video stream - always visible when not showing result or image */}
          {!result && !image && (
            <video
              ref={videoRef}
              className="w-full h-full object-cover"
              playsInline
              autoPlay
              muted
            />
          )}

          {/* Captured image or result image */}
          {result ? (
            image ? (
              <img src={image} alt="Food" className="w-full h-full object-cover opacity-80" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-textLight/60 text-sm">
                {t('scanner.live.frameUnavailable')}
              </div>
            )
          ) : image ? (
            <img src={image} alt="Food" className="w-full h-full object-cover opacity-80" />
          ) : null}

          {/* Capture button - visible when camera is active and no result */}
          {!result && isCameraActive && !image && (
            <div className="absolute bottom-6 left-0 right-0 px-6 flex flex-col items-center gap-4 z-30 pointer-events-none">
              <div className="flex flex-col items-center gap-2 pointer-events-auto">
                <button
                  type="button"
                  onClick={captureFrame}
                  disabled={isAnalyzing}
                  aria-label={t('scanner.actions.capture')}
                  className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 text-white flex items-center justify-center shadow-xl shadow-blue-500/40 border border-white/20 transition-transform hover:scale-105 disabled:opacity-60 disabled:hover:scale-100"
                >
                  <span className="material-icons text-3xl">camera</span>
                </button>
                <span className="text-xs uppercase tracking-wide text-textLight">{t('scanner.actions.capture')}</span>
              </div>
            </div>
          )}

          {/* Import file option - shown when image is captured but before analysis */}
          {!result && image && !isAnalyzing && (
            <div className="absolute top-20 right-6 z-30">
              <button
                type="button"
                onClick={handleImportFile}
                disabled={isAnalyzing}
                aria-label={t('scanner.actions.import')}
                className="px-4 py-2 rounded-full bg-gray-700/80 text-textLight text-sm font-medium hover:bg-gray-600 transition-colors flex items-center gap-2"
              >
                <span className="material-icons text-lg">image_search</span>
                {t('scanner.actions.import')}
              </button>
            </div>
          )}

          {isAnalyzing && (
            <div className="absolute inset-0 bg-dark/80 flex flex-col items-center justify-center z-30 backdrop-blur-sm">
              <div className="relative w-24 h-24">
                <div className="absolute inset-0 border-4 border-glassMedium rounded-full"></div>
                <div className="absolute inset-0 border-4 border-primary rounded-full border-t-transparent animate-spin glow-cyan"></div>
              </div>
              <p className="text-textLight font-bold text-lg mt-6 animate-pulse">{t('scanner.analyzing.title')}</p>
              <p className="text-textMuted text-sm">{t('scanner.analyzing.description')}</p>
            </div>
          )}

          {/* Result Sheet */}
          {result && (
            <div className="absolute bottom-0 left-0 right-0 glass-lg rounded-t-3xl p-4 md:p-6 shadow-2xl animate-slide-up z-20 max-h-[85vh] md:max-h-[80vh] overflow-y-auto">
                 <div className="w-12 h-1 bg-glassMedium rounded-full mx-auto mb-4 md:mb-6"></div>

                 <div className="flex items-start justify-between mb-4">
                   <div className="flex-1">
                     <h3 className="text-2xl font-bold text-primary mb-2 leading-tight text-glow">{result.foodName}</h3>
                     <p className="text-white text-sm mb-4 leading-relaxed border-l-2 border-primary pl-3">{result.reasoning}</p>
                   </div>
                   
                 </div>

                 <div className="flex items-center justify-between mb-4">
                    <div className="text-sm text-primary">{t('scanner.confidence')}</div>
                    <div className="flex items-center gap-3">
                      <div className="font-bold text-textLight">{typeof result.confidence === 'number' ? `${Math.round(result.confidence)}%` : '—'}</div>
                      <div className="w-40 h-2 bg-glassDark rounded-full overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-primary to-secondary" style={{ width: `${Math.min(100, result.confidence ?? 0)}%` }} />
                      </div>
                    </div>
                 </div>

                 {typeof result.confidence === 'number' && result.confidence < 75 && (
                   <div className="mb-4 p-3 rounded-lg bg-yellow-900/10 border border-yellow-700/20">
                    <div className="font-bold text-yellow-300">{t('scanner.lowConfidenceTitle')}</div>
                    <div className="text-sm text-textMuted">{t('scanner.lowConfidenceMessage')}</div>
                   </div>
                 )}

                 <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6 md:mb-8">
                    <NutrientBox label={t('scanner.nutrients.calories')} value={result.calories} unit="kcal" />
                    <NutrientBox label={t('scanner.nutrients.protein')} value={result.protein} unit="g" color="text-emerald-400" />
                    <NutrientBox label={t('scanner.nutrients.carbs')} value={result.carbs} unit="g" color="text-blue-400" />
                    <NutrientBox label={t('scanner.nutrients.fats')} value={result.fats} unit="g" color="text-amber-400" />
                 </div>

                 <div className="flex flex-col md:flex-row gap-3">
                   <button 
                    onClick={handleRetake}
                    className="w-full md:flex-1 py-3 rounded-2xl font-bold text-gray-300 bg-gray-800 hover:bg-gray-700 transition-colors"
                   >
                     {t('scanner.actions.retake')}
                   </button>
                   <button 
                    onClick={reAnalyzeHighQuality}
                    disabled={isAnalyzing}
                    className="w-full md:w-auto md:px-6 py-3 rounded-2xl font-bold text-white bg-gradient-to-r from-gray-700 to-gray-600 hover:opacity-90 transition-colors"
                   >
                     {t('scanner.actions.reanalyze')}
                   </button>
                   <button 
                    onClick={handleConfirm}
                    className="w-full md:flex-1 py-3 rounded-2xl font-bold text-black bg-primary hover:bg-emerald-400 transition-colors shadow-lg shadow-emerald-900/30"
                   >
                     {t('scanner.actions.add')}
                   </button>
                 </div>
               </div>
          )}
        </div>
      </div>

      {/* Hidden canvas for frame capture */}
      <canvas ref={canvasRef} style={{ display: 'none' }} />
    </div>
  );
};

const NutrientBox = ({ label, value, unit, color = 'text-white' }: { label: string, value: number, unit: string, color?: string }) => (
    <div className="bg-gray-800/50 p-3 rounded-2xl text-center border border-gray-700/50">
        <div className="text-[10px] text-white-500 uppercase font-bold tracking-wider mb-1">{label}</div>
        <div className={`font-bold text-lg ${color}`}>{value}</div>
        <div className="text-[10px] text-gray-500 font-medium">{unit}</div>
    </div>
)
