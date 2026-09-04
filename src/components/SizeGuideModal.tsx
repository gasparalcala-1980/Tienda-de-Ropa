import React, { useState } from 'react';
import { useStore } from '../context/StoreContext';
import { X, Ruler, Sparkles, Check } from 'lucide-react';

export const SizeGuideModal: React.FC = () => {
  const { isSizeGuideOpen, setIsSizeGuideOpen } = useStore();
  const [activeTab, setActiveTab] = useState<'dama' | 'caballero'>('dama');
  const [cinturaInput, setCinturaInput] = useState('');
  const [caderaInput, setCaderaInput] = useState('');
  const [recommendedSize, setRecommendedSize] = useState<string | null>(null);

  if (!isSizeGuideOpen) return null;

  const damaTable = [
    { talla: "28 (XS)", cintura: "62 - 67 cm", cadera: "88 - 93 cm", tip: "Equivale a Talla 4/6" },
    { talla: "30 (S)", cintura: "68 - 73 cm", cadera: "94 - 99 cm", tip: "Equivale a Talla 8" },
    { talla: "32 (M)", cintura: "74 - 79 cm", cadera: "100 - 105 cm", tip: "Equivale a Talla 10" },
    { talla: "34 (L)", cintura: "80 - 86 cm", cadera: "106 - 112 cm", tip: "Equivale a Talla 12" },
  ];

  const caballeroTable = [
    { talla: "30", cintura: "76 - 80 cm", largo: "102 cm", tip: "Corte estándar" },
    { talla: "32", cintura: "81 - 85 cm", largo: "104 cm", tip: "Más vendido" },
    { talla: "34", cintura: "86 - 90 cm", largo: "105 cm", tip: "Corte confort" },
    { talla: "36", cintura: "91 - 96 cm", largo: "106 cm", tip: "Corte holgado" },
    { talla: "38", cintura: "97 - 102 cm", largo: "107 cm", tip: "Plus confort" },
  ];

  const handleCalculateSize = (e: React.FormEvent) => {
    e.preventDefault();
    const cint = parseFloat(cinturaInput);
    const cad = parseFloat(caderaInput);

    if (activeTab === 'dama') {
      if (cad <= 93 || cint <= 67) setRecommendedSize('28 (XS)');
      else if (cad <= 99 || cint <= 73) setRecommendedSize('30 (S)');
      else if (cad <= 105 || cint <= 79) setRecommendedSize('32 (M)');
      else setRecommendedSize('34 (L)');
    } else {
      if (cint <= 80) setRecommendedSize('30');
      else if (cint <= 85) setRecommendedSize('32');
      else if (cint <= 90) setRecommendedSize('34');
      else if (cint <= 96) setRecommendedSize('36');
      else setRecommendedSize('38');
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4">
      <div className="relative w-full max-w-lg bg-[#0F0F17] border border-pink-500/30 rounded-3xl text-white shadow-2xl overflow-hidden">
        
        {/* Header */}
        <div className="p-4 sm:p-5 bg-[#141420] border-b border-pink-500/20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-pink-500/20 text-pink-400 flex items-center justify-center text-lg shadow-md">
              <Ruler className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-black uppercase tracking-widest text-pink-400 block">
                TABLA DE MEDIDAS REALES
              </span>
              <h3 className="text-base sm:text-lg font-black text-white">
                Guía y Calculadora de Tallas
              </h3>
            </div>
          </div>

          <button
            onClick={() => setIsSizeGuideOpen(false)}
            className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-xl transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 sm:p-6 space-y-4 max-h-[75vh] overflow-y-auto">
          
          {/* Selector de Género */}
          <div className="flex bg-[#161626] p-1 rounded-2xl border border-white/5">
            <button
              onClick={() => {
                setActiveTab('dama');
                setRecommendedSize(null);
              }}
              className={`flex-1 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
                activeTab === 'dama'
                  ? 'bg-pink-600 text-white shadow-md'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              👩 Damas (Push-Up & Wide Leg)
            </button>
            <button
              onClick={() => {
                setActiveTab('caballero');
                setRecommendedSize(null);
              }}
              className={`flex-1 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
                activeTab === 'caballero'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              👨 Caballeros (Slim & Straight)
            </button>
          </div>

          {/* Calculadora Rápida */}
          <form onSubmit={handleCalculateSize} className="bg-[#161626] border border-pink-500/20 p-3.5 rounded-2xl space-y-3">
            <h4 className="text-xs font-black text-pink-300 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-pink-400" /> Calcula tu talla exacta en segundos:
            </h4>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <label className="block text-[10px] font-bold text-gray-400 mb-1">Cintura (cm):</label>
                <input
                  type="number"
                  value={cinturaInput}
                  onChange={(e) => setCinturaInput(e.target.value)}
                  placeholder="Ej: 72"
                  className="w-full bg-[#1F1F32] border border-white/10 rounded-xl px-3 py-1.5 text-xs font-bold text-white focus:outline-none focus:border-pink-500"
                  required
                />
              </div>

              {activeTab === 'dama' && (
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 mb-1">Cadera (cm):</label>
                  <input
                    type="number"
                    value={caderaInput}
                    onChange={(e) => setCaderaInput(e.target.value)}
                    placeholder="Ej: 98"
                    className="w-full bg-[#1F1F32] border border-white/10 rounded-xl px-3 py-1.5 text-xs font-bold text-white focus:outline-none focus:border-pink-500"
                  />
                </div>
              )}
            </div>

            <button
              type="submit"
              className="w-full py-2 bg-gradient-to-r from-pink-600 to-rose-600 text-white text-xs font-black rounded-xl shadow-md cursor-pointer"
            >
              Recomendar mi Talla
            </button>

            {recommendedSize && (
              <div className="bg-emerald-500/20 border border-emerald-500/40 p-2.5 rounded-xl text-center animate-fadeIn">
                <span className="text-[11px] font-bold text-gray-300 block">Tu talla sugerida en Mundo Moda es:</span>
                <span className="text-base font-black text-emerald-300">TALLA {recommendedSize} ✨</span>
              </div>
            )}
          </form>

          {/* Tabla de Medidas */}
          <div className="space-y-2">
            <h4 className="text-xs font-black text-white uppercase tracking-wider">
              Tabla de Medidas Oficial:
            </h4>

            <div className="border border-white/10 rounded-2xl overflow-hidden bg-[#161626]">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#1E1E34] text-[10px] uppercase text-pink-400 font-black">
                  <tr>
                    <th className="p-2.5">Talla</th>
                    <th className="p-2.5">Cintura</th>
                    <th className="p-2.5">{activeTab === 'dama' ? 'Cadera' : 'Largo'}</th>
                    <th className="p-2.5 hidden sm:table-cell">Detalle</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 font-semibold text-gray-300 text-[11px]">
                  {activeTab === 'dama' ? (
                    damaTable.map((row) => (
                      <tr key={row.talla} className="hover:bg-white/5">
                        <td className="p-2.5 font-black text-white">{row.talla}</td>
                        <td className="p-2.5">{row.cintura}</td>
                        <td className="p-2.5">{row.cadera}</td>
                        <td className="p-2.5 hidden sm:table-cell text-gray-400">{row.tip}</td>
                      </tr>
                    ))
                  ) : (
                    caballeroTable.map((row) => (
                      <tr key={row.talla} className="hover:bg-white/5">
                        <td className="p-2.5 font-black text-white">{row.talla}</td>
                        <td className="p-2.5">{row.cintura}</td>
                        <td className="p-2.5">{row.largo}</td>
                        <td className="p-2.5 hidden sm:table-cell text-gray-400">{row.tip}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="bg-[#12121E] p-3 rounded-xl border border-white/5 text-[11px] text-gray-400 space-y-1">
            <p className="font-bold text-white">💡 Consejos para medirte:</p>
            <p>• Mide tu cintura a la altura del ombligo con una cinta métrica sin apretar.</p>
            <p>• Los jeans con efecto Push-Up contienen elastano stretch que se adapta cómodamente a tu figura.</p>
          </div>

        </div>

      </div>
    </div>
  );
};
