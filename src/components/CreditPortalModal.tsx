import React, { useState } from 'react';
import { useStore } from '../context/StoreContext';
import { 
  X, 
  CreditCard, 
  DollarSign, 
  Calendar, 
  CheckCircle2, 
  Clock, 
  MessageCircle, 
  LogOut, 
  Building2, 
  Smartphone,
  ShieldCheck
} from 'lucide-react';

export const CreditPortalModal: React.FC = () => {
  const { 
    isCreditPortalOpen, 
    setIsCreditPortalOpen, 
    unlockedClient, 
    logoutCreditPortal,
    lookupClientByCedulaOrPhone,
    bcvRate,
    formatUSD,
    formatBS,
    paymentConfig
  } = useStore();

  const [lookupInput, setLookupInput] = useState('');
  const [lookupError, setLookupError] = useState('');
  const [abonoReportAmount, setAbonoReportAmount] = useState('');
  const [abonoReportMethod, setAbonoReportMethod] = useState('Pago Móvil');
  const [abonoReportRef, setAbonoReportRef] = useState('');

  if (!isCreditPortalOpen) return null;

  const handleLookupSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!lookupInput.trim()) return;
    const found = lookupClientByCedulaOrPhone(lookupInput);
    if (!found) {
      setLookupError('No encontramos una cuenta con esa cédula o teléfono. Puedes registrarte al realizar tu pedido.');
    } else {
      setLookupError('');
    }
  };

  // If client is not unlocked yet, render lookup form modal
  if (!unlockedClient) {
    return (
      <div className="fixed inset-0 z-50 overflow-y-auto bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4">
        <div className="relative w-full max-w-md bg-[#0F0F17] border border-pink-500/40 rounded-3xl text-white shadow-2xl p-5 sm:p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-pink-500/20 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-2xl bg-pink-500/20 text-pink-400 flex items-center justify-center text-xl">
                💳
              </div>
              <div>
                <h3 className="text-base font-black text-white">Consultar Mi Cuenta</h3>
                <p className="text-[11px] text-pink-400 font-bold">Mundo Moda Shop</p>
              </div>
            </div>
            <button
              onClick={() => setIsCreditPortalOpen(false)}
              className="p-1.5 text-gray-400 hover:text-white rounded-xl hover:bg-white/10"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <p className="text-xs text-gray-300">
            Ingresa tu número de <b>Cédula</b> o <b>Teléfono</b> para consultar tus compras a crédito, saldo pendiente y pagos registrados.
          </p>

          <form onSubmit={handleLookupSubmit} className="space-y-3">
            <div>
              <label className="block text-xs font-bold text-gray-300 mb-1">
                Número de Cédula o Teléfono:
              </label>
              <input
                type="text"
                value={lookupInput}
                onChange={(e) => {
                  setLookupInput(e.target.value);
                  setLookupError('');
                }}
                placeholder="Ej: 24567890 o 04121234567"
                className="w-full bg-[#181826] border border-pink-500/40 rounded-xl px-3.5 py-2.5 text-sm font-bold text-white placeholder-gray-500 focus:outline-none focus:border-pink-500"
                autoFocus
              />
            </div>

            {lookupError && (
              <p className="text-xs text-rose-400 bg-rose-500/10 p-2.5 rounded-xl border border-rose-500/30">
                {lookupError}
              </p>
            )}

            <button
              type="submit"
              className="w-full py-3 bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-500 hover:to-rose-500 text-white text-xs font-black rounded-xl shadow-lg transition-all active:scale-95 cursor-pointer"
            >
              Ver Mi Estado de Cuenta
            </button>
          </form>
        </div>
      </div>
    );
  }


  const totalPaidUSD = unlockedClient.payments.reduce((sum, p) => sum + p.amountUSD, 0);
  const paidPercent = unlockedClient.totalPurchasedUSD > 0
    ? Math.min(100, (totalPaidUSD / unlockedClient.totalPurchasedUSD) * 100)
    : 100;

  const balanceBS = unlockedClient.balanceUSD * bcvRate;

  const handleReportPaymentWhatsApp = (e: React.FormEvent) => {
    e.preventDefault();
    if (!abonoReportAmount) return;

    const amountNum = parseFloat(abonoReportAmount) || 0;
    const amountBS = amountNum * bcvRate;

    const text = encodeURIComponent(
      `👋 *REPORTE DE ABONO A CRÉDITO - MUNDO MODA SHOP*\n` +
      `━━━━━━━━━━━━━━━━━━━━━━\n` +
      `👤 *Cliente:* ${unlockedClient.name}\n` +
      `💳 *Cédula:* ${unlockedClient.idCard}\n` +
      `━━━━━━━━━━━━━━━━━━━━━━\n` +
      `💵 *Monto Abonado:* $${amountNum.toFixed(2)} USD (Bs. ${amountBS.toLocaleString('es-VE', { minimumFractionDigits: 2 })})\n` +
      `🇻🇪 *Tasa BCV del día:* Bs. ${bcvRate.toFixed(2)}\n` +
      `🏦 *Método de Pago:* ${abonoReportMethod}\n` +
      (abonoReportRef ? `🧾 *Referencia:* ${abonoReportRef}\n` : '') +
      `━━━━━━━━━━━━━━━━━━━━━━\n` +
      `📉 *Saldo Restante previo:* $${unlockedClient.balanceUSD.toFixed(2)} USD\n` +
      `✨ *Nuevo Saldo Estimado:* $${Math.max(0, unlockedClient.balanceUSD - amountNum).toFixed(2)} USD\n\n` +
      `Adjunto mi comprobante para que lo registren en mi cuenta de crédito. ¡Muchas gracias!`
    );

    window.open(`https://wa.me/${paymentConfig.whatsappNumber || '584120000000'}?text=${text}`, '_blank');
    setAbonoReportAmount('');
    setAbonoReportRef('');
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4">
      <div className="relative w-full max-w-lg bg-[#0F0F17] border border-amber-500/40 rounded-3xl text-white shadow-[0_0_40px_rgba(245,158,11,0.2)] overflow-hidden">
        
        {/* Header con estilo exclusivo dorado / VIP */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-amber-600/30 via-[#161624] to-pink-600/30 border-b border-amber-500/30 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-500/50 flex items-center justify-center text-amber-400 text-lg shadow-md">
              💳
            </div>
            <div>
              <span className="text-[10px] font-black uppercase tracking-widest text-amber-400 block">
                PORTAL EXCLUSIVO DE CRÉDITO
              </span>
              <h3 className="text-base sm:text-lg font-black text-white">
                {unlockedClient.name}
              </h3>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={logoutCreditPortal}
              className="p-2 text-gray-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-xl transition-colors cursor-pointer"
              title="Cerrar sesión de crédito"
            >
              <LogOut className="w-4 h-4" />
            </button>
            <button
              onClick={() => setIsCreditPortalOpen(false)}
              className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-xl transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Contenido del Estado de Cuenta */}
        <div className="p-4 sm:p-6 space-y-4 max-h-[75vh] overflow-y-auto">
          
          {/* Card Resumen del Saldo */}
          <div className="bg-gradient-to-br from-[#1C1C2E] to-[#12121E] border border-amber-500/30 rounded-2xl p-4 space-y-3">
            <div className="flex justify-between items-start">
              <div>
                <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block">
                  Saldo Pendiente Actual
                </span>
                <div className="text-2xl sm:text-3xl font-black text-amber-400 tracking-tight mt-0.5">
                  {formatUSD(unlockedClient.balanceUSD)} <span className="text-xs text-white">USD</span>
                </div>
                <div className="text-xs sm:text-sm font-bold text-emerald-400 mt-0.5">
                  Bs. {balanceBS.toLocaleString('es-VE', { minimumFractionDigits: 2 })} (Tasa BCV: Bs. {bcvRate.toFixed(2)})
                </div>
              </div>

              <div className="text-right">
                <span className="text-[11px] font-bold text-gray-300 block">Cédula: {unlockedClient.idCard}</span>
                <span className="text-[10px] text-emerald-400 font-semibold block">Cuenta Activa</span>
              </div>
            </div>

            {/* Barra de progreso de abonos */}
            <div className="space-y-1 pt-1">
              <div className="flex justify-between text-[11px] font-bold">
                <span className="text-gray-400">Total Comprado: {formatUSD(unlockedClient.totalPurchasedUSD)}</span>
                <span className="text-emerald-400">Abonado: {formatUSD(totalPaidUSD)} ({paidPercent.toFixed(0)}%)</span>
              </div>
              <div className="w-full h-2 bg-black/60 rounded-full overflow-hidden p-0.5 border border-white/5">
                <div 
                  className="h-full bg-gradient-to-r from-amber-500 to-emerald-400 rounded-full transition-all duration-700" 
                  style={{ width: `${paidPercent}%` }}
                />
              </div>
            </div>
          </div>

          {/* Historial de Abonos / Pagos */}
          <div className="space-y-2">
            <h4 className="text-xs font-black uppercase text-pink-300 tracking-wider flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Historial de Abonos Realizados:
            </h4>

            {unlockedClient.payments.length === 0 ? (
              <div className="bg-[#151522] p-4 rounded-xl text-center text-xs text-gray-400 border border-white/5">
                Aún no has registrado abonos a esta cuenta.
              </div>
            ) : (
              <div className="space-y-2">
                {unlockedClient.payments.map((payment) => (
                  <div 
                    key={payment.id} 
                    className="bg-[#151522] border border-white/5 p-3 rounded-xl flex items-center justify-between"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-black text-emerald-400">
                          +{formatUSD(payment.amountUSD)} USD
                        </span>
                        <span className="text-[10px] text-gray-400">
                          (Bs. {payment.amountBS ? payment.amountBS.toLocaleString('es-VE', { minimumFractionDigits: 2 }) : (payment.amountUSD * (payment.rateBCV || bcvRate)).toFixed(2)})
                        </span>
                      </div>
                      <div className="text-[10px] text-gray-400 mt-0.5 flex items-center gap-2">
                        <span>{payment.date}</span>
                        <span>•</span>
                        <span>{payment.method}</span>
                        {payment.reference && <span>• {payment.reference}</span>}
                      </div>
                    </div>

                    <div className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-xs">
                      ✓
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Reportar Nuevo Abono por WhatsApp */}
          <div className="bg-[#151522] border border-pink-500/20 rounded-2xl p-4 space-y-3">
            <h4 className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-1.5">
              <Smartphone className="w-3.5 h-3.5 text-pink-400" /> Reportar Nuevo Abono a la Tienda:
            </h4>

            <form onSubmit={handleReportPaymentWhatsApp} className="space-y-2.5">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 mb-1">Monto en $ USD:</label>
                  <input 
                    type="number" 
                    step="0.01"
                    value={abonoReportAmount}
                    onChange={(e) => setAbonoReportAmount(e.target.value)}
                    placeholder="Ej: 15.00" 
                    className="w-full bg-[#1A1A28] border border-white/10 rounded-xl px-3 py-2 text-xs font-bold text-white focus:outline-none focus:border-pink-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-gray-400 mb-1">Método Usado:</label>
                  <select 
                    value={abonoReportMethod}
                    onChange={(e) => setAbonoReportMethod(e.target.value)}
                    className="w-full bg-[#1A1A28] border border-white/10 rounded-xl px-2.5 py-2 text-xs font-bold text-white focus:outline-none focus:border-pink-500"
                  >
                    <option value="Pago Móvil">Pago Móvil</option>
                    <option value="Transferencia Bancaria">Transferencia Bancaria</option>
                    <option value="Dólares en Efectivo">Dólares en Efectivo</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-gray-400 mb-1">Número de Referencia (si aplica):</label>
                <input 
                  type="text" 
                  value={abonoReportRef}
                  onChange={(e) => setAbonoReportRef(e.target.value)}
                  placeholder="Ej: Ref 849201" 
                  className="w-full bg-[#1A1A28] border border-white/10 rounded-xl px-3 py-2 text-xs font-bold text-white focus:outline-none focus:border-pink-500"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 px-4 bg-[#22C55E] hover:bg-[#16A34A] text-white text-xs font-black rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <MessageCircle className="w-4 h-4" />
                <span>Enviar Comprobante por WhatsApp</span>
              </button>
            </form>
          </div>

        </div>

      </div>
    </div>
  );
};
