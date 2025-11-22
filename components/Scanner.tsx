import React, { useState, useRef } from 'react';
import { geminiService, AnalyzedFood } from '../services/geminiService';
import { useAppStore } from '../store';
import { FoodItem } from '../types';
import { v4 as uuidv4 } from 'uuid';

interface ScannerProps {
  onClose: () => void;
}

export const Scanner: React.FC<ScannerProps> = ({ onClose }) => {
  const { user, addFood } = useAppStore();
  const [image, setImage] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isProcessingImage, setIsProcessingImage] = useState(false);
  const [result, setResult] = useState<AnalyzedFood | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const currentImageBlobRef = useRef<Blob | null>(null);

  // Resize/compress image in browser to avoid high memory usage and very large uploads.
  // Returns a Blob (not a dataURL) to avoid keeping big base64 strings in memory.
  const resizeImageFile = async (file: File, maxSize = 640, outputType = 'image/jpeg', quality = 0.7): Promise<Blob> => {
    let bitmap: ImageBitmap | null = null;
    try {
      bitmap = await createImageBitmap(file as Blob);
    } catch (e) {
      // If createImageBitmap fails for very large images, fall back to image element decode
      await new Promise<void>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          const img = new Image();
          img.onload = () => {
            try {
              const maxDim = Math.max(img.width, img.height);
              const scale = maxDim > maxSize ? maxSize / maxDim : 1;
              const newW = Math.round(img.width * scale);
              const newH = Math.round(img.height * scale);
              const canvas = document.createElement('canvas');
              canvas.width = newW;
              canvas.height = newH;
              const ctx = canvas.getContext('2d');
              if (!ctx) return reject(new Error('Canvas not supported'));
              ctx.drawImage(img, 0, 0, newW, newH);
              canvas.toBlob((b) => b ? resolve() : reject(new Error('toBlob failed')), outputType, quality);
            } catch (err) { reject(err); }
          };
          img.onerror = reject;
          img.src = reader.result as string;
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      // Try to decode again; some environments allow createImageBitmap after smaller loads
      bitmap = await createImageBitmap(file as Blob).catch(() => null);
    }

    try {
      if (!bitmap) throw new Error('Image decoding failed');
      const { width, height } = bitmap;
      const maxDim = Math.max(width, height);
      const scale = maxDim > maxSize ? maxSize / maxDim : 1;
      const newW = Math.round(width * scale);
      const newH = Math.round(height * scale);

      const canvas = document.createElement('canvas');
      canvas.width = newW;
      canvas.height = newH;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Canvas not supported');
      ctx.drawImage(bitmap, 0, 0, newW, newH);

      const blob: Blob | null = await new Promise((resolve) => canvas.toBlob(resolve, outputType, quality));
      if (!blob) throw new Error('Failed to create image blob');
      return blob;
    } finally {
      try { (bitmap as any)?.close?.(); } catch (e) { /* ignore */ }
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    (async () => {
      try {
        setIsProcessingImage(true);
        // Resize/compress to reduce memory and upload size (defaults to 640px / 0.7)
        const blob = await resizeImageFile(file, 640, 'image/jpeg', 0.7);

        // revoke previous object URL if present
        if (image && image.startsWith('blob:')) {
          try { URL.revokeObjectURL(image); } catch (e) { /* ignore */ }
        }

        currentImageBlobRef.current = blob;
        const objectUrl = URL.createObjectURL(blob);
        setImage(objectUrl);
        setIsProcessingImage(false);

        // Convert blob to base64 and analyze (keep base64 lifetime short)
        await analyzeBlobAndSend(blob);
      } catch (err) {
        console.error('Image processing failed', err);
        alert('Não foi possível processar a imagem (memória ou formato). Tente uma foto menor.');
        setIsProcessingImage(false);
      }
    })();
  };

  // Convert a Blob to a base64 data payload (without data: prefix)
  const blobToBase64Data = (blob: Blob): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const res = reader.result as string | null;
        if (!res) return reject(new Error('Failed to read blob'));
        const base64 = res.split(',')[1];
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  };

  const analyzeBlobAndSend = async (blob: Blob) => {
    try {
      setIsAnalyzing(true);
      const base64Data = await blobToBase64Data(blob);
      const context = `${user?.somatotype} with goal to ${user?.goal}`;

      const data = await geminiService.analyzeFoodImage(base64Data, context);
      setResult(data);

      if (data.reasoning) {
        // Speak in Portuguese
        geminiService.speakMessage(`Encontrei ${data.foodName}. ${data.reasoning}`);
      }
    } catch (error) {
      console.error(error);
      alert('Não foi possível analisar a imagem. Tente novamente com uma foto menor ou mais nítida.');
    } finally {
      setIsAnalyzing(false);
      // cleanup blob reference (preview stays as object URL until user closes or retakes)
      currentImageBlobRef.current = null;
    }
  };

  const handleConfirm = () => {
    if (!result) return;

    (async () => {
      try {
        // If we have the processed blob, convert it to base64 for persistence
        let persistentImageBase64: string | undefined = undefined;
        const blob = currentImageBlobRef.current;
        if (blob) {
          persistentImageBase64 = await blobToBase64Data(blob);
        }

        const newFood: FoodItem = {
          id: uuidv4(),
          name: result.foodName,
          calories: result.calories,
          protein: result.protein,
          carbs: result.carbs,
          fats: result.fats,
          weight: result.weightEstimate,
          timestamp: Date.now(),
          // keep transient preview (object URL) for immediate display in this session
          imageUrl: image || undefined,
          // store base64 payload (no data: prefix) so it persists in localStorage across reloads
          imageData: persistentImageBase64,
        };

        addFood(newFood);
        onClose();
      } catch (err) {
        console.error('Failed to persist image for food item', err);
        // Fallback: still save the entry without an imageData
        const newFood: FoodItem = {
          id: uuidv4(),
          name: result.foodName,
          calories: result.calories,
          protein: result.protein,
          carbs: result.carbs,
          fats: result.fats,
          weight: result.weightEstimate,
          timestamp: Date.now(),
          imageUrl: image || undefined,
        };
        addFood(newFood);
        onClose();
      }
    })();
  };

  const handleRetake = () => {
    // revoke object URL if used
    if (image && image.startsWith('blob:')) {
      try { URL.revokeObjectURL(image); } catch (e) { /* ignore */ }
    }
    currentImageBlobRef.current = null;
    setImage(null);
    setResult(null);
    if (fileInputRef.current) {
      // clear the value so same file can be reselected
      fileInputRef.current.value = '';
      fileInputRef.current.click();
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col h-full animate-fade-in">
      {/* Header Overlay */}
      <div className="absolute top-0 left-0 right-0 p-6 flex justify-between items-center z-20 bg-gradient-to-b from-black/80 to-transparent">
        <button onClick={onClose} className="w-10 h-10 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center text-white hover:bg-white/20 transition-colors">
            <span className="material-icons">close</span>
        </button>
        <h2 className="text-white font-semibold tracking-wide uppercase text-sm opacity-80">Analizador de imagem</h2>
        <div className="w-10"></div>
      </div>

      <div className="flex-1 relative flex flex-col">
        {!image ? (
          <div className="flex-1 flex flex-col items-center justify-center p-6 bg-gray-900">
            <div 
              onClick={() => fileInputRef.current?.click()}
              className="w-72 h-72 border-2 border-dashed border-gray-600 hover:border-primary rounded-3xl flex flex-col items-center justify-center cursor-pointer bg-gray-800/50 transition-all group"
            >
              <div className="w-20 h-20 rounded-full bg-gray-800 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform shadow-lg">
                  <span className="material-icons text-primary text-4xl">camera_alt</span>
              </div>
              <p className="text-white font-bold text-lg">Tirar foto</p>
              <p className="text-gray-500 text-sm">ou carregar da galeria</p>
            </div>
            <input 
              type="file" 
              accept="image/*" 
              capture="environment"
              ref={fileInputRef} 
              className="hidden" 
              onChange={handleFileChange}
            />
          </div>
        ) : (
          <div className="relative flex-1 bg-black">
             <img src={image} alt="Food" className="w-full h-full object-cover opacity-80" />
             
             {/* Loading State */}
             {isProcessingImage && (
               <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center z-30 backdrop-blur-sm">
                <div className="relative w-20 h-20">
                  <div className="absolute inset-0 border-4 border-gray-700 rounded-full"></div>
                  <div className="absolute inset-0 border-4 border-primary rounded-full border-t-transparent animate-spin"></div>
                </div>
                <p className="text-white font-semibold text-lg mt-6">Processando imagem...</p>
                <p className="text-gray-400 text-sm">Compactando e preparando para análise</p>
               </div>
             )}

             {isAnalyzing && (
                 <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center z-10 backdrop-blur-sm">
                    <div className="relative w-24 h-24">
                        <div className="absolute inset-0 border-4 border-gray-700 rounded-full"></div>
                        <div className="absolute inset-0 border-4 border-primary rounded-full border-t-transparent animate-spin"></div>
                    </div>
                    <p className="text-white font-bold text-lg mt-6 animate-pulse">Analisando os alimentos...</p>
                    <p className="text-gray-400 text-sm">Identificando macronutrientes e calorias</p>
                 </div>
             )}

             {/* Result Sheet */}
             {result && (
               <div className="absolute bottom-0 left-0 right-0 bg-card rounded-t-3xl p-6 shadow-2xl animate-slide-up z-20 border-t border-gray-800 max-h-[80vh] overflow-y-auto">
                 <div className="w-12 h-1 bg-gray-700 rounded-full mx-auto mb-6"></div>
                 
                 <h3 className="text-2xl font-bold text-white mb-2 leading-tight">{result.foodName}</h3>
                 <p className="text-gray-400 text-sm mb-6 leading-relaxed border-l-2 border-primary pl-3">{result.reasoning}</p>
                 
                 <div className="grid grid-cols-4 gap-3 mb-8">
                    <NutrientBox label="Calories" value={result.calories} unit="kcal" />
                    <NutrientBox label="Protein" value={result.protein} unit="g" color="text-emerald-400" />
                    <NutrientBox label="Carbs" value={result.carbs} unit="g" color="text-blue-400" />
                    <NutrientBox label="Fat" value={result.fats} unit="g" color="text-amber-400" />
                 </div>

                 <div className="flex gap-3">
                   <button 
                    onClick={handleRetake}
                    className="flex-1 py-4 rounded-2xl font-bold text-gray-300 bg-gray-800 hover:bg-gray-700 transition-colors"
                   >
                     Voltar
                   </button>
                   <button 
                    onClick={handleConfirm}
                    className="flex-1 py-4 rounded-2xl font-bold text-black bg-primary hover:bg-emerald-400 transition-colors shadow-lg shadow-emerald-900/30"
                   >
                     Guardar os dados
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
