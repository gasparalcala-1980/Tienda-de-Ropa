import React from 'react';
import { Search, X, ChevronDown, Layers } from 'lucide-react';

interface SearchAndFiltersProps {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  selectedProductType: string;
  setSelectedProductType: (type: string) => void;
  selectedCategory: 'all' | 'dama' | 'caballero' | 'unisex';
  setSelectedCategory: (cat: 'all' | 'dama' | 'caballero' | 'unisex') => void;
}

export const SearchAndFilters: React.FC<SearchAndFiltersProps> = ({
  searchTerm,
  setSearchTerm,
  selectedProductType,
  setSelectedProductType,
  selectedCategory,
  setSelectedCategory,
}) => {
  const productTypes = [
    { id: 'all', label: '✨ Todos los Productos (Ver Todo)' },
    { id: 'jean', label: '👖 Jeans & Denim (Dama y Caballero)' },
    { id: 'camisa', label: '👚 Camisas, Blusas & Tops' },
    { id: 'colonia', label: '🌸 Perfumes & Colonias' },
    { id: 'zapatos', label: '👟 Zapatos & Calzado' },
    { id: 'vestido', label: '👗 Vestidos & Enterizos' },
    { id: 'accesorio', label: '👜 Accesorios & Carteras' },
    { id: 'conjunto', label: '✨ Conjuntos & Outfits' },
    { id: 'otro', label: '🏷️ Otros Productos' },
  ];

  return (
    <section className="bg-[#0A0A10] border-b border-pink-500/15 py-3 px-3 sm:px-6">
      <div className="max-w-7xl mx-auto space-y-2.5">
        
        {/* Buscador de Productos (100% ancho) */}
        <div className="relative w-full">
          <input 
            type="text" 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="🔍 Buscar prenda, perfume, zapatos, blusa, corte..." 
            className="w-full bg-[#151522] border border-pink-500/25 text-white placeholder-gray-400 text-xs sm:text-sm font-semibold rounded-xl py-2.5 pl-9 pr-8 focus:outline-none focus:border-pink-500 focus:ring-1 focus:ring-pink-500 transition-all shadow-inner"
          />
          <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-pink-400">
            <Search className="w-4 h-4" />
          </div>
          {searchTerm && (
            <button 
              onClick={() => setSearchTerm('')} 
              className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-white text-xs cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Pestañas de Género / Público (Todos / Damas / Caballeros) */}
        <div className="grid grid-cols-3 gap-1.5 w-full">
          <button 
            onClick={() => setSelectedCategory('all')} 
            className={`py-2 px-1 text-center text-[11px] sm:text-xs font-black rounded-xl transition-all cursor-pointer truncate ${
              selectedCategory === 'all'
                ? 'bg-pink-600 text-white shadow-[0_0_12px_rgba(255,46,147,0.5)] border border-pink-400'
                : 'text-gray-400 hover:text-pink-300 bg-[#151522] border border-white/5'
            }`}
          >
            ✨ Todo Público
          </button>
          <button 
            onClick={() => setSelectedCategory('dama')} 
            className={`py-2 px-1 text-center text-[11px] sm:text-xs font-black rounded-xl transition-all cursor-pointer truncate ${
              selectedCategory === 'dama'
                ? 'bg-pink-600 text-white shadow-[0_0_12px_rgba(255,46,147,0.5)] border border-pink-400'
                : 'text-gray-400 hover:text-pink-300 bg-[#151522] border border-white/5'
            }`}
          >
            👩 Damas
          </button>
          <button 
            onClick={() => setSelectedCategory('caballero')} 
            className={`py-2 px-1 text-center text-[11px] sm:text-xs font-black rounded-xl transition-all cursor-pointer truncate ${
              selectedCategory === 'caballero'
                ? 'bg-blue-600 text-white shadow-[0_0_12px_rgba(59,130,246,0.5)] border border-blue-400'
                : 'text-gray-400 hover:text-blue-300 bg-[#151522] border border-white/5'
            }`}
          >
            👨 Caballeros
          </button>
        </div>

        {/* Selector Desplegable de Tipo de Producto (Jeans, Camisas, Perfumes, Zapatos, etc.) */}
        <div className="flex items-center gap-2 bg-[#12121D] p-1.5 rounded-2xl border border-pink-500/20 w-full">
          <div className="flex items-center gap-1.5 pl-2 text-pink-400 text-xs font-black shrink-0">
            <Layers className="w-3.5 h-3.5" />
            <span className="hidden xs:inline">Tipo:</span>
          </div>

          <div className="relative flex-1 min-w-0">
            <select
              value={selectedProductType}
              onChange={(e) => setSelectedProductType(e.target.value)}
              className="w-full bg-[#1A1A2C] border border-pink-500/30 text-white text-xs font-bold rounded-xl py-2 pl-3 pr-8 focus:outline-none focus:border-pink-500 focus:ring-1 focus:ring-pink-500 appearance-none cursor-pointer"
            >
              {productTypes.map(type => (
                <option key={type.id} value={type.id} className="bg-[#12121E] text-white">
                  {type.label}
                </option>
              ))}
            </select>
            <ChevronDown className="w-4 h-4 absolute right-2.5 top-1/2 -translate-y-1/2 text-pink-400 pointer-events-none" />
          </div>

          {selectedProductType !== 'all' && (
            <button
              onClick={() => setSelectedProductType('all')}
              className="p-1.5 text-gray-400 hover:text-pink-300 text-xs font-bold shrink-0 bg-white/5 rounded-xl border border-white/10 cursor-pointer"
              title="Ver todos los tipos de productos"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

      </div>
    </section>
  );
};

