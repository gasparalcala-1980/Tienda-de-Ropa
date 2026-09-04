import React, { useState } from 'react';
import { Product } from '../types';
import { useStore } from '../context/StoreContext';
import { DEFAULT_PRODUCT_IMAGE } from '../data/initialData';
import { Heart, Maximize2, ShoppingBag, Check } from 'lucide-react';

interface ProductCardProps {
  product: Product;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  const { 
    formatUSD, 
    formatBS, 
    addToCart, 
    favorites, 
    toggleFavorite, 
    openLightbox,
    setIsCartOpen 
  } = useStore();

  const availableSizes = Array.isArray(product?.availableSizes) && product.availableSizes.length > 0 
    ? product.availableSizes 
    : ['28', '30', '32', '34'];
  const [selectedSize, setSelectedSize] = useState<string>(availableSizes[0] || '30');
  const [isAdded, setIsAdded] = useState(false);

  const isFavorite = favorites.includes(product?.id || '');

  const handleAddToCart = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!product) return;
    addToCart(product, selectedSize, 1);
    setIsAdded(true);
    setTimeout(() => setIsAdded(false), 1500);
  };

  return (
    <div className="group bg-[#151522] border border-pink-500/20 hover:border-pink-500/50 rounded-2xl overflow-hidden shadow-lg hover:shadow-[0_0_20px_rgba(255,46,147,0.25)] transition-all flex flex-col justify-between">
      
      {/* Contenedor de Imagen con Efecto Tap-to-Zoom */}
      <div 
        className="relative aspect-[3/4] bg-black/60 overflow-hidden cursor-pointer"
        onClick={() => openLightbox(product)}
      >
        <img 
          src={product?.image && product.image.trim() !== '' ? product.image : DEFAULT_PRODUCT_IMAGE} 
          alt={product.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          loading="lazy"
          referrerPolicy="no-referrer"
          onError={(e) => {
            const target = e.currentTarget;
            if (target.src !== DEFAULT_PRODUCT_IMAGE) {
              target.src = DEFAULT_PRODUCT_IMAGE;
            }
          }}
        />

        {/* Overlay con Icono de Zoom al tocar */}
        <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
          <div className="w-9 h-9 rounded-full bg-black/70 backdrop-blur-md text-white flex items-center justify-center shadow-lg border border-white/20">
            <Maximize2 className="w-4 h-4 text-pink-400" />
          </div>
        </div>

        {/* Badge Superior (Más Vendido / Push-Up / etc) */}
        {product.tag && (
          <span className="absolute top-2 left-2 text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-pink-600/90 backdrop-blur-md text-white shadow-md">
            {product.tag}
          </span>
        )}

        {/* Botón Favorito */}
        <button 
          onClick={(e) => {
            e.stopPropagation();
            toggleFavorite(product.id);
          }}
          className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/60 backdrop-blur-md flex items-center justify-center text-white/80 hover:text-pink-400 border border-white/10 transition-transform active:scale-90"
          title="Guardar en favoritos"
        >
          <Heart className={`w-3.5 h-3.5 ${isFavorite ? 'fill-pink-500 text-pink-500' : ''}`} />
        </button>

        {/* Indicador Tap to zoom en móvil */}
        <div className="absolute bottom-1.5 right-1.5 bg-black/70 backdrop-blur-sm px-1.5 py-0.5 rounded text-[8px] font-bold text-gray-300 flex items-center gap-1 border border-white/10">
          <Maximize2 className="w-2.5 h-2.5 text-pink-400" />
          <span>Zoom</span>
        </div>
      </div>

      {/* Contenido / Info de la Prenda */}
      <div className="p-2.5 sm:p-3.5 flex-1 flex flex-col justify-between space-y-2">
        
        <div>
          {/* Categoría */}
          <div className="flex items-center justify-between text-[9px] font-extrabold text-pink-400 uppercase tracking-wider mb-0.5">
            <span className="bg-pink-500/10 px-1.5 py-0.5 rounded text-pink-300">
              Colección {product.category === 'dama' ? 'Damas' : 'Caballeros'}
            </span>
            <span className="text-gray-400 font-semibold text-[9px]">
              Original
            </span>
          </div>

          {/* Nombre de la Prenda */}
          <h3 
            onClick={() => openLightbox(product)}
            className="text-xs sm:text-sm font-black text-white line-clamp-2 hover:text-pink-300 transition-colors cursor-pointer leading-tight"
          >
            {product.name}
          </h3>

          {/* Precios: Dólares ($ USD) & Bolívares Tasa BCV */}
          <div className="mt-1.5 bg-black/30 p-1.5 rounded-xl border border-white/5">
            <div className="flex items-baseline justify-between gap-1">
              <span className="text-sm sm:text-base font-black text-pink-400">
                {formatUSD(product?.priceUSD ?? 0)} <span className="text-[10px] text-gray-300 font-bold">USD</span>
              </span>
              <span className="text-[10px] sm:text-xs font-bold text-emerald-400 text-right">
                {formatBS(product?.priceUSD ?? 0)}
              </span>
            </div>
            <span className="text-[8px] text-gray-400 block font-semibold text-right">
              Tasa Oficial BCV
            </span>
          </div>
        </div>

        {/* Selector Rápido de Talla (Ajustado a la pantalla sin barras de scroll lateral) */}
        <div className="space-y-1">
          <span className="text-[9px] font-bold text-gray-400 block">Tallas disponibles:</span>
          <div className="flex flex-wrap gap-1 items-center py-0.5">
            {availableSizes.map(size => (
              <button
                key={size}
                onClick={() => setSelectedSize(size)}
                className={`px-2 py-0.5 text-[10px] font-black rounded-lg transition-all cursor-pointer ${
                  selectedSize === size
                    ? 'bg-pink-600 text-white shadow-[0_0_8px_rgba(255,46,147,0.5)] border border-pink-400'
                    : 'bg-[#1D1D2C] text-gray-300 hover:text-white border border-white/5'
                }`}
              >
                {size}
              </button>
            ))}
          </div>
        </div>

        {/* Botón Añadir al Pedido */}
        <button
          onClick={handleAddToCart}
          className={`w-full py-2 px-2 text-xs font-black rounded-xl transition-all flex items-center justify-center gap-1.5 shadow-md active:scale-95 cursor-pointer ${
            isAdded
              ? 'bg-emerald-600 text-white'
              : 'bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-500 hover:to-rose-500 text-white shadow-[0_0_12px_rgba(255,46,147,0.3)]'
          }`}
        >
          {isAdded ? (
            <>
              <Check className="w-3.5 h-3.5" />
              <span>¡Agregado!</span>
            </>
          ) : (
            <>
              <ShoppingBag className="w-3.5 h-3.5" />
              <span>Añadir Talla {selectedSize}</span>
            </>
          )}
        </button>

      </div>

    </div>
  );
};
