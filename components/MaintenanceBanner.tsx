import React from 'react';

interface MaintenanceBannerProps {
  onClose: () => void;
}

const MaintenanceBanner: React.FC<MaintenanceBannerProps> = ({ onClose }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
      <div className="relative w-full max-w-sm bg-gradient-to-br from-yellow-500/20 to-orange-500/20 border border-yellow-500/40 rounded-2xl p-6 shadow-2xl">
        {/* Icon */}
        <div className="flex justify-center mb-4">
          <div className="w-16 h-16 rounded-full bg-yellow-500/20 flex items-center justify-center">
            <span className="material-icons text-yellow-400 text-4xl">engineering</span>
          </div>
        </div>

        {/* Title */}
        <h2 className="text-xl font-bold text-red-400 text-center mb-2">
          ⚠️ Aplicação em Atualização
        </h2>

        {/* Message */}
        <p className="text-white text-center text-sm leading-relaxed mb-6">
          Estamos a trabalhar em melhorias! Algumas funcionalidades podem não estar a funcionar como esperado. 
          Agradecemos a sua compreensão.
        </p>

        {/* Close Button */}
        <button
          onClick={onClose}
          className="w-full py-3 rounded-xl bg-yellow-500/20 hover:bg-yellow-500/30 border border-yellow-500/40 text-yellow-400 font-semibold transition-all duration-300"
        >
          Entendido
        </button>
      </div>
    </div>
  );
};

export default MaintenanceBanner;
