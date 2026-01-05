import React, { useCallback, useEffect, useRef, useState } from 'react';
import { geminiService, AnalyzedFood } from '../services/geminiService';
import { useAppStore } from '../store';
import { FoodItem } from '../types';
import { v4 as uuidv4 } from 'uuid';
import { useTranslation } from '../utils/i18n';

interface ScannerProps {
  onClose: () => void;
}

export const Scanner: React.FC<ScannerProps> = ({ onClose }) => {
  const { user, addFood } = useAppStore();
  const [image, setImage] = useState<string | null>(null);
  const [uploadId, setUploadId] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isCameraReady, setIsCameraReady] = useState(false);
  const [isScanningActive, setIsScanningActive] = useState(false);
  const [result, setResult] = useState<AnalyzedFood | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const offscreenCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const isAnalyzingRef = useRef(false);
  const resultRef = useRef<AnalyzedFood | null>(null);
  const { t, locale } = useTranslation();

  const SCAN_INTERVAL = 2000;

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
  }, []);

  useEffect(() => {
    let cancelled = false;

    const initCamera = async () => {
      if (!navigator.mediaDevices?.getUserMedia) {
        setErrorMessage(t('scanner.errors.cameraUnavailable'));
        return;
      }

      setIsCameraReady(false);

      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
        if (cancelled) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }

        streamRef.current = stream;
        const video = videoRef.current;

        if (video) {
          video.srcObject = stream;
          video.onloadedmetadata = () => {
            if (cancelled) return;
            setIsCameraReady(true);
            setIsScanningActive(true);
            setErrorMessage(null);
            const playPromise = video.play();
            if (playPromise) {
              playPromise.catch(() => {});
            }
          };

          if (video.readyState >= 2) {
            setIsCameraReady(true);
            setIsScanningActive(true);
            setErrorMessage(null);
            const playPromise = video.play();
            if (playPromise) {
              playPromise.catch(() => {});
            }
          }
        } else {
          setIsCameraReady(true);
          setIsScanningActive(true);
          setErrorMessage(null);
        }
      } catch (err) {
        console.error('Camera initialization failed', err);
        setErrorMessage(t('scanner.errors.cameraUnavailable'));
      }
    };

    initCamera();

    return () => {
      cancelled = true;
      setIsScanningActive(false);
      stopCamera();
    };
  }, [stopCamera, t]);

  useEffect(() => {
    resultRef.current = result;
  }, [result]);

  useEffect(() => {
    if (!result) {
      return;
    }

    setIsScanningActive(false);
    const video = videoRef.current;
    if (video && !video.paused) {
      video.pause();
    }
  }, [result]);

  const captureFrame = useCallback(() => {
    const video = videoRef.current;
    if (!video) return null;

    const isReady = video.readyState >= 2;
    if (!isReady) return null;

    const width = video.videoWidth;
    const height = video.videoHeight;
    if (!width || !height) return null;

    const canvas = offscreenCanvasRef.current ?? document.createElement('canvas');
    offscreenCanvasRef.current = canvas;
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;
    ctx.drawImage(video, 0, 0, width, height);
    return canvas.toDataURL('image/jpeg', 0.85);
  }, []);

  const analyze = useCallback(async (base64Full: string) => {
    // Expect a dataURL (e.g. data:image/jpeg;base64,....)
    try {
      setIsAnalyzing(true);
      isAnalyzingRef.current = true;
      const base64Data = base64Full.split(',')[1];

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

      const data = await geminiService.analyzeFoodImage(base64Data, context, locale);
      setResult(data);

      // Speak the result details in the appropriate language
      if (data.foodName) {
        const voiceMessage = locale === 'pt' 
          ? `Encontrei ${data.foodName}. ${data.calories} calorias, ${data.protein} gramas de proteína, ${data.carbs} gramas de carboidratos, e ${data.fats} gramas de gordura.`
          : `I found ${data.foodName}. ${data.calories} calories, ${data.protein} grams of protein, ${data.carbs} grams of carbs, and ${data.fats} grams of fat.`;
        
        try {
          setIsPlayingAudio(true);
          await geminiService.speakMessage(voiceMessage, locale);
        } catch (audioError) {
          console.warn('Audio playback failed:', audioError);
        } finally {
          setIsPlayingAudio(false);
        }
      }
    } catch (error) {
      console.error(error);
      setErrorMessage(t('scanner.errors.analyzeFailed'));
    } finally {
      setIsAnalyzing(false);
      isAnalyzingRef.current = false;
    }
  }, [locale, t, user?.goal, user?.somatotype]);

  useEffect(() => {
    if (!isScanningActive || !isCameraReady || resultRef.current) {
      return;
    }

    const intervalId = window.setInterval(async () => {
      if (isAnalyzingRef.current || resultRef.current) {
        return;
      }

      const frame = captureFrame();
      if (!frame) {
        return;
      }

      setImage(frame);
      await analyze(frame);
    }, SCAN_INTERVAL);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [analyze, captureFrame, isCameraReady, isScanningActive]);

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
    onClose();
  };

  const handleRetake = () => {
    setImage(null);
    setResult(null);
    setErrorMessage(null);
    setUploadId(null);
    setIsScanningActive(true);
    const video = videoRef.current;
    if (video && streamRef.current) {
      const playPromise = video.play();
      if (playPromise) {
        playPromise.catch(() => {});
      }
    }
  };

  // (Removed manual-edit inputs; keep model estimates read-only)

  // Re-analyze the current image attempting to use a higher export quality / larger size
  const reAnalyzeHighQuality = async () => {
    if (!image) return;
    setIsAnalyzing(true);
    isAnalyzingRef.current = true;
    try {
      // Create a high-quality version by converting dataURL to canvas directly
      const img = new Image();
      img.onload = async () => {
        try {
          const { width, height } = img;
          const maxDim = Math.max(width, height);
          const scale = maxDim > 1400 ? 1400 / maxDim : 1;
          const newW = Math.round(width * scale);
          const newH = Math.round(height * scale);

          const canvas = document.createElement('canvas');
          canvas.width = newW;
          canvas.height = newH;
          const ctx = canvas.getContext('2d');
          if (!ctx) throw new Error('Canvas context not available');
          ctx.drawImage(img, 0, 0, newW, newH);

          const dataUrl = canvas.toDataURL('image/jpeg', 0.95);
          await analyze(dataUrl);
        } catch (err) {
          console.error('Reanalysis processing failed', err);
          setErrorMessage(t('scanner.errors.reanalyzeFailed'));
          setIsAnalyzing(false);
          isAnalyzingRef.current = false;
        }
      };
      
      img.onerror = () => {
        setErrorMessage(t('scanner.errors.reanalyzeLoadFailed'));
        setIsAnalyzing(false);
        isAnalyzingRef.current = false;
      };
      
      img.src = image;
    } catch (err) {
      console.error('Reanalysis failed', err);
      setErrorMessage(t('scanner.errors.reanalyzeFailed'));
      setIsAnalyzing(false);
      isAnalyzingRef.current = false;
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-dark flex flex-col h-full animate-fade-in">
      {/* Header Overlay */}
      <div className="absolute top-0 left-0 right-0 p-6 flex justify-between items-center z-20 bg-gradient-to-b from-dark/80 to-transparent">
        <button onClick={onClose} className="w-10 h-10 rounded-full glass-lg flex items-center justify-center text-textLight hover:glass transition-all">
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
          {result ? (
            image ? (
              <img src={image} alt="Food" className="w-full h-full object-cover opacity-80" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-textLight/60 text-sm">
                {t('scanner.live.frameUnavailable')}
              </div>
            )
          ) : (
            <video
              ref={videoRef}
              className="w-full h-full object-cover"
              playsInline
              muted
              autoPlay
            />
          )}

          {!isCameraReady && !result && (
            <div className="absolute inset-0 bg-dark/80 flex flex-col items-center justify-center z-20 backdrop-blur-sm">
              <div className="relative w-20 h-20">
                <div className="absolute inset-0 border-4 border-glassMedium rounded-full"></div>
                <div className="absolute inset-0 border-4 border-primary rounded-full border-t-transparent animate-spin glow-cyan"></div>
              </div>
              <p className="text-textLight font-semibold text-lg mt-6">{t('scanner.processing.title')}</p>
              <p className="text-textMuted text-sm">{t('scanner.live.waitCamera')}</p>
            </div>
          )}

          {!result && isCameraReady && (
            <div className="absolute bottom-10 left-1/2 -translate-x-1/2 bg-dark/70 px-5 py-3 rounded-2xl text-center text-textLight z-10 border border-glassMedium shadow-lg">
              <div className="font-semibold uppercase tracking-wide text-xs text-primary/80">{t('scanner.live.title')}</div>
              <div className="text-sm text-textMuted mt-1">{t('scanner.live.subtitle')}</div>
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
                   <button
                     onClick={async () => {
                       setIsPlayingAudio(true);
                       const voiceMessage = locale === 'pt' 
                         ? `Encontrei ${result.foodName}. ${result.calories} calorias, ${result.protein} gramas de proteína, ${result.carbs} gramas de carboidratos, e ${result.fats} gramas de gordura.`
                         : `I found ${result.foodName}. ${result.calories} calories, ${result.protein} grams of protein, ${result.carbs} grams of carbs, and ${result.fats} grams of fat.`;
                       try {
                         await geminiService.speakMessage(voiceMessage, locale);
                       } catch (err) {
                         console.error('Audio failed:', err);
                       } finally {
                         setIsPlayingAudio(false);
                       }
                     }}
                     disabled={isPlayingAudio}
                     className="flex-shrink-0 ml-3 w-10 h-10 rounded-full glass-lg flex items-center justify-center text-primary hover:text-white hover:bg-primary/20 transition-all disabled:opacity-50"
                     title={t('scanner.actions.listen')}
                   >
                     <span className="material-icons">{isPlayingAudio ? 'volume_off' : 'volume_up'}</span>
                   </button>
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
    </div>
  );
};

const NutrientBox = ({ label, value, unit, color = 'text-white' }: { label: string, value: number, unit: string, color?: string }) => (
    <div className="bg-gray-800/50 p-3 rounded-2xl text-center border border-gray-700/50">
        <div className="text-[10px] text-gray-500 uppercase font-bold tracking-wider mb-1">{label}</div>
        <div className={`font-bold text-lg ${color}`}>{value}</div>
        <div className="text-[10px] text-gray-500 font-medium">{unit}</div>
    </div>
)
