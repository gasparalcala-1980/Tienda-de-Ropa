import React, { useState, useEffect } from 'react';
import { useStore } from '../context/StoreContext';
import { DEFAULT_PRODUCT_IMAGE } from '../data/initialData';
import { X, ZoomIn, ZoomOut, ShoppingBag, Check, MessageCircle, Ruler } from 'lucide-react';

export const ImageLightbox: React.FC = () => {
  const { 
    lightboxProduct, 
    closeLightbox, 
    formatUSD, 
    formatBS, 
    addToCart, 
    setIsSizeGuideOpen,
    paymentConfig 
  } = useStore();

  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [isZoomed, setIsZoomed] = useState(false);
  const [selectedSize, setSelectedSize] = useState<string>('30');
  const [isAdded, setIsAdded] = useState(false);

  useEffect(() => {
    if (lightboxProduct) {
      setActiveImageIndex(0);
      setIsZoomed(false);
      const sizes = Array.isArray(lightboxProduct.availableSizes) && lightboxProduct.availableSizes.length > 0
        ? lightboxProduct.availableSizes
        : ['28', '30', '32', '34'];
      setSelectedSize(sizes[0] || '30');
    }
  }, [lightboxProduct]);

  if (!lightboxProduct) return null;

  const availableSizes = Array.isArray(lightboxProduct.availableSizes) && lightboxProduct.availableSizes.length > 0
    ? lightboxProduct.availableSizes
    : ['28', '30', '32', '34'];

  const rawImages = lightboxProduct.gallery && lightboxProduct.gallery.length > 0 
    ? lightboxProduct.gallery 
    : [lightboxProduct.image];

  const images = rawImages
    .filter((img): img is string => typeof img === 'string' && img.trim() !== '')
    .map(img => img.trim());

  if (images.length === 0) {
    images.push(DEFAULT_PRODUCT_IMAGE);
  }

  const currentImage = images[activeImageIndex] || images[0] || DEFAULT_PRODUCT_IMAGE;

  const handleAddToCart = () => {
    addToCart(lightboxProduct, selectedSize, 1);
    setIsAdded(true);
    setTimeout(() => setIsAdded(false), 1500);
  };

  const handleWhatsAppInstantOrder = () => {
    const price = lightboxProduct.priceUSD || 0;
    const text = encodeURIComponent(
      `Hola Mundo Moda Shop! 👋 Vi el *${lightboxProduct.name}* en el catálogo.\n\n` +
      `📏 *Talla deseada:* ${selectedSize}\n` +
      `💵 *Precio:* ${formatUSD(price)} (Aprox. ${formatBS(price)} a tasa BCV)\n\n` +
      `¿Tienen disponibilidad para coordinar la entrega y el pago?`
    );
    window.open(`https://wa.me/${paymentConfig.whatsappNumber || '584120000000'}?text=${text}`, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-between bg-black/95 backdrop-blur-md transition-opacity">
      
      {/* Top Bar de la Foto Grande */}
      <div className="p-3 sm:p-4 flex items-center justify-between z-20 bg-gradient-to-b from-black/90 to-transparent">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full overflow-hidden border border-pink-500/50">
            <img src="/logo.jpg" alt="MMS" className="w-full h-full object-cover" />
          </div>
          <div>
            <span className="text-[10px] font-extrabold text-pink-400 uppercase tracking-wider block">
              Colección {lightboxProduct.category === 'dama' ? 'Damas' : 'Caballeros'}
            </span>
            <h3 className="text-xs sm:text-sm font-black text-white truncate max-w-[200px] sm:max-w-md">
              {lightboxProduct.name}
            </h3>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Zoom Toggle */}
          <button 
            onClick={() => setIsZoomed(!isZoomed)} 
            className="px-2.5 py-1 bg-white/10 hover:bg-white/20 border border-white/10 rounded-lg text-xs font-bold text-white flex items-center gap-1 cursor-pointer"
          >
            {isZoomed ? <ZoomOut className="w-3.5 h-3.5 text-pink-400" /> : <ZoomIn className="w-3.5 h-3.5 text-pink-400" />}
            <span className="hidden xs:inline">{isZoomed ? 'Alejar' : 'Zoom'}</span>
          </button>

          {/* Botón Cerrar */}
          <button 
            onClick={closeLightbox} 
            className="w-9 h-9 rounded-full bg-white/10 hover:bg-pink-600 text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Centro: Imagen Principal con Zoom al hacer Click */}
      <div 
        className="flex-1 overflow-auto flex items-center justify-center p-2 relative"
        onClick={() => setIsZoomed(!isZoomed)}
      >
        <div className={`transition-transform duration-300 ${isZoomed ? 'scale-175 cursor-zoom-out' : 'scale-100 cursor-zoom-in'}`}>
          <img 
            src={currentImage} 
            alt={lightboxProduct.name} 
            className="max-h-[60vh] sm:max-h-[70vh] w-auto max-w-full object-contain rounded-2xl shadow-[0_0_30px_rgba(0,0,0,0.8)] select-none"
            referrerPolicy="no-referrer"
            onError={(e) => {
              const target = e.currentTarget;
              if (target.src !== DEFAULT_PRODUCT_IMAGE) {
                target.src = DEFAULT_PRODUCT_IMAGE;
              }
            }}
          />
        </div>

        {lightboxProduct.tag && (
          <span className="absolute top-4 left-4 text-[9px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-pink-600 text-white shadow-md">
            {lightboxProduct.tag}
          </span>
        )}
      </div>

      {/* Bottom Bar: Miniaturas de Ángulos + Selector de Talla + Acciones */}
      <div className="p-3 sm:p-5 bg-[#0F0F17] border-t border-pink-500/20 z-20 space-y-3">
        
        <div className="flex items-center justify-between gap-3">
          {/* Miniaturas de ángulos */}
          {images.length > 1 && (
            <div className="flex flex-wrap items-center gap-1.5">
              {images.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setActiveImageIndex(idx);
                    setIsZoomed(false);
                  }}
                  className={`w-11 h-13 rounded-xl overflow-hidden border-2 transition-all shrink-0 cursor-pointer ${
                    activeImageIndex === idx ? 'border-pink-500 scale-105 shadow-[0_0_10px_rgba(255,46,147,0.5)]' : 'border-white/10 opacity-60 hover:opacity-100'
                  }`}
                >
                  <img 
                    src={img && img.trim() !== '' ? img : DEFAULT_PRODUCT_IMAGE} 
                    alt="" 
                    className="w-full h-full object-cover" 
                    onError={(e) => {
                      const target = e.currentTarget;
                      if (target.src !== DEFAULT_PRODUCT_IMAGE) {
                        target.src = DEFAULT_PRODUCT_IMAGE;
                      }
                    }}
                  />
                </button>
              ))}
            </div>
          )}

          {/* Precio Dual ($ USD y Bolívares BCV) */}
          <div className="text-right shrink-0 ml-auto">
            <div className="text-base sm:text-xl font-black text-pink-400">
              {formatUSD(lightboxProduct.priceUSD || 0)} <span className="text-xs text-white">USD</span>
            </div>
            <div className="text-xs sm:text-sm font-bold text-emerald-400">
              {formatBS(lightboxProduct.priceUSD || 0)}
            </div>
            <span className="text-[8px] text-gray-400 block font-medium">Tasa Oficial BCV</span>
          </div>
        </div>

        {/* Selector de Tallas (Adaptado a pantalla sin scroll lateral) */}
        <div>
          <div className="flex items-center justify-between text-[11px] font-bold text-gray-300 mb-1.5">
            <span>Selecciona tu talla:</span>
            <button 
              onClick={() => {
                closeLightbox();
                setIsSizeGuideOpen(true);
              }} 
              className="text-[10px] text-pink-400 underline font-semibold flex items-center gap-1 cursor-pointer"
            >
              <Ruler className="w-3 h-3" />
              <span>Guía de medidas</span>
            </button>
          </div>
          <div className="flex flex-wrap gap-1.5 items-center py-0.5">
            {availableSizes.map(size => (
              <button
                key={size}
                onClick={() => setSelectedSize(size)}
                className={`px-3 py-1.5 text-xs font-black rounded-xl transition-all cursor-pointer ${
                  selectedSize === size
                    ? 'bg-pink-600 text-white shadow-[0_0_10px_rgba(255,46,147,0.5)] border border-pink-400'
                    : 'bg-[#1C1C2C] text-gray-300 hover:text-white border border-white/10'
                }`}
              >
                Talla {size}
              </button>
            ))}
          </div>
        </div>

        {/* Botones de Acción */}
        <div className="grid grid-cols-2 gap-2 pt-1">
          <button 
            onClick={handleAddToCart}
            className={`w-full py-2.5 px-3 active:scale-95 text-white text-xs font-black rounded-xl shadow-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              isAdded ? 'bg-emerald-600' : 'bg-gradient-to-r from-pink-600 to-rose-600 shadow-[0_0_15px_rgba(255,46,147,0.4)]'
            }`}
          >
            {isAdded ? (
              <>
                <Check className="w-4 h-4" />
                <span>¡Añadido al Pedido!</span>
              </>
            ) : (
              <>
                <ShoppingBag className="w-4 h-4" />
                <span>Añadir al Pedido</span>
              </>
            )}
          </button>

          <button 
            onClick={handleWhatsAppInstantOrder}
            className="w-full py-2.5 px-3 bg-[#22C55E] hover:bg-[#16A34A] active:scale-95 text-white text-xs font-black rounded-xl shadow-[0_0_15px_rgba(34,197,94,0.3)] transition-all flex items-center justify-center gap-1.5 cursor-pointer border border-green-400/30"
          >
            <MessageCircle className="w-4 h-4" />
            <span>Pedir x WhatsApp</span>
          </button>
        </div>

      </div>
    </div>
  );
};
