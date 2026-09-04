import React, { useState } from 'react';
import { useStore } from '../context/StoreContext';
import { PaymentMethodType } from '../types';
import { DEFAULT_PRODUCT_IMAGE } from '../data/initialData';
import { 
  X, 
  Trash2, 
  Plus, 
  Minus, 
  MessageCircle, 
  Smartphone, 
  Building2, 
  Banknote, 
  Truck, 
  Copy, 
  Check, 
  Sparkles,
  ShieldCheck
} from 'lucide-react';

export const CartDrawer: React.FC = () => {
  const { 
    isCartOpen, 
    setIsCartOpen, 
    cart, 
    removeFromCart, 
    updateCartQuantity, 
    clearCart,
    cartTotalUSD, 
    cartTotalBS, 
    bcvRate,
    paymentConfig,
    formatUSD,
    formatBS,
    unlockCreditWithCode
  } = useStore();

  const [paymentMethod, setPaymentMethod] = useState<PaymentMethodType>('pago_movil');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');
  const [couponCode, setCouponCode] = useState('');
  const [discountPercent, setDiscountPercent] = useState(0);
  const [couponMsg, setCouponMsg] = useState<{ text: string; success: boolean } | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [formError, setFormError] = useState('');

  if (!isCartOpen) return null;

  // Coupon handling
  const handleApplyCoupon = () => {
    if (!couponCode.trim()) return;

    // Check if it's a client credit unlock code
    const unlocked = unlockCreditWithCode(couponCode);
    if (unlocked) {
      setCouponMsg({ text: '✨ Portal de crédito activado.', success: true });
      return;
    }

    if (couponCode.trim().toUpperCase() === 'MUNDOMODA10') {
      setDiscountPercent(10);
      setCouponMsg({ text: '🎉 ¡10% de Descuento aplicado!', success: true });
    } else {
      setCouponMsg({ text: 'Cupón no válido.', success: false });
      setDiscountPercent(0);
    }
  };

  // Calculations
  const discountAmountUSD = (cartTotalUSD * discountPercent) / 100;
  const finalTotalUSD = Math.max(0, cartTotalUSD - discountAmountUSD);
  const finalTotalBS = finalTotalUSD * bcvRate;
  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);

  // Free shipping progress (free on 2+ items)
  const isFreeShipping = totalItems >= 2;
  const shippingPercent = Math.min(100, (totalItems / 2) * 100);

  const copyToClipboard = (text: string, fieldId: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldId);
    setTimeout(() => setCopiedField(null), 2000);
  };

  // Send order to WhatsApp
  const handleSendToWhatsApp = () => {
    if (cart.length === 0) return;
    if (!customerName.trim()) {
      setFormError('Por favor ingresa tu Nombre y Apellido.');
      return;
    }
    if (!customerPhone.trim()) {
      setFormError('Por favor ingresa tu Teléfono WhatsApp.');
      return;
    }
    setFormError('');

    const validCartItems = cart.filter(item => item && item.product);

    const itemsSummary = validCartItems.map(item => {
      const price = item.product.priceUSD || 0;
      const qty = item.quantity || 1;
      return (
        `👖 *${item.product.name}*\n` +
        `   • Talla: *${item.selectedSize}* | Cantidad: ${qty}\n` +
        `   • Precio: $${(price * qty).toFixed(2)} USD (Bs. ${(price * qty * bcvRate).toFixed(2)})`
      );
    }).join('\n\n');

    let paymentMethodText = '';
    if (paymentMethod === 'pago_movil') {
      paymentMethodText = `📲 *PAGO MÓVIL* (Bs. ${finalTotalBS.toLocaleString('es-VE', { minimumFractionDigits: 2 })})`;
    } else if (paymentMethod === 'transferencia') {
      paymentMethodText = `🏦 *TRANSFERENCIA BANCARIA* (Bs. ${finalTotalBS.toLocaleString('es-VE', { minimumFractionDigits: 2 })})`;
    } else {
      paymentMethodText = `💵 *DÓLARES EN EFECTIVO ($ USD Cash)* ($${finalTotalUSD.toFixed(2)} USD)`;
    }

    const message = 
      `🛍️ *NUEVO PEDIDO - MUNDO MODA SHOP*\n` +
      `━━━━━━━━━━━━━━━━━━━━━━\n` +
      `👤 *Cliente:* ${customerName}\n` +
      `📱 *WhatsApp:* ${customerPhone}\n` +
      (customerAddress ? `📍 *Dirección/Ciudad:* ${customerAddress}\n` : '') +
      `━━━━━━━━━━━━━━━━━━━━━━\n` +
      `📋 *PRENDAS SOLICITADAS:*\n\n` +
      `${itemsSummary}\n\n` +
      `━━━━━━━━━━━━━━━━━━━━━━\n` +
      `💵 *TOTAL EN USD:* $${finalTotalUSD.toFixed(2)} USD\n` +
      `🇻🇪 *TASA OFICIAL BCV:* Bs. ${bcvRate.toFixed(2)}\n` +
      `💰 *TOTAL A PAGAR EN BS:* Bs. ${finalTotalBS.toLocaleString('es-VE', { minimumFractionDigits: 2 })}\n` +
      (discountPercent > 0 ? `🎟️ *Descuento Cupón:* -10% (-$${discountAmountUSD.toFixed(2)})\n` : '') +
      `💳 *MÉTODO DE PAGO:* ${paymentMethodText}\n` +
      `━━━━━━━━━━━━━━━━━━━━━━\n` +
      `Hola Mundo Moda Shop, adjunto mi pedido para verificar disponibilidad y proceder al pago. ✨`;

    const encoded = encodeURIComponent(message);
    window.open(`https://wa.me/${paymentConfig.whatsappNumber || '584120000000'}?text=${encoded}`, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden flex justify-end">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/80 backdrop-blur-md transition-opacity" 
        onClick={() => setIsCartOpen(false)}
      />

      {/* Drawer */}
      <div className="relative w-screen max-w-md bg-[#0F0F17] border-l border-pink-500/30 text-white shadow-2xl flex flex-col z-10">
        
        {/* Header */}
        <div className="p-4 border-b border-pink-500/20 bg-[#14141F] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full overflow-hidden ring-2 ring-pink-500">
              <img src="/logo.jpg" alt="MMS" className="w-full h-full object-cover" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-black text-white leading-tight">Mi Pedido</h3>
              <p className="text-[11px] text-pink-400 font-bold">
                {totalItems} {totalItems === 1 ? 'prenda' : 'prendas'} • Tasa BCV: Bs. {bcvRate.toFixed(2)}
              </p>
            </div>
          </div>

          <button 
            onClick={() => setIsCartOpen(false)} 
            className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-xl transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Barra de Envío Gratis */}
        <div className="bg-[#181826] px-4 py-2 border-b border-white/5">
          <div className="flex items-center justify-between text-[10px] font-bold text-gray-300 mb-1">
            <span className="flex items-center gap-1">
              <Truck className="w-3.5 h-3.5 text-pink-400" />
              {isFreeShipping ? '🎉 ¡Felicidades! Tienes ENVÍO GRATIS' : '🚚 Agrega 2 prendas para ENVÍO GRATIS'}
            </span>
            <span className="text-pink-400">{shippingPercent}%</span>
          </div>
          <div className="w-full h-1.5 bg-black/50 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-pink-500 to-emerald-400 rounded-full transition-all duration-500" 
              style={{ width: `${shippingPercent}%` }}
            />
          </div>
        </div>

        {/* Cuerpo del Carrito */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          
          {/* Si está vacío */}
          {cart.length === 0 ? (
            <div className="text-center py-12 px-4">
              <div className="w-16 h-16 rounded-2xl bg-pink-500/10 border border-pink-500/30 text-pink-400 flex items-center justify-center mx-auto mb-3 text-2xl">
                🛍️
              </div>
              <h4 className="text-sm font-black text-white">Tu pedido está vacío</h4>
              <p className="text-xs text-gray-400 max-w-xs mx-auto mt-1 mb-5">
                Explora el catálogo de jeans de Mundo Moda Shop y agrega tus tallas preferidas.
              </p>
              <button 
                onClick={() => setIsCartOpen(false)} 
                className="px-4 py-2 bg-gradient-to-r from-pink-600 to-rose-600 text-white text-xs font-black rounded-xl shadow-lg transition-all cursor-pointer"
              >
                Explorar Catálogo
              </button>
            </div>
          ) : (
            <>
              {/* Lista de Prendas */}
              <div className="space-y-2.5">
                {cart.filter(item => item && item.product).map((item) => {
                  const price = item.product.priceUSD || 0;
                  const qty = item.quantity || 1;
                  return (
                    <div 
                      key={`${item.product.id}-${item.selectedSize}`}
                      className="p-2.5 bg-[#171724] border border-white/5 rounded-2xl flex items-center gap-3"
                    >
                      <img 
                        src={item.product?.image && item.product.image.trim() !== '' ? item.product.image : DEFAULT_PRODUCT_IMAGE} 
                        alt={item.product.name} 
                        className="w-14 h-16 object-cover rounded-xl shrink-0" 
                        onError={(e) => {
                          const target = e.currentTarget;
                          if (target.src !== DEFAULT_PRODUCT_IMAGE) {
                            target.src = DEFAULT_PRODUCT_IMAGE;
                          }
                        }}
                      />
                      
                      <div className="flex-1 min-w-0">
                        <h4 className="text-xs font-black text-white truncate">{item.product.name}</h4>
                        <span className="text-[10px] font-bold text-pink-400">
                          Talla: <span className="text-white">{item.selectedSize}</span>
                        </span>
                        
                        <div className="flex items-baseline gap-2 mt-0.5">
                          <span className="text-xs font-black text-pink-400">
                            {formatUSD(price * qty)}
                          </span>
                          <span className="text-[10px] font-bold text-emerald-400">
                            {formatBS(price * qty)}
                          </span>
                        </div>
                      </div>

                      {/* Controles de Cantidad */}
                      <div className="flex items-center gap-1.5 bg-[#0F0F17] p-1 rounded-xl border border-white/10 shrink-0">
                        <button 
                          onClick={() => updateCartQuantity(item.product.id, item.selectedSize, qty - 1)}
                          className="w-6 h-6 rounded-lg bg-white/5 hover:bg-white/10 text-gray-300 flex items-center justify-center text-xs cursor-pointer"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="text-xs font-black px-1">{qty}</span>
                        <button 
                          onClick={() => updateCartQuantity(item.product.id, item.selectedSize, qty + 1)}
                          className="w-6 h-6 rounded-lg bg-white/5 hover:bg-white/10 text-gray-300 flex items-center justify-center text-xs cursor-pointer"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>

                      <button 
                        onClick={() => removeFromCart(item.product.id, item.selectedSize)}
                        className="p-1.5 text-gray-500 hover:text-rose-400 transition-colors"
                        title="Eliminar"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  );
                })}
              </div>

              {/* Cupón de descuento */}
              <div className="bg-[#151522] p-3 rounded-2xl border border-pink-500/20 space-y-2">
                <span className="text-[11px] font-black text-pink-300 flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5" /> ¿Tienes un cupón de descuento?
                </span>
                <div className="flex gap-2">
                  <input 
                    type="text" 
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value)}
                    placeholder="Ej: MUNDOMODA10" 
                    className="flex-1 bg-[#1A1A28] border border-pink-500/30 rounded-xl px-3 py-1.5 text-xs font-bold text-white uppercase placeholder-gray-500 focus:outline-none focus:border-pink-500"
                  />
                  <button 
                    onClick={handleApplyCoupon}
                    className="px-3 py-1.5 bg-pink-600 hover:bg-pink-500 text-white text-xs font-bold rounded-xl transition-all cursor-pointer"
                  >
                    Aplicar
                  </button>
                </div>
                {couponMsg && (
                  <p className={`text-[10px] font-bold ${couponMsg.success ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {couponMsg.text}
                  </p>
                )}
              </div>

              {/* SELECCIÓN DE MÉTODO DE PAGO (PAGO MÓVIL / TRANSFERENCIA / EFECTIVO $) */}
              <div className="bg-[#151522] p-3 rounded-2xl border border-pink-500/20 space-y-2.5">
                <h4 className="text-[11px] font-black text-white uppercase tracking-wider flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> Métodos de Pago Disponibles:
                </h4>

                <div className="grid grid-cols-3 gap-1.5 text-[10px] font-bold">
                  {/* Opción 1: Pago Móvil */}
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('pago_movil')}
                    className={`p-2 rounded-xl border flex flex-col items-center justify-center gap-1 text-center transition-all cursor-pointer ${
                      paymentMethod === 'pago_movil'
                        ? 'bg-pink-600/30 border-pink-500 text-pink-300 shadow-[0_0_10px_rgba(255,46,147,0.3)]'
                        : 'bg-[#1A1A28] border-white/5 text-gray-400 hover:text-white'
                    }`}
                  >
                    <Smartphone className="w-4 h-4" />
                    <span>Pago Móvil</span>
                  </button>

                  {/* Opción 2: Transferencia */}
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('transferencia')}
                    className={`p-2 rounded-xl border flex flex-col items-center justify-center gap-1 text-center transition-all cursor-pointer ${
                      paymentMethod === 'transferencia'
                        ? 'bg-blue-600/30 border-blue-500 text-blue-300 shadow-[0_0_10px_rgba(59,130,246,0.3)]'
                        : 'bg-[#1A1A28] border-white/5 text-gray-400 hover:text-white'
                    }`}
                  >
                    <Building2 className="w-4 h-4" />
                    <span>Transferencia</span>
                  </button>

                  {/* Opción 3: Dólares Efectivo */}
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('efectivo_usd')}
                    className={`p-2 rounded-xl border flex flex-col items-center justify-center gap-1 text-center transition-all cursor-pointer ${
                      paymentMethod === 'efectivo_usd'
                        ? 'bg-emerald-600/30 border-emerald-500 text-emerald-300 shadow-[0_0_10px_rgba(34,197,94,0.3)]'
                        : 'bg-[#1A1A28] border-white/5 text-gray-400 hover:text-white'
                    }`}
                  >
                    <Banknote className="w-4 h-4" />
                    <span>Efectivo ($)</span>
                  </button>
                </div>

                {/* Desglose de Datos según el método seleccionado */}
                {paymentMethod === 'pago_movil' && (
                  <div className="bg-[#12121D] p-2.5 rounded-xl border border-pink-500/30 text-[10px] space-y-1">
                    <div className="flex items-center justify-between text-pink-400 font-bold border-b border-white/5 pb-1">
                      <span>📱 Datos Pago Móvil (Tasa BCV)</span>
                      <span className="font-black text-emerald-400">Total: {formatBS(finalTotalUSD)}</span>
                    </div>
                    <div className="flex justify-between items-center text-gray-300 pt-0.5">
                      <span>Banco: <b>{paymentConfig.pagoMovil.bank}</b></span>
                    </div>
                    <div className="flex justify-between items-center text-gray-300">
                      <span>Teléfono: <b>{paymentConfig.pagoMovil.phone}</b></span>
                      <button 
                        onClick={() => copyToClipboard(paymentConfig.pagoMovil.phone, 'pm_phone')}
                        className="text-pink-400 hover:text-white p-0.5"
                      >
                        {copiedField === 'pm_phone' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                      </button>
                    </div>
                    <div className="flex justify-between items-center text-gray-300">
                      <span>Cédula/RIF: <b>{paymentConfig.pagoMovil.idNumber}</b></span>
                      <button 
                        onClick={() => copyToClipboard(paymentConfig.pagoMovil.idNumber, 'pm_id')}
                        className="text-pink-400 hover:text-white p-0.5"
                      >
                        {copiedField === 'pm_id' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                      </button>
                    </div>
                  </div>
                )}

                {paymentMethod === 'transferencia' && (
                  <div className="bg-[#12121D] p-2.5 rounded-xl border border-blue-500/30 text-[10px] space-y-1">
                    <div className="flex items-center justify-between text-blue-400 font-bold border-b border-white/5 pb-1">
                      <span>🏦 Datos de Transferencia Bancaria</span>
                      <span className="font-black text-emerald-400">Total: {formatBS(finalTotalUSD)}</span>
                    </div>
                    <p className="text-gray-300">Banco: <b>{paymentConfig.transferencia.bank}</b> ({paymentConfig.transferencia.accountType})</p>
                    <div className="flex justify-between items-center text-gray-300">
                      <span className="font-mono text-[9px]">Cuenta: <b>{paymentConfig.transferencia.accountNumber}</b></span>
                      <button 
                        onClick={() => copyToClipboard(paymentConfig.transferencia.accountNumber, 'tr_acc')}
                        className="text-blue-400 hover:text-white p-0.5"
                      >
                        {copiedField === 'tr_acc' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                      </button>
                    </div>
                    <p className="text-gray-300">Titular: <b>{paymentConfig.transferencia.holderName}</b> ({paymentConfig.transferencia.idNumber})</p>
                  </div>
                )}

                {paymentMethod === 'efectivo_usd' && (
                  <div className="bg-[#12121D] p-2.5 rounded-xl border border-emerald-500/30 text-[10px] space-y-1">
                    <div className="flex items-center justify-between text-emerald-400 font-bold border-b border-white/5 pb-1">
                      <span>💵 Pago en Dólares Efectivo ($ USD)</span>
                      <span className="font-black text-white">Total: {formatUSD(finalTotalUSD)}</span>
                    </div>
                    <p className="text-gray-300 leading-tight">
                      {paymentConfig.efectivo.instructions || "Billetes en buen estado (sin roturas ni manchas). Pago al recibir o en entrega personal."}
                    </p>
                  </div>
                )}
              </div>

              {/* Formulario de Datos del Cliente */}
              <div className="bg-[#151522] p-3 rounded-2xl border border-pink-500/20 space-y-2.5">
                <h4 className="text-[11px] font-black text-white uppercase tracking-wider">
                  👤 Datos para tu Entrega:
                </h4>

                <div>
                  <label className="block text-[10px] font-bold text-gray-300 mb-1">
                    Tu Nombre y Apellido <span className="text-pink-500">*</span>
                  </label>
                  <input 
                    type="text" 
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="Ej: Sofia Morales" 
                    className="w-full bg-[#181824] border border-white/10 rounded-xl px-3 py-2 text-xs font-semibold text-white placeholder-gray-500 focus:outline-none focus:border-pink-500"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-gray-300 mb-1">
                    Teléfono WhatsApp <span className="text-pink-500">*</span>
                  </label>
                  <input 
                    type="tel" 
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    placeholder="Ej: 0412-1234567" 
                    className="w-full bg-[#181824] border border-white/10 rounded-xl px-3 py-2 text-xs font-semibold text-white placeholder-gray-500 focus:outline-none focus:border-pink-500"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-gray-300 mb-1">
                    Ciudad / Dirección de Entrega:
                  </label>
                  <input 
                    type="text" 
                    value={customerAddress}
                    onChange={(e) => setCustomerAddress(e.target.value)}
                    placeholder="Ej: Caracas / Valencia / Maracaibo..." 
                    className="w-full bg-[#181824] border border-white/10 rounded-xl px-3 py-2 text-xs font-semibold text-white placeholder-gray-500 focus:outline-none focus:border-pink-500"
                  />
                </div>

                {formError && (
                  <p className="text-[10px] font-bold text-rose-400 bg-rose-500/10 p-2 rounded-xl border border-rose-500/30">
                    ⚠️ {formError}
                  </p>
                )}
              </div>
            </>
          )}

        </div>

        {/* Footer / Checkout WhatsApp */}
        {cart.length > 0 && (
          <div className="p-4 bg-[#14141F] border-t border-pink-500/20 space-y-2.5">
            
            {/* Resumen Financiero Dólares & Bolívares */}
            <div className="space-y-1 text-xs">
              <div className="flex justify-between text-gray-400">
                <span>Subtotal en Dólares:</span>
                <span className="font-bold text-white">{formatUSD(cartTotalUSD)} USD</span>
              </div>
              
              {discountPercent > 0 && (
                <div className="flex justify-between text-pink-400 font-bold">
                  <span>Descuento Cupón (10%):</span>
                  <span>-{formatUSD(discountAmountUSD)}</span>
                </div>
              )}

              <div className="flex justify-between text-gray-400">
                <span>Tasa Oficial BCV:</span>
                <span className="font-bold text-gray-200">Bs. {bcvRate.toFixed(2)} por $1 USD</span>
              </div>

              <div className="flex justify-between text-gray-400">
                <span>Envío:</span>
                <span className="font-bold text-emerald-400">{isFreeShipping ? '¡GRATIS!' : 'A convenir'}</span>
              </div>

              <div className="pt-2 border-t border-white/10 space-y-0.5">
                <div className="flex justify-between items-baseline">
                  <span className="text-xs font-bold text-gray-300">Total a Pagar en USD:</span>
                  <span className="text-base font-black text-pink-400">{formatUSD(finalTotalUSD)} USD</span>
                </div>
                <div className="flex justify-between items-baseline">
                  <span className="text-xs font-bold text-gray-300">Equivalente Tasa BCV:</span>
                  <span className="text-sm font-black text-emerald-400">{formatBS(finalTotalUSD)}</span>
                </div>
              </div>
            </div>

            {/* Botón de Enviar Pedido a WhatsApp */}
            <button 
              onClick={handleSendToWhatsApp}
              className="w-full py-3.5 px-4 bg-[#22C55E] hover:bg-[#16A34A] active:scale-[0.98] text-white text-xs sm:text-sm font-black rounded-2xl shadow-[0_0_20px_rgba(34,197,94,0.4)] transition-all flex items-center justify-center gap-2 cursor-pointer border border-green-400/40"
            >
              <MessageCircle className="w-5 h-5" />
              <span>Enviar Pedido por WhatsApp</span>
            </button>

            <p className="text-[9px] text-center text-gray-500">
              🔒 Comunicación directa y personalizada con una asesora de Mundo Moda Shop.
            </p>
          </div>
        )}

      </div>
    </div>
  );
};
