import React from 'react';

interface Props {
  show: boolean;
  onClose: () => void;
  onChoose: (source: 'camera' | 'gallery' | 'cancel') => void;
}

const ImageSourcePicker: React.FC<Props> = ({ show, onClose, onChoose }) => {
  if (!show) return null;

  return (
    <div className="fixed inset-0 z-40 flex items-end justify-center sm:items-center sm:justify-center">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose}></div>
      <div className="glass-lg p-4 rounded-t-2xl sm:rounded-2xl w-full sm:w-96 mx-4 mb-6 sm:mb-0 z-50">
        <div className="text-textLight font-semibold mb-2">Selecionar fonte</div>
        <div className="flex flex-col gap-3">
          <button
            onClick={() => onChoose('camera')}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-primary to-secondary text-dark font-medium hover:shadow-lg hover:glow-cyan transition-all"
          >
            Usar câmera
          </button>
          <button
            onClick={() => onChoose('gallery')}
            className="w-full py-3 rounded-xl glass-sm text-textLight font-medium hover:glass transition-all"
          >
            Escolher da galeria
          </button>
          <button onClick={() => onChoose('cancel')} className="w-full py-3 rounded-xl bg-transparent text-textMuted hover:text-textLight">Cancelar</button>
        </div>
      </div>
    </div>
  );
};

export default ImageSourcePicker;
