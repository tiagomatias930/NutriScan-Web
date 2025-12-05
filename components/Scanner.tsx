import React, { useState, useRef } from 'react';
import { geminiService, AnalyzedFood } from '../services/geminiService';
import { useAppStore } from '../store';
import { FoodItem } from '../types';
import { v4 as uuidv4 } from 'uuid';
import ImageSourcePicker from './ImageSourcePicker';

interface ScannerProps {
  onClose: () => void;
}

export const Scanner: React.FC<ScannerProps> = ({ onClose }) => {
  const { user, addFood } = useAppStore();
  const [image, setImage] = useState<string | null>(null);
  const [uploadId, setUploadId] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isProcessingImage, setIsProcessingImage] = useState(false);
  const [result, setResult] = useState<AnalyzedFood | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const [showSourcePicker, setShowSourcePicker] = useState(false);

  // Resize/compress image in browser to avoid high memory usage and very large uploads
  const resizeImageFile = async (file: File, maxSize = 800, outputType = 'image/jpeg', quality = 0.75) => {
    return new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          try {
            const { width, height } = img;
            const maxDim = Math.max(width, height);
            const scale = maxDim > maxSize ? maxSize / maxDim : 1;
            const newW = Math.round(width * scale);
            const newH = Math.round(height * scale);

            const canvas = document.createElement('canvas');
            canvas.width = newW;
            canvas.height = newH;
            const ctx = canvas.getContext('2d');
            if (!ctx) throw new Error('Canvas context not available');
            ctx.drawImage(img, 0, 0, newW, newH);

            // Export to Data URL (compressed). For transparency keep png if original has alpha.
            const hasAlpha = file.type === 'image/png' || file.type === 'image/webp';
            const outType = hasAlpha ? 'image/png' : outputType;
            const dataUrl = canvas.toDataURL(outType, quality);
            resolve(dataUrl);
          } catch (err) {
            reject(new Error(`Canvas processing failed: ${err instanceof Error ? err.message : String(err)}`));
          }
        };
        
        img.onerror = () => {
          reject(new Error('Failed to load image - possibly unsupported format or corrupted file'));
        };
        
        img.src = e.target?.result as string;
      };
      
      reader.onerror = () => {
        reject(new Error('Failed to read file'));
      };
      
      try {
        reader.readAsDataURL(file);
      } catch (err) {
        reject(new Error(`File reading failed: ${err instanceof Error ? err.message : String(err)}`));
      }
    });
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Basic client-side validation
    if (!file.type?.startsWith('image/')) {
      setErrorMessage('Formato inválido. Selecione uma imagem.');
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      setErrorMessage('Imagem muito grande. Tente uma foto menor (máx 5MB).');
      return;
    }

    (async () => {
      try {
        setIsProcessingImage(true);
        setErrorMessage(null);
        // Resize/compress to reduce memory and upload size (now defaults to 800px / 0.75)
        const resized = await resizeImageFile(file, 800, 'image/jpeg', 0.75);
        setImage(resized);
        await analyze(resized);
      } catch (err) {
        console.error('Image processing failed', err);
        const errorMsg = err instanceof Error ? err.message : 'Erro desconhecido';
        setErrorMessage(`Não foi possível processar: ${errorMsg}. Tente outra foto ou em menor resolução.`);
      } finally {
        setIsProcessingImage(false);
      }
    })();
  };

  const analyze = async (base64Full: string) => {
    // Expect a dataURL (e.g. data:image/jpeg;base64,....)
    try {
      setIsAnalyzing(true);
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

      const data = await geminiService.analyzeFoodImage(base64Data, context);
      setResult(data);

      if (data.reasoning) {
        geminiService.speakMessage(`I found ${data.foodName}. ${data.reasoning}`);
      }
    } catch (error) {
      console.error(error);
      setErrorMessage('Não foi possível analisar a imagem. Tente novamente com uma foto menor ou mais nítida.');
    } finally {
      setIsAnalyzing(false);
    }
  };

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
    if (fileInputRef.current) {
      // clear the value so same file can be reselected
      fileInputRef.current.value = '';
      fileInputRef.current.click();
    }
  };

  // (Removed manual-edit inputs; keep model estimates read-only)

  // Re-analyze the current image attempting to use a higher export quality / larger size
  const reAnalyzeHighQuality = async () => {
    if (!image) return;
    setIsAnalyzing(true);
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
          setErrorMessage('Reanálise falhou. Tente outra foto ou usar uma de maior qualidade.');
          setIsAnalyzing(false);
        }
      };
      
      img.onerror = () => {
        setErrorMessage('Erro ao carregar imagem para reanálise.');
        setIsAnalyzing(false);
      };
      
      img.src = image;
    } catch (err) {
      console.error('Reanalysis failed', err);
      setErrorMessage('Reanálise falhou. Tente outra foto ou usar os ajustes manuais.');
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-dark flex flex-col h-full animate-fade-in">
      {/* Header Overlay */}
      <div className="absolute top-0 left-0 right-0 p-6 flex justify-between items-center z-20 bg-gradient-to-b from-dark/80 to-transparent">
        <button onClick={onClose} className="w-10 h-10 rounded-full glass-lg flex items-center justify-center text-textLight hover:glass transition-all">
            <span className="material-icons">close</span>
        </button>
        <h2 className="text-textLight font-semibold tracking-wide uppercase text-sm opacity-80">Analisador de imagem</h2>
        <div className="w-10"></div>
      </div>

      {/* Error banner */}
      {errorMessage && (
        <div className="absolute top-20 left-1/2 transform -translate-x-1/2 z-30 px-4 py-2 bg-red-600/80 text-white rounded-lg shadow-lg glow-indigo flex items-center gap-3">
          <div className="text-sm">{errorMessage}</div>
          <button onClick={() => setErrorMessage(null)} className="ml-2 text-white/80 hover:text-white">Fechar</button>
        </div>
      )}

      <div className="flex-1 relative flex flex-col">
        {!image ? (
          <div className="flex-1 flex flex-col items-center justify-center p-6 bg-gradient-to-b from-dark/50 to-dark">
            <div 
              onClick={() => setShowSourcePicker(true)}
              className="w-72 h-72 border-2 border-dashed border-primary/50 hover:border-primary rounded-3xl flex flex-col items-center justify-center cursor-pointer glass-lg transition-all group"
            >
              <div className="w-20 h-20 rounded-full glass-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform glow-cyan">
                  <span className="material-icons text-primary text-4xl">camera_alt</span>
              </div>
              <p className="text-textLight font-bold text-lg">Tirar foto</p>
              <p className="text-textMuted text-sm">ou selecione na galeria</p>
            </div>
            <input 
              type="file" 
              accept="image/*" 
              /* no capture here: gallery picker */
              ref={fileInputRef} 
              className="hidden" 
              onChange={handleFileChange}
            />
            {/* Camera input (some browsers open camera when capture attribute is present) */}
            <input
              type="file"
              accept="image/*"
              capture="environment"
              ref={cameraInputRef}
              className="hidden"
              onChange={handleFileChange}
            />

            <ImageSourcePicker
              show={showSourcePicker}
              onClose={() => setShowSourcePicker(false)}
              onChoose={(source) => {
                setShowSourcePicker(false);
                if (source === 'camera') cameraInputRef.current?.click();
                else if (source === 'gallery') fileInputRef.current?.click();
              }}
            />
          </div>
        ) : (
          <div className="relative flex-1 bg-black">
             <img src={image} alt="Food" className="w-full h-full object-cover opacity-80" />

             {/* Loading State */}
             {isProcessingImage && (
               <div className="absolute inset-0 bg-dark/80 flex flex-col items-center justify-center z-30 backdrop-blur-sm">
                <div className="relative w-20 h-20">
                  <div className="absolute inset-0 border-4 border-glassMedium rounded-full"></div>
                  <div className="absolute inset-0 border-4 border-primary rounded-full border-t-transparent animate-spin glow-cyan"></div>
                </div>
                <p className="text-textLight font-semibold text-lg mt-6">Processando imagem...</p>
                <p className="text-textMuted text-sm">Compactando e preparando para análise</p>
               </div>
             )}

             {isAnalyzing && (
                 <div className="absolute inset-0 bg-dark/80 flex flex-col items-center justify-center z-10 backdrop-blur-sm">
                    <div className="relative w-24 h-24">
                        <div className="absolute inset-0 border-4 border-glassMedium rounded-full"></div>
                        <div className="absolute inset-0 border-4 border-primary rounded-full border-t-transparent animate-spin glow-cyan"></div>
                    </div>
                    <p className="text-textLight font-bold text-lg mt-6 animate-pulse">Analisando os alimentos...</p>
                    <p className="text-textMuted text-sm">Identificando macronutrientes e calorias</p>
                 </div>
             )}

             {/* Result Sheet */}
             {result && (
               <div className="absolute bottom-0 left-0 right-0 glass-lg rounded-t-3xl p-6 shadow-2xl animate-slide-up z-20 max-h-[80vh] overflow-y-auto">
                 <div className="w-12 h-1 bg-glassMedium rounded-full mx-auto mb-6"></div>

                 <h3 className="text-2xl font-bold text-primary mb-2 leading-tight text-glow">{result.foodName}</h3>
                 <p className="text-white text-sm mb-3 leading-relaxed border-l-2 border-primary pl-3">{result.reasoning}</p>

                 <div className="flex items-center justify-between mb-4">
                    <div className="text-sm text-primary">Confiança:</div>
                    <div className="flex items-center gap-3">
                      <div className="font-bold text-textLight">{typeof result.confidence === 'number' ? `${Math.round(result.confidence)}%` : '—'}</div>
                      <div className="w-40 h-2 bg-glassDark rounded-full overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-primary to-secondary" style={{ width: `${Math.min(100, result.confidence ?? 0)}%` }} />
                      </div>
                    </div>
                 </div>

                 {typeof result.confidence === 'number' && result.confidence < 75 && (
                   <div className="mb-4 p-3 rounded-lg bg-yellow-900/10 border border-yellow-700/20">
                     <div className="font-bold text-yellow-300">Baixa confiança na estimativa</div>
                     <div className="text-sm text-textMuted">Se os valores parecerem incorretos, ajuste manualmente ou reanalise em maior qualidade.</div>
                   </div>
                 )}

                 <div className="grid grid-cols-4 gap-3 mb-8">
                    <NutrientBox label="Calorias" value={result.calories} unit="kcal" />
                    <NutrientBox label="Proteína" value={result.protein} unit="g" color="text-emerald-400" />
                    <NutrientBox label="Carboidratos" value={result.carbs} unit="g" color="text-blue-400" />
                    <NutrientBox label="Gordura" value={result.fats} unit="g" color="text-amber-400" />
                 </div>

                 <div className="flex gap-3">
                   <button 
                    onClick={handleRetake}
                    className="flex-1 py-3 rounded-2xl font-bold text-gray-300 bg-gray-800 hover:bg-gray-700 transition-colors"
                   >
                     Retomar
                   </button>
                   <button 
                    onClick={reAnalyzeHighQuality}
                    disabled={isAnalyzing}
                    className="py-3 px-4 rounded-2xl font-bold text-white bg-gradient-to-r from-gray-700 to-gray-600 hover:opacity-90 transition-colors"
                   >
                     Reanalisar
                   </button>
                   <button 
                    onClick={handleConfirm}
                    className="flex-1 py-3 rounded-2xl font-bold text-black bg-primary hover:bg-emerald-400 transition-colors shadow-lg shadow-emerald-900/30"
                   >
                     Adicionar ao registro
                   </button>
                 </div>
               </div>
             )}
          </div>
        )}
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
