import React, { useState, useMemo } from 'react';
import { StoreProvider, useStore } from './context/StoreContext';
import { Header } from './components/Header';
import { SearchAndFilters } from './components/SearchAndFilters';
import { ProductCard } from './components/ProductCard';
import { ImageLightbox } from './components/ImageLightbox';
import { CartDrawer } from './components/CartDrawer';
import { CreditPortalModal } from './components/CreditPortalModal';
import { AdminModal } from './components/AdminModal';
import { SizeGuideModal } from './components/SizeGuideModal';
import { BottomStickyBar } from './components/BottomStickyBar';
import { 
  Sparkles, 
  ShieldCheck, 
  Truck, 
  RefreshCw, 
  Heart, 
  DollarSign, 
  Smartphone, 
  Building2, 
  Banknote,
  MessageCircle,
  ShoppingBag
} from 'lucide-react';

const MainContent: React.FC = () => {
  const { 
    products, 
    favorites, 
    bcvRate, 
    setIsAdminOpen, 
    setIsSizeGuideOpen,
    unlockedClient,
    setIsCreditPortalOpen,
    paymentConfig
  } = useStore();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProductType, setSelectedProductType] = useState<string>('all');
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'dama' | 'caballero' | 'unisex'>('all');
  const [isShowingFavorites, setIsShowingFavorites] = useState(false);

  // Filtered Products
  const filteredProducts = useMemo(() => {
    return products.filter((prod) => {
      // Favorites filter
      if (isShowingFavorites && !favorites.includes(prod.id)) {
        return false;
      }

      // Product Type filter (jean, camisa, colonia, zapatos, etc.)
      if (selectedProductType !== 'all') {
        const prodType = (prod.productType || (prod.cut ? 'jean' : 'otro')).toLowerCase();
        if (prodType !== selectedProductType.toLowerCase()) {
          return false;
        }
      }

      // Category filter (dama, caballero, unisex)
      if (selectedCategory !== 'all' && prod.category !== selectedCategory && prod.category !== 'unisex') {
        return false;
      }

      // Search term
      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase();
        const matchName = prod.name.toLowerCase().includes(query);
        const matchId = prod.id.toLowerCase().includes(query);
        const matchCut = (prod.cut || '').toLowerCase().includes(query);
        const matchCategory = (prod.category || '').toLowerCase().includes(query);
        const matchType = (prod.productType || '').toLowerCase().includes(query);
        const matchTag = (prod.tag || '').toLowerCase().includes(query);
        const matchDesc = (prod.description || '').toLowerCase().includes(query);

        return matchName || matchId || matchCut || matchCategory || matchType || matchTag || matchDesc;
      }

      return true;
    });
  }, [products, favorites, isShowingFavorites, selectedProductType, selectedCategory, searchTerm]);

  return (
    <div className="min-h-screen bg-[#07070B] text-white flex flex-col font-sans selection:bg-pink-600 selection:text-white pb-20 sm:pb-10">
      
      {/* Navbar Superior con Logo, Tasa BCV y Acciones */}
      <Header 
        onOpenFavorites={() => setIsShowingFavorites(!isShowingFavorites)}
        isShowingFavorites={isShowingFavorites}
      />

      {/* Barra de Búsqueda, Tipos de Producto, Categorías y Consulta de Saldo */}
      <SearchAndFilters
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        selectedProductType={selectedProductType}
        setSelectedProductType={setSelectedProductType}
        selectedCategory={selectedCategory}
        setSelectedCategory={setSelectedCategory}
      />

      {/* Banner Informativo si está filtrando por Favoritos */}
      {isShowingFavorites && (
        <div className="bg-pink-900/30 border-b border-pink-500/30 py-2 px-4 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-black text-pink-300">
            <Heart className="w-4 h-4 fill-pink-500 text-pink-500" />
            <span>Mostrando tus productos favoritos guardados ({filteredProducts.length})</span>
          </div>
          <button
            onClick={() => setIsShowingFavorites(false)}
            className="text-[11px] text-gray-300 hover:text-white underline font-bold cursor-pointer"
          >
            Ver todo el catálogo
          </button>
        </div>
      )}

      {/* Main Container / Grilla de Productos */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-2.5 sm:px-6 lg:px-8 py-4 sm:py-6">
        
        {/* Título de Sección & Contador */}
        <div className="flex items-baseline justify-between mb-3 px-1">
          <div>
            <h2 className="text-sm sm:text-lg font-black text-white tracking-tight flex items-center gap-2 flex-wrap">
              <span>
                {selectedProductType === 'jean' 
                  ? 'Catálogo de Jeans' 
                  : selectedProductType === 'camisa' 
                    ? 'Camisas, Blusas & Tops' 
                    : selectedProductType === 'colonia' 
                      ? 'Perfumes & Colonias' 
                      : selectedProductType === 'zapatos' 
                        ? 'Calzado & Zapatos' 
                        : selectedCategory === 'dama' 
                          ? 'Colección Damas' 
                          : selectedCategory === 'caballero' 
                            ? 'Colección Caballeros' 
                            : 'Catálogo de Productos Oficial'}
              </span>
              <span className="text-[11px] sm:text-xs font-black text-pink-300 bg-pink-500/15 px-2.5 py-0.5 rounded-full border border-pink-500/30">
                {filteredProducts.length} {filteredProducts.length === 1 ? 'prenda' : 'prendas'}
              </span>
            </h2>
            <p className="text-[10px] sm:text-xs text-gray-400">
              Venta de Contado y a Crédito • Todos los precios a tasa oficial BCV (Bs. {bcvRate.toFixed(2)})
            </p>
          </div>

          <button
            onClick={() => setIsSizeGuideOpen(true)}
            className="text-[11px] text-pink-400 hover:text-pink-300 font-bold flex items-center gap-1 cursor-pointer"
          >
            <span>📏 Guía de Tallas</span>
          </button>
        </div>

        {/* Grilla de 2 Columnas en Celular / 3 en Tablet / 4 en Desktop */}
        {filteredProducts.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5 sm:gap-4 md:gap-5">
            {filteredProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <div className="text-center py-16 px-4 bg-[#12121D] rounded-3xl border border-white/5 my-4">
            <div className="w-14 h-14 rounded-2xl bg-pink-500/10 text-pink-400 flex items-center justify-center mx-auto text-2xl mb-3">
              🔍
            </div>
            <h3 className="text-base font-black text-white">No se encontraron productos con ese filtro</h3>
            <p className="text-xs text-gray-400 max-w-sm mx-auto mt-1 mb-4">
              Prueba cambiando la categoría, el tipo de producto o limpiando la barra de búsqueda.
            </p>
            <button
              onClick={() => {
                setSearchTerm('');
                setSelectedCategory('all');
                setSelectedProductType('all');
                setIsShowingFavorites(false);
              }}
              className="px-4 py-2 bg-gradient-to-r from-pink-600 to-rose-600 text-white text-xs font-black rounded-xl shadow-md cursor-pointer"
            >
              Restablecer Filtros
            </button>
          </div>
        )}

        {/* Banner de Confianza y Métodos de Pago */}
        <div className="mt-8 bg-gradient-to-r from-[#141424] via-[#1A1A2E] to-[#141424] border border-pink-500/20 rounded-3xl p-4 sm:p-6 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-center sm:text-left">
            
            <div className="flex items-center gap-3 bg-black/30 p-3 rounded-2xl border border-white/5">
              <div className="w-10 h-10 rounded-xl bg-pink-500/20 text-pink-400 flex items-center justify-center shrink-0">
                <Smartphone className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-xs font-black text-white">Pago Móvil & Transferencia</h4>
                <p className="text-[10px] text-gray-400">Calculado a tasa oficial del Banco Central de Venezuela.</p>
              </div>
            </div>

            <div className="flex items-center gap-3 bg-black/30 p-3 rounded-2xl border border-white/5">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                <Banknote className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-xs font-black text-white">Dólares en Efectivo ($)</h4>
                <p className="text-[10px] text-gray-400">Aceptamos billetes en buen estado al momento de la entrega.</p>
              </div>
            </div>

            <div className="flex items-center gap-3 bg-black/30 p-3 rounded-2xl border border-white/5">
              <div className="w-10 h-10 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center shrink-0">
                <Truck className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-xs font-black text-white">Envíos Rápidos & Seguros</h4>
                <p className="text-[10px] text-gray-400">¡Envío directo o delivery rápido a tu ubicación!</p>
              </div>
            </div>

          </div>
        </div>

      </main>

      {/* Footer Oficial de Mundo Moda Shop */}
      <footer className="bg-[#0A0A10] border-t border-pink-500/20 pt-8 pb-16 sm:pb-8 px-4 text-xs text-gray-400">
        <div className="max-w-7xl mx-auto space-y-6">
          
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4 text-center sm:text-left">
            <div className="flex items-center gap-3.5">
              <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl overflow-hidden shrink-0 shadow-md">
                <img src="/logo.jpg" alt="MMS" className="w-full h-full object-cover" />
              </div>
              <div>
                <span className="text-2xl sm:text-3xl font-['Alex_Brush'] text-white block">Mundo Moda Shop</span>
                <span className="text-[10px] sm:text-xs font-bold text-pink-400 uppercase tracking-wider block">
                  Boutique Oficial en Venezuela
                </span>
              </div>
            </div>

            <div className="flex items-center gap-3 text-xs font-bold">
              <button 
                onClick={() => setIsSizeGuideOpen(true)}
                className="hover:text-pink-400 transition-colors cursor-pointer"
              >
                Tabla de Tallas
              </button>
              <span>•</span>
              <button 
                onClick={() => {
                  const text = encodeURIComponent("¡Hola Mundo Moda Shop! Deseo información de sus productos.");
                  window.open(`https://wa.me/${paymentConfig.whatsappNumber || '584120000000'}?text=${text}`, '_blank');
                }}
                className="hover:text-emerald-400 transition-colors flex items-center gap-1 cursor-pointer"
              >
                <MessageCircle className="w-3.5 h-3.5 text-emerald-400" />
                <span>WhatsApp Oficial</span>
              </button>
              <span>•</span>
              <button 
                onClick={() => setIsCreditPortalOpen(true)}
                className="hover:text-amber-400 transition-colors flex items-center gap-1 cursor-pointer"
              >
                <span>Consultar Mi Cuenta</span>
              </button>
            </div>
          </div>

          <div className="border-t border-white/5 pt-4 flex flex-col sm:flex-row justify-between items-center gap-2 text-[10px] text-gray-500">
            <span>© {new Date().getFullYear()} Mundo Moda Shop Boutique Oficial. Todos los derechos reservados.</span>
            <span>Precios expresados en USD ($) liquidados a Tasa Oficial BCV.</span>
          </div>

        </div>
      </footer>

      {/* Floating Bottom Bar para Celulares */}
      <BottomStickyBar 
        onToggleFavorites={() => setIsShowingFavorites(!isShowingFavorites)}
        isShowingFavorites={isShowingFavorites}
      />

      {/* Modales y Drawers */}
      <ImageLightbox />
      <CartDrawer />
      <SizeGuideModal />
      <CreditPortalModal />
      <AdminModal />

    </div>
  );
};

export default function App() {
  return (
    <StoreProvider>
      <MainContent />
    </StoreProvider>
  );
}

