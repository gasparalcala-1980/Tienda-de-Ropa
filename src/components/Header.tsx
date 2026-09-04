import React, { useState, useEffect, useRef } from 'react';
import { useStore } from '../context/StoreContext';
import { ShoppingBag, Heart, Ruler, RefreshCw, DollarSign, CreditCard } from 'lucide-react';

interface HeaderProps {
  onOpenFavorites: () => void;
  isShowingFavorites: boolean;
}

export const Header: React.FC<HeaderProps> = ({ onOpenFavorites, isShowingFavorites }) => {
  const { 
    bcvRate, 
    lastRateUpdate,
    fetchLiveBCVRate,
    isFetchingRate,
    cartItemsCount, 
    cartTotalUSD, 
    favorites, 
    setIsCartOpen, 
    setIsSizeGuideOpen, 
    setIsAdminOpen,
    unlockedClient,
    setIsCreditPortalOpen
  } = useStore();

  // Secret Admin Access: 3 taps on logo within 1.5 seconds
  const [logoClicks, setLogoClicks] = useState(0);
  const clickTimeoutRef = useRef<number | null>(null);

  const handleLogoSecretTap = () => {
    if (clickTimeoutRef.current) {
      window.clearTimeout(clickTimeoutRef.current);
    }
    const nextClicks = logoClicks + 1;
    if (nextClicks >= 3) {
      setIsAdminOpen(true);
      setLogoClicks(0);
      return;
    }
    setLogoClicks(nextClicks);
    clickTimeoutRef.current = window.setTimeout(() => {
      setLogoClicks(0);
    }, 1500);
  };

  // Keyboard shortcut for owner: Ctrl+Alt+A or Cmd+Alt+A
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.altKey && (e.key === 'a' || e.key === 'A')) {
        e.preventDefault();
        setIsAdminOpen(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [setIsAdminOpen]);

  return (
    <header className="sticky top-0 z-40 bg-[#07070B]/95 backdrop-blur-xl border-b border-pink-500/20 shadow-[0_4px_25px_rgba(0,0,0,0.6)]">
      {/* Top Banner - Tasa BCV Oficial y Beneficios */}
      <div className="bg-gradient-to-r from-pink-600 via-rose-600 to-purple-700 text-white text-[11px] sm:text-xs py-1.5 px-3 flex items-center justify-between font-extrabold tracking-wide">
        <div className="flex items-center gap-2 truncate">
          <span className="inline-block w-2 h-2 rounded-full bg-white animate-ping shrink-0"></span>
          <span className="truncate">✨ ¡Colección Exclusiva Mundo Moda! • Jeans, Ropa, Calzado, Perfumes y Accesorios</span>
        </div>
        
        {/* Tasa BCV Oficial en vivo */}
        <div className="flex items-center gap-1.5 bg-black/40 backdrop-blur-md px-2.5 py-0.5 rounded-full border border-white/20 shrink-0">
          <DollarSign className="w-3 h-3 text-emerald-400" />
          <span className="text-[10px] text-gray-200">BCV en vivo:</span>
          <span className="text-[11px] font-black text-emerald-300">Bs. {bcvRate.toFixed(2)}</span>
          <button
            onClick={() => fetchLiveBCVRate()}
            disabled={isFetchingRate}
            className="text-gray-300 hover:text-white transition-all cursor-pointer ml-0.5"
            title={`Actualizar tasa oficial (Última: ${lastRateUpdate})`}
          >
            <RefreshCw className={`w-2.5 h-2.5 ${isFetchingRate ? 'animate-spin text-pink-400' : ''}`} />
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-2.5 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14 sm:h-20 gap-1.5 sm:gap-4">
          
          {/* Logo Oficial de Mundo Moda Shop (con acceso discreto para dueña) */}
          <div 
            onClick={handleLogoSecretTap}
            className="flex items-center gap-2.5 sm:gap-4 group shrink-0 cursor-pointer select-none"
            title="Mundo Moda Shop"
          >
            <div className="relative w-13 h-13 sm:w-16 sm:h-16 rounded-xl sm:rounded-2xl overflow-hidden flex items-center justify-center shrink-0 shadow-md transition-transform group-hover:scale-105 active:scale-95 border border-pink-500/30">
              <img 
                src="/logo.jpg" 
                alt="Mundo Moda Shop Logo" 
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.target as HTMLElement).style.display = 'none';
                }}
              />
            </div>
            <div>
              <div className="flex items-baseline gap-1.5">
                <span className="text-2xl sm:text-4xl font-['Alex_Brush'] text-white drop-shadow-[0_0_12px_rgba(255,255,255,0.45)] leading-tight">
                  Mundo Moda
                </span>
                <span className="text-[10px] sm:text-xs font-black tracking-widest text-pink-400 uppercase px-1.5 py-0.5 rounded bg-pink-500/15 border border-pink-500/40">
                  SHOP
                </span>
              </div>
              <span className="text-[11px] sm:text-sm font-extrabold text-pink-300 tracking-wider uppercase block -mt-1">
                Boutique Oficial
              </span>
            </div>
          </div>

          {/* Botones de Acción */}
          <div className="flex items-center gap-1.5 sm:gap-3">
            
            {/* Consultar Mi Crédito / Tarjeta de Crédito (Siempre visible en teléfono y desktop) */}
            <button
              onClick={() => setIsCreditPortalOpen(true)}
              className={`flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1.5 sm:py-2 text-xs font-extrabold rounded-xl border transition-all cursor-pointer ${
                unlockedClient
                  ? 'bg-amber-500/20 hover:bg-amber-500/30 border-amber-500/50 text-amber-300 shadow-[0_0_10px_rgba(245,158,11,0.3)]'
                  : 'bg-gradient-to-r from-amber-600/20 to-yellow-600/20 hover:from-amber-600/30 hover:to-yellow-600/30 border-amber-500/40 text-amber-300 shadow-xs'
              }`}
              title="Consultar mi saldo de crédito o registrar pagos"
            >
              <CreditCard className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-400 shrink-0" />
              <span className="hidden sm:inline">
                {unlockedClient ? `Mi Cuenta (${unlockedClient.name.split(' ')[0]})` : 'Tarjeta de Crédito'}
              </span>
              <span className="sm:hidden text-[11px] font-black tracking-tight">
                {unlockedClient ? `$${unlockedClient.balanceUSD.toFixed(0)}` : 'Crédito'}
              </span>
            </button>

            {/* Calculadora de Tallas (Visible en pantalla mediana/grande) */}
            <button 
              onClick={() => setIsSizeGuideOpen(true)}
              className="hidden md:inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-white bg-white/5 hover:bg-pink-600/20 border border-pink-500/30 rounded-xl transition-all cursor-pointer"
              title="Guía y Calculadora de Tallas"
            >
              <Ruler className="w-4 h-4 text-pink-400" />
              <span>Tallas</span>
            </button>

            {/* Favoritos (Visible en pantallas medianas/grandes para mantener el móvil limpio) */}
            <button 
              onClick={onOpenFavorites}
              className={`hidden sm:flex relative p-2 sm:p-2.5 rounded-xl border transition-all cursor-pointer ${
                isShowingFavorites 
                  ? 'bg-pink-600 text-white border-pink-500 shadow-[0_0_12px_rgba(255,46,147,0.5)]' 
                  : 'bg-white/5 text-white/80 hover:text-pink-400 border-white/10 hover:bg-white/10'
              }`}
              title="Mis Favoritos"
            >
              <Heart className={`w-4 h-4 sm:w-5 sm:h-5 ${favorites.length > 0 ? 'fill-pink-500 text-pink-500' : ''}`} />
              {favorites.length > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 text-[9px] font-black text-white bg-pink-600 rounded-full flex items-center justify-center shadow-xs">
                  {favorites.length}
                </span>
              )}
            </button>

          </div>

        </div>
      </div>
    </header>
  );
};

