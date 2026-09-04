import React, { useState, useRef } from 'react';
import { useStore } from '../context/StoreContext';
import { Product } from '../types';
import { DEFAULT_PRODUCT_IMAGE } from '../data/initialData';
import { compressImage } from '../utils/imageCompressor';
import {
  Upload,
  Sparkles,
  X,
  Plus,
  Trash2,
  DollarSign,
  CheckCircle2,
  AlertCircle,
  Layers,
  ShoppingBag,
  Sliders
} from 'lucide-react';

interface BulkProductItem {
  id: string;
  image: string;
  name: string;
  productType: string;
  category: 'dama' | 'caballero' | 'unisex';
  cut: string;
  priceUSD: number;
  availableSizes: string[];
  tag: string;
}

interface BulkProductUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const BulkProductUploadModal: React.FC<BulkProductUploadModalProps> = ({
  isOpen,
  onClose
}) => {
  const { addMultipleProducts, bcvRate, formatUSD, formatBS } = useStore();

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Default presets for the batch
  const [batchType, setBatchType] = useState<string>('jean');
  const [batchCategory, setBatchCategory] = useState<'dama' | 'caballero' | 'unisex'>('dama');
  const [batchCut, setBatchCut] = useState('Wide Leg');
  const [batchPriceUSD, setBatchPriceUSD] = useState<number>(25);
  const [batchSizes, setBatchSizes] = useState('28, 30, 32, 34');
  const [batchTag, setBatchTag] = useState('✨ NUEVA COLECCIÓN');

  // Items waiting to be saved
  const [items, setItems] = useState<BulkProductItem[]>([]);
  const [isProcessingFiles, setIsProcessingFiles] = useState(false);
  const [isSavingAll, setIsSavingAll] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  if (!isOpen) return null;

  // Handle multiple file selection and compression
  const handleFilesSelected = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    setIsProcessingFiles(true);
    setStatusMessage(null);

    const newItems: BulkProductItem[] = [];
    const sizesArray = batchSizes.split(',').map((s) => s.trim()).filter(Boolean);

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        if (!file.type.startsWith('image/')) continue;

        // Compress image to ultra fast web-ready size (~35-50KB) for seamless mobile loading
        const compressedBase64 = await compressImage(file, {
          maxWidth: 800,
          maxHeight: 1000,
          quality: 0.72
        });

        // Clean default item name based on type and sequence
        const currentCount = items.length + newItems.length + 1;
        const typeLabel =
          batchType === 'jean'
            ? 'Jean'
            : batchType === 'camisa'
            ? 'Blusa / Camisa'
            : batchType === 'colonia'
            ? 'Colonia'
            : batchType === 'vestido'
            ? 'Vestido'
            : batchType === 'zapatos'
            ? 'Calzado'
            : 'Prenda';

        const defaultName = `${typeLabel} ${batchCategory === 'dama' ? 'Dama' : batchCategory === 'caballero' ? 'Caballero' : ''} #${currentCount}`;

        newItems.push({
          id: `bulk_${Date.now()}_${i}_${Math.random().toString(36).substring(2, 6)}`,
          image: compressedBase64,
          name: defaultName,
          productType: batchType,
          category: batchCategory,
          cut: batchCut,
          priceUSD: batchPriceUSD,
          availableSizes: sizesArray.length > 0 ? sizesArray : ['Única'],
          tag: batchTag
        });
      }

      setItems((prev) => [...prev, ...newItems]);
      setStatusMessage({
        type: 'success',
        text: `Se agregaron y optimizaron ${newItems.length} fotos exitosamente. Puedes ajustar nombres o precios abajo antes de guardar.`
      });
    } catch (err) {
      console.error('Error compressing files:', err);
      setStatusMessage({
        type: 'error',
        text: 'Ocurrió un error al procesar algunas fotos. Intenta de nuevo con menos archivos.'
      });
    } finally {
      setIsProcessingFiles(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // Update a single item inside the batch
  const handleUpdateItem = (id: string, field: keyof BulkProductItem, value: any) => {
    setItems((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          return { ...item, [field]: value };
        }
        return item;
      })
    );
  };

  // Remove a single photo from the list
  const handleRemoveItem = (id: string) => {
    setItems((prev) => prev.filter((it) => it.id !== id));
  };

  // Apply default presets to all currently loaded items
  const handleApplyPresetToAll = () => {
    const sizesArray = batchSizes.split(',').map((s) => s.trim()).filter(Boolean);
    setItems((prev) =>
      prev.map((it) => ({
        ...it,
        productType: batchType,
        category: batchCategory,
        cut: batchCut,
        priceUSD: batchPriceUSD,
        availableSizes: sizesArray.length > 0 ? sizesArray : ['Única'],
        tag: batchTag
      }))
    );
    setStatusMessage({
      type: 'success',
      text: 'Se aplicaron los valores predeterminados (categoría, precio y tallas) a todas las fotos en cola.'
    });
  };

  // Save all items to store & Firestore with writeBatch and unique IDs
  const handleSaveAll = async () => {
    if (items.length === 0) return;

    setIsSavingAll(true);
    try {
      const payload = items.map((item) => ({
        name: item.name.trim(),
        productType: item.productType,
        category: item.category,
        cut: item.cut,
        priceUSD: item.priceUSD || 20,
        tag: item.tag || 'NUEVA COLECCIÓN',
        rating: 5.0,
        reviewsCount: 1,
        description: `${item.name.trim()} - Colección Mundo Moda Shop. Disponible en nuestra boutique oficial.`,
        image: item.image,
        gallery: [item.image],
        availableSizes: item.availableSizes,
        inStock: true
      }));

      const savedCount = await addMultipleProducts(payload);

      setStatusMessage({
        type: 'success',
        text: `¡Éxito total! Se publicaron ${savedCount} prendas en el catálogo y se guardaron en la nube.`
      });

      setTimeout(() => {
        setItems([]);
        setIsSavingAll(false);
        onClose();
      }, 1400);
    } catch (err) {
      console.error('Error saving bulk products:', err);
      setStatusMessage({
        type: 'error',
        text: 'Error al guardar los productos en la base de datos.'
      });
      setIsSavingAll(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/90 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 animate-fadeIn">
      <div className="relative w-full max-w-4xl bg-[#0F0F1A] border-2 border-pink-500/40 rounded-3xl text-white shadow-[0_0_50px_rgba(255,46,147,0.3)] overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Header */}
        <div className="p-4 sm:p-5 bg-[#141424] border-b border-pink-500/20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-pink-600 via-rose-600 to-purple-600 flex items-center justify-center text-white shadow-lg shrink-0">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-widest text-pink-400 bg-pink-500/10 px-2 py-0.5 rounded-md border border-pink-500/20">
                  HERRAMIENTA RÁPIDA DE INVENTARIO
                </span>
                <span className="text-[10px] text-gray-400 font-bold">
                  Tasa: <strong className="text-white">Bs. {bcvRate.toFixed(2)}</strong>
                </span>
              </div>
              <h3 className="text-base sm:text-lg font-black text-white">
                Carga Masiva de Productos por Fotos
              </h3>
              <p className="text-xs text-gray-400">
                Sube 5, 10 o 20 fotos de tu nueva mercancía a la vez. Se optimizan automáticamente y se publican en 1 solo clic.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-white rounded-xl hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-4 flex-1">
          
          {/* Status Alert */}
          {statusMessage && (
            <div
              className={`p-3 rounded-2xl text-xs font-bold flex items-center justify-between gap-2 animate-fadeIn ${
                statusMessage.type === 'success'
                  ? 'bg-emerald-500/15 border border-emerald-500/30 text-emerald-300'
                  : 'bg-rose-500/15 border border-rose-500/30 text-rose-300'
              }`}
            >
              <div className="flex items-center gap-2">
                {statusMessage.type === 'success' ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                )}
                <span>{statusMessage.text}</span>
              </div>
              <button
                type="button"
                onClick={() => setStatusMessage(null)}
                className="text-gray-400 hover:text-white p-1"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Preset Configuration Card */}
          <div className="p-4 rounded-2xl bg-[#141424] border border-white/10 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black uppercase tracking-wider text-pink-400 flex items-center gap-1.5">
                <Sliders className="w-3.5 h-3.5" />
                Configuración Predeterminada para el Lote de Fotos
              </span>
              {items.length > 0 && (
                <button
                  type="button"
                  onClick={handleApplyPresetToAll}
                  className="text-[10px] font-bold text-pink-300 hover:text-white bg-pink-500/20 hover:bg-pink-500/30 px-2.5 py-1 rounded-lg border border-pink-500/30 transition-all cursor-pointer"
                >
                  ⚡ Aplicar esta config a las fotos cargadas
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2.5 text-xs">
              {/* Tipo de Prenda */}
              <div>
                <label className="block text-[10px] font-bold text-gray-300 mb-1">
                  Tipo de Producto:
                </label>
                <select
                  value={batchType}
                  onChange={(e) => setBatchType(e.target.value)}
                  className="w-full bg-[#1A1A2E] border border-white/15 rounded-xl p-2 text-xs font-bold text-white focus:outline-none focus:border-pink-500"
                >
                  <option value="jean">👖 Jeans & Denim</option>
                  <option value="camisa">👚 Camisas / Tops</option>
                  <option value="colonia">🌸 Perfumes / Colonias</option>
                  <option value="zapatos">👟 Calzado / Zapatos</option>
                  <option value="vestido">👗 Vestidos</option>
                  <option value="accesorio">👜 Accesorios / Bolsos</option>
                  <option value="conjunto">✨ Conjuntos</option>
                  <option value="otro">🏷️ Otro</option>
                </select>
              </div>

              {/* Categoría */}
              <div>
                <label className="block text-[10px] font-bold text-gray-300 mb-1">
                  Categoría:
                </label>
                <select
                  value={batchCategory}
                  onChange={(e) => setBatchCategory(e.target.value as any)}
                  className="w-full bg-[#1A1A2E] border border-white/15 rounded-xl p-2 text-xs font-bold text-white focus:outline-none focus:border-pink-500"
                >
                  <option value="dama">👩 Damas</option>
                  <option value="caballero">👨 Caballeros</option>
                  <option value="unisex">✨ Unisex</option>
                </select>
              </div>

              {/* Precio Predeterminado USD */}
              <div>
                <label className="block text-[10px] font-bold text-gray-300 mb-1">
                  Precio Predeterminado ($ USD):
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.5"
                    value={batchPriceUSD}
                    onChange={(e) => setBatchPriceUSD(Number(e.target.value) || 0)}
                    className="w-full bg-[#1A1A2E] border border-white/15 rounded-xl pl-7 pr-2 py-2 text-xs font-black text-amber-400 focus:outline-none focus:border-pink-500"
                  />
                  <DollarSign className="w-3.5 h-3.5 text-amber-400 absolute left-2 top-2.5" />
                </div>
                <span className="text-[10px] text-emerald-400 font-bold block mt-0.5">
                  ≈ {formatBS(batchPriceUSD * bcvRate)}
                </span>
              </div>

              {/* Tallas Predeterminadas */}
              <div>
                <label className="block text-[10px] font-bold text-gray-300 mb-1">
                  Tallas Disponibles:
                </label>
                <input
                  type="text"
                  value={batchSizes}
                  onChange={(e) => setBatchSizes(e.target.value)}
                  placeholder="28, 30, 32, 34"
                  className="w-full bg-[#1A1A2E] border border-white/15 rounded-xl p-2 text-xs font-bold text-white focus:outline-none focus:border-pink-500"
                />
              </div>
            </div>
          </div>

          {/* Upload Drop Zone / Picker */}
          <div
            onClick={() => fileInputRef.current?.click()}
            className="p-6 sm:p-8 border-2 border-dashed border-pink-500/40 hover:border-pink-400 bg-pink-500/5 hover:bg-pink-500/10 rounded-3xl text-center cursor-pointer transition-all space-y-2 group"
          >
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/*"
              onChange={(e) => handleFilesSelected(e.target.files)}
              className="hidden"
            />

            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-pink-600 to-rose-600 text-white flex items-center justify-center mx-auto shadow-lg group-hover:scale-105 transition-transform">
              <Upload className="w-7 h-7" />
            </div>

            <h4 className="text-sm sm:text-base font-black text-white">
              {isProcessingFiles ? 'Optimizando fotos...' : 'Haz clic o arrastra aquí varias fotos de tus prendas'}
            </h4>
            <p className="text-xs text-gray-400 max-w-md mx-auto">
              Puedes seleccionar varias fotos juntas desde la galería de tu teléfono o carpeta de tu computadora.
            </p>

            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/10 rounded-full text-[10px] text-pink-300 font-bold">
              <Sparkles className="w-3 h-3 text-pink-400" />
              <span>Compresión ultra-rápida sin perder nitidez</span>
            </div>
          </div>

          {/* Items Preview Grid */}
          {items.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-pink-400" />
                  Prendas listas para publicar ({items.length})
                </span>
                <button
                  type="button"
                  onClick={() => setItems([])}
                  className="text-xs text-rose-400 hover:text-rose-300 font-bold flex items-center gap-1 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Vaciar lista
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {items.map((it, idx) => (
                  <div
                    key={it.id}
                    className="bg-[#141424] border border-white/10 rounded-2xl p-2.5 space-y-2 relative group hover:border-pink-500/40 transition-all shadow-md"
                  >
                    {/* Delete button */}
                    <button
                      type="button"
                      onClick={() => handleRemoveItem(it.id)}
                      className="absolute top-3 right-3 w-6 h-6 rounded-lg bg-black/60 text-rose-400 hover:text-white hover:bg-rose-600 flex items-center justify-center transition-colors z-10 cursor-pointer"
                      title="Quitar foto"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>

                    {/* Image & Price */}
                    <div className="flex gap-2.5">
                      <div className="w-16 h-20 rounded-xl overflow-hidden bg-black/40 border border-white/10 shrink-0 relative">
                        <img
                          src={it.image && it.image.trim() !== '' ? it.image : DEFAULT_PRODUCT_IMAGE}
                          alt={it.name}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            const target = e.currentTarget;
                            if (target.src !== DEFAULT_PRODUCT_IMAGE) {
                              target.src = DEFAULT_PRODUCT_IMAGE;
                            }
                          }}
                        />
                        <span className="absolute bottom-0 inset-x-0 bg-black/70 text-[9px] text-center font-bold text-gray-300">
                          #{idx + 1}
                        </span>
                      </div>

                      <div className="flex-1 space-y-1.5">
                        <input
                          type="text"
                          value={it.name}
                          onChange={(e) => handleUpdateItem(it.id, 'name', e.target.value)}
                          placeholder="Nombre de la prenda"
                          className="w-full bg-black/30 border border-white/15 rounded-lg px-2 py-1 text-xs font-bold text-white focus:outline-none focus:border-pink-500"
                        />

                        <div className="flex items-center gap-1">
                          <div className="relative flex-1">
                            <input
                              type="number"
                              step="0.5"
                              value={it.priceUSD}
                              onChange={(e) =>
                                handleUpdateItem(it.id, 'priceUSD', Number(e.target.value) || 0)
                              }
                              placeholder="Precio $"
                              className="w-full bg-black/30 border border-white/15 rounded-lg pl-5 pr-1 py-1 text-xs font-black text-amber-400 focus:outline-none focus:border-pink-500"
                            />
                            <DollarSign className="w-3 h-3 text-amber-400 absolute left-1.5 top-2" />
                          </div>

                          <span className="text-[10px] text-emerald-400 font-bold whitespace-nowrap">
                            {formatBS(it.priceUSD)}
                          </span>
                        </div>

                        <div className="text-[10px] text-gray-400 flex items-center justify-between">
                          <span className="truncate">{it.productType} • {it.category}</span>
                          <span className="text-pink-400 font-bold">{it.availableSizes.join(', ')}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-[#141424] border-t border-pink-500/20 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="text-xs text-gray-400">
            {items.length === 0 ? (
              <span>Selecciona una o varias fotos para empezar.</span>
            ) : (
              <span>
                Total a publicar: <strong className="text-white">{items.length} prendas</strong>
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 sm:flex-none px-4 py-2 bg-white/10 hover:bg-white/15 text-gray-300 text-xs font-bold rounded-xl cursor-pointer"
            >
              Cerrar
            </button>

            <button
              type="button"
              onClick={handleSaveAll}
              disabled={items.length === 0 || isSavingAll}
              className="flex-1 sm:flex-none px-5 py-2 bg-gradient-to-r from-pink-600 via-rose-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 text-white text-xs font-black rounded-xl shadow-lg flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>
                {isSavingAll
                  ? 'Guardando prendas...'
                  : `Guardar todas (${items.length}) en Catálogo`}
              </span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
