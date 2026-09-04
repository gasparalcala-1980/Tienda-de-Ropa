import React from 'react';
import { useStore } from '../context/StoreContext';
import { ShoppingBag, MessageCircle, Ruler, Heart } from 'lucide-react';

interface BottomStickyBarProps {
  onToggleFavorites: () => void;
  isShowingFavorites: boolean;
}

export const BottomStickyBar: React.FC<BottomStickyBarProps> = ({
  onToggleFavorites,
  isShowingFavorites
}) => {
  const { 
    cartItemsCount, 
    cartTotalUSD, 
    setIsCartOpen, 
    setIsSizeGuideOpen, 
    paymentConfig,
    favorites,
    bcvRate,
    formatBS
  } = useStore();

  const handleOpenWhatsAppAdvisor = () => {
    const text = encodeURIComponent(
      `¡Hola Mundo Moda Shop! 👋 Estoy viendo el catálogo de jeans en línea. ¿Me podrían asesorar con la disponibilidad de modelos y formas de pago? ✨`
    );
    window.open(`https://wa.me/${paymentConfig.whatsappNumber || '584120000000'}?text=${text}`, '_blank');
  };

  return (
    <div className="fixed bottom-0 inset-x-0 z-40 bg-[#0A0A12]/95 backdrop-blur-xl border-t border-pink-500/20 p-2 sm:hidden flex items-center justify-between gap-2 shadow-[0_-5px_20px_rgba(0,0,0,0.8)]">
      
      {/* Botón WhatsApp Asesor */}
      <button
        onClick={handleOpenWhatsAppAdvisor}
        className="flex-1 py-2 px-2.5 bg-[#22C55E]/15 hover:bg-[#22C55E]/25 text-[#22C55E] border border-green-500/30 rounded-xl text-xs font-black flex items-center justify-center gap-1.5 active:scale-95 transition-all cursor-pointer"
      >
        <MessageCircle className="w-4 h-4 text-emerald-400" />
        <span>WhatsApp</span>
      </button>

      {/* Botón Guía de Tallas */}
      <button
        onClick={() => setIsSizeGuideOpen(true)}
        className="py-2 px-3 bg-white/5 hover:bg-white/10 text-gray-300 border border-white/10 rounded-xl text-xs font-bold flex items-center justify-center gap-1 active:scale-95 transition-all cursor-pointer"
      >
        <Ruler className="w-4 h-4 text-pink-400" />
        <span>Tallas</span>
      </button>

      {/* Botón Carrito con Total */}
      <button
        onClick={() => setIsCartOpen(true)}
        className="flex-1 py-2 px-3 bg-gradient-to-r from-pink-600 to-rose-600 text-white rounded-xl text-xs font-black flex items-center justify-center gap-1.5 shadow-[0_0_15px_rgba(255,46,147,0.4)] active:scale-95 transition-all cursor-pointer border border-pink-400/40"
      >
        <ShoppingBag className="w-4 h-4" />
        <span>
          {cartItemsCount > 0 ? `Ver (${cartItemsCount}) • $${cartTotalUSD.toFixed(0)}` : 'Ver Pedido'}
        </span>
      </button>

    </div>
  );
};
