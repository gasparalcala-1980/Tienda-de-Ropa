import React, { useState, useMemo } from 'react';
import { useStore } from '../context/StoreContext';
import { CreditClient, Product } from '../types';
import { exportCashFlowAndSalesToExcel } from '../utils/excelExport';
import {
  DollarSign,
  TrendingUp,
  CreditCard,
  ShoppingBag,
  FileSpreadsheet,
  Plus,
  Search,
  CheckCircle2,
  AlertCircle,
  Calendar,
  Wallet,
  ArrowDownLeft,
  ArrowUpRight,
  Layers,
  Sparkles,
  Users,
  Smartphone,
  Banknote,
  Receipt,
  X,
  Clock
} from 'lucide-react';

interface CashFlowAndSalesTabProps {
  onGoToCredits?: () => void;
}

export const CashFlowAndSalesTab: React.FC<CashFlowAndSalesTabProps> = ({ onGoToCredits }) => {
  const {
    creditClients,
    products,
    bcvRate,
    registerOrderSale,
    formatUSD,
    formatBS
  } = useStore();

  // Excel export state
  const [isExporting, setIsExporting] = useState(false);
  const [exportNotice, setExportNotice] = useState<string | null>(null);

  // Time filter: 'today' | 'week' | 'month' | 'all'
  const [timeFilter, setTimeFilter] = useState<'today' | 'week' | 'month' | 'all'>('all');

  // Sub-view: 'sales' | 'cash_inflow'
  const [subView, setSubView] = useState<'sales' | 'cash_inflow'>('sales');

  // Type filter for sales: 'all' | 'credito' | 'contado'
  const [typeFilter, setTypeFilter] = useState<'all' | 'credito' | 'contado'>('all');

  // Search filter
  const [searchTerm, setSearchTerm] = useState('');

  // New Sale Modal / Form state
  const [showNewSaleModal, setShowNewSaleModal] = useState(false);
  const [saleMode, setSaleMode] = useState<'credito' | 'contado'>('credito'); // Default to credit as majority!
  const [clientType, setClientType] = useState<'existing' | 'new'>('existing');
  const [selectedClientId, setSelectedClientId] = useState('');
  
  // New client fields
  const [newClientName, setNewClientName] = useState('');
  const [newClientIdCard, setNewClientIdCard] = useState('');
  const [newClientPhone, setNewClientPhone] = useState('');

  // Item description & pricing
  const [saleDescription, setSaleDescription] = useState('');
  const [saleAmountUSD, setSaleAmountUSD] = useState<number | ''>('');
  
  // Initial payment / payment details
  const [initialAbonoUSD, setInitialAbonoUSD] = useState<number | ''>('');
  const [paymentMethod, setPaymentMethod] = useState<string>('Efectivo en Dólares ($)');
  const [paymentReference, setPaymentReference] = useState('');
  const [saleSuccessNotice, setSaleSuccessNotice] = useState<string | null>(null);
  const [formError, setFormError] = useState('');

  // Date filtering helper
  const isWithinPeriod = (dateStr: string) => {
    if (timeFilter === 'all') return true;
    const itemDate = new Date(dateStr + 'T00:00:00');
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];

    if (timeFilter === 'today') {
      return dateStr === todayStr;
    }

    if (timeFilter === 'week') {
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(now.getDate() - 7);
      return itemDate >= oneWeekAgo && itemDate <= now;
    }

    if (timeFilter === 'month') {
      const currentMonth = now.getMonth();
      const currentYear = now.getFullYear();
      return itemDate.getMonth() === currentMonth && itemDate.getFullYear() === currentYear;
    }

    return true;
  };

  // Flatten all sales (purchases)
  const allSales = useMemo(() => {
    const list: Array<{
      id: string;
      date: string;
      clientId: string;
      clientName: string;
      clientPhone: string;
      clientIdCard: string;
      saleType: 'credito' | 'contado';
      description: string;
      amountUSD: number;
      amountBS: number;
      clientBalanceUSD: number;
    }> = [];

    creditClients.forEach(c => {
      (c.purchases || []).forEach(p => {
        list.push({
          id: p.id,
          date: p.date,
          clientId: c.id,
          clientName: c.name,
          clientPhone: c.phone,
          clientIdCard: c.idCard,
          saleType: c.saleType || 'credito',
          description: p.description,
          amountUSD: p.amountUSD,
          amountBS: p.amountUSD * bcvRate,
          clientBalanceUSD: c.balanceUSD
        });
      });
    });

    return list.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [creditClients, bcvRate]);

  // Flatten all cash entries (payments)
  const allInflows = useMemo(() => {
    const list: Array<{
      id: string;
      date: string;
      clientId: string;
      clientName: string;
      clientIdCard: string;
      type: 'abono_credito' | 'pago_contado';
      method: string;
      amountUSD: number;
      amountBS: number;
      rateBCV: number;
      reference: string;
      notes: string;
    }> = [];

    creditClients.forEach(c => {
      (c.payments || []).forEach(pm => {
        const isContado = (pm.notes && pm.notes.toLowerCase().includes('contado')) ||
                          (pm.reference && pm.reference.toLowerCase().includes('contado'));
        list.push({
          id: pm.id,
          date: pm.date,
          clientId: c.id,
          clientName: c.name,
          clientIdCard: c.idCard,
          type: isContado ? 'pago_contado' : 'abono_credito',
          method: pm.method || 'Efectivo',
          amountUSD: pm.amountUSD,
          amountBS: pm.amountBS || pm.amountUSD * (pm.rateBCV || bcvRate),
          rateBCV: pm.rateBCV || bcvRate,
          reference: pm.reference || '-',
          notes: pm.notes || ''
        });
      });
    });

    return list.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [creditClients, bcvRate]);

  // Filtered sales based on time and type and search
  const filteredSales = useMemo(() => {
    return allSales.filter(s => {
      if (!isWithinPeriod(s.date)) return false;
      if (typeFilter !== 'all' && s.saleType !== typeFilter) return false;
      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase();
        return (
          s.clientName.toLowerCase().includes(term) ||
          s.clientIdCard.toLowerCase().includes(term) ||
          s.description.toLowerCase().includes(term)
        );
      }
      return true;
    });
  }, [allSales, timeFilter, typeFilter, searchTerm]);

  // Filtered inflows based on time and search
  const filteredInflows = useMemo(() => {
    return allInflows.filter(inf => {
      if (!isWithinPeriod(inf.date)) return false;
      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase();
        return (
          inf.clientName.toLowerCase().includes(term) ||
          inf.clientIdCard.toLowerCase().includes(term) ||
          inf.method.toLowerCase().includes(term) ||
          inf.reference.toLowerCase().includes(term)
        );
      }
      return true;
    });
  }, [allInflows, timeFilter, searchTerm]);

  // Financial calculations for the selected period
  const periodSales = useMemo(() => allSales.filter(s => isWithinPeriod(s.date)), [allSales, timeFilter]);
  const periodInflows = useMemo(() => allInflows.filter(inf => isWithinPeriod(inf.date)), [allInflows, timeFilter]);

  // Total sales committed ($ and Bs)
  const totalPeriodSalesUSD = periodSales.reduce((acc, s) => acc + s.amountUSD, 0);
  const salesCredito = periodSales.filter(s => s.saleType === 'credito');
  const totalCreditoUSD = salesCredito.reduce((acc, s) => acc + s.amountUSD, 0);
  const salesContado = periodSales.filter(s => s.saleType === 'contado');
  const totalContadoUSD = salesContado.reduce((acc, s) => acc + s.amountUSD, 0);

  // Total real cash collected in register ($ and Bs)
  const totalInflowsUSD = periodInflows.reduce((acc, inf) => acc + inf.amountUSD, 0);
  const totalInflowsBS = periodInflows.reduce((acc, inf) => acc + inf.amountBS, 0);

  // Cash breakdown by source: Abonos vs Contado
  const abonosCreditoUSD = periodInflows.filter(i => i.type === 'abono_credito').reduce((acc, i) => acc + i.amountUSD, 0);
  const pagosContadoUSD = periodInflows.filter(i => i.type === 'pago_contado').reduce((acc, i) => acc + i.amountUSD, 0);

  // Cash breakdown by payment instrument
  const efectivoUSD = periodInflows
    .filter(i => i.method.toLowerCase().includes('efectivo') || i.method.toLowerCase().includes('dolar') || i.method.toLowerCase().includes('cash'))
    .reduce((acc, i) => acc + i.amountUSD, 0);

  const pagoMovilBS = periodInflows
    .filter(i => i.method.toLowerCase().includes('movil') || i.method.toLowerCase().includes('móvil'))
    .reduce((acc, i) => acc + i.amountBS, 0);

  const transferenciasUSD = periodInflows
    .filter(i => i.method.toLowerCase().includes('transf') || i.method.toLowerCase().includes('zelle'))
    .reduce((acc, i) => acc + i.amountUSD, 0);

  // Handler for Excel export
  const handleExportExcel = async () => {
    try {
      setIsExporting(true);
      setExportNotice(null);
      await exportCashFlowAndSalesToExcel(creditClients, bcvRate);
      setExportNotice('✅ Reporte de Caja, Entradas de Dinero y Ventas exportado a Excel con éxito.');
      setTimeout(() => setExportNotice(null), 5000);
    } catch (err) {
      console.error('Error al exportar reporte de caja a Excel:', err);
      setExportNotice('❌ Ocurrió un error al generar el archivo Excel de caja.');
    } finally {
      setIsExporting(false);
    }
  };

  // Handler to register a new sale
  const handleSubmitNewSale = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    const amountNum = Number(saleAmountUSD);
    if (!amountNum || amountNum <= 0) {
      setFormError('Por favor ingresa un monto válido de venta en USD ($).');
      return;
    }

    if (!saleDescription.trim()) {
      setFormError('Por favor indica qué prenda(s) o artículo(s) se vendieron.');
      return;
    }

    let clientName = '';
    let clientCedula = '';
    let clientPhone = '';

    if (clientType === 'existing') {
      if (!selectedClientId) {
        setFormError('Por favor selecciona un cliente existente de la lista.');
        return;
      }
      const existing = creditClients.find(c => c.id === selectedClientId);
      if (!existing) {
        setFormError('Cliente no encontrado.');
        return;
      }
      clientName = existing.name;
      clientCedula = existing.idCard;
      clientPhone = existing.phone;
    } else {
      if (!newClientName.trim()) {
        setFormError('Por favor ingresa el nombre y apellido del cliente.');
        return;
      }
      if (!newClientIdCard.trim()) {
        setFormError('Por favor ingresa el número de cédula del cliente.');
        return;
      }
      clientName = newClientName.trim();
      clientCedula = newClientIdCard.trim();
      clientPhone = newClientPhone.trim() || 'Sin teléfono';
    }

    const isCredit = saleMode === 'credito';
    const abonoNum = isCredit ? Math.max(0, Number(initialAbonoUSD) || 0) : amountNum;

    try {
      registerOrderSale({
        clientName,
        clientCedula,
        clientPhone,
        isCredit,
        initialAbonoUSD: abonoNum,
        itemsSummary: saleDescription.trim(),
        totalUSD: amountNum,
        paymentMethod: abonoNum > 0 ? paymentMethod : 'Sin abono inicial',
        reference: paymentReference.trim() || (isCredit ? (abonoNum > 0 ? 'Abono Inicial' : 'Sin abono inicial') : 'Pago de Contado')
      });

      setSaleSuccessNotice(
        isCredit 
          ? `✅ Venta a Crédito de $${amountNum.toFixed(2)} registrada con éxito para ${clientName}.`
          : `✅ Venta de Contado de $${amountNum.toFixed(2)} registrada y cobrada con éxito.`
      );
      setTimeout(() => setSaleSuccessNotice(null), 6000);

      // Reset form
      setShowNewSaleModal(false);
      setSaleDescription('');
      setSaleAmountUSD('');
      setInitialAbonoUSD('');
      setPaymentReference('');
      setNewClientName('');
      setNewClientIdCard('');
      setNewClientPhone('');
      setSelectedClientId('');
    } catch (err) {
      console.error('Error registering sale:', err);
      setFormError('Error al guardar la venta en el sistema.');
    }
  };

  return (
    <div className="space-y-4">
      
      {/* Header & Main Actions */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-black uppercase tracking-widest text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-md border border-amber-500/20">
              LIBRO CONTABLE Y CUADRE
            </span>
            <span className="text-[10px] font-bold text-gray-400">
              Tasa: <strong className="text-white">Bs. {bcvRate.toFixed(2)}</strong>
            </span>
          </div>
          <h4 className="text-base sm:text-lg font-black text-white flex items-center gap-2 mt-0.5">
            <TrendingUp className="w-5 h-5 text-amber-400" />
            Caja, Ventas & Flujo de Dinero
          </h4>
          <p className="text-xs text-gray-400">
            Control de ventas (a crédito y contado) y arqueo real de entradas en efectivo, pago móvil y transferencias.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
          <button
            type="button"
            onClick={handleExportExcel}
            disabled={isExporting || creditClients.length === 0}
            className="px-3.5 py-2 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 border border-emerald-500/40 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 shadow-sm cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
            title="Descargar archivo Excel con el reporte oficial de ventas, arqueo de caja y entradas de dinero"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
            <span>{isExporting ? 'Generando...' : 'Descargar Excel de Caja'}</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setShowNewSaleModal(true);
              setFormError('');
            }}
            className="px-3.5 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black text-xs font-black rounded-xl transition-all shadow-lg flex items-center justify-center gap-1.5 cursor-pointer shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>+ Registrar Venta</span>
          </button>
        </div>
      </div>

      {/* Notices */}
      {exportNotice && (
        <div className="p-3 bg-emerald-500/10 border border-emerald-500/40 rounded-xl flex items-center justify-between text-emerald-300 text-xs font-bold animate-fadeIn shadow-md">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{exportNotice}</span>
          </div>
          <button type="button" onClick={() => setExportNotice(null)} className="p-1 text-emerald-400 cursor-pointer">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {saleSuccessNotice && (
        <div className="p-3 bg-amber-500/15 border border-amber-500/40 rounded-xl flex items-center justify-between text-amber-200 text-xs font-bold animate-fadeIn shadow-md">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
            <span>{saleSuccessNotice}</span>
          </div>
          <button type="button" onClick={() => setSaleSuccessNotice(null)} className="p-1 text-amber-400 cursor-pointer">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Selector de Período de Tiempo */}
      <div className="flex items-center justify-between bg-[#12121e] p-2 rounded-2xl border border-white/5 flex-wrap gap-2">
        <div className="flex items-center gap-1 text-xs text-gray-400">
          <Calendar className="w-3.5 h-3.5 text-pink-400 ml-1" />
          <span className="font-bold">Período de Análisis:</span>
        </div>
        <div className="flex items-center gap-1 bg-[#181828] p-1 rounded-xl border border-white/5">
          <button
            type="button"
            onClick={() => setTimeFilter('today')}
            className={`px-3 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer ${
              timeFilter === 'today'
                ? 'bg-amber-500 text-black shadow-md'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Hoy
          </button>
          <button
            type="button"
            onClick={() => setTimeFilter('week')}
            className={`px-3 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer ${
              timeFilter === 'week'
                ? 'bg-amber-500 text-black shadow-md'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Últimos 7 días
          </button>
          <button
            type="button"
            onClick={() => setTimeFilter('month')}
            className={`px-3 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer ${
              timeFilter === 'month'
                ? 'bg-amber-500 text-black shadow-md'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Este Mes
          </button>
          <button
            type="button"
            onClick={() => setTimeFilter('all')}
            className={`px-3 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer ${
              timeFilter === 'all'
                ? 'bg-amber-500 text-black shadow-md'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Histórico Total
          </button>
        </div>
      </div>

      {/* METRIC CARDS: 2 Column Hero (Ventas Totales vs Dinero Real en Mano/Banco) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
        
        {/* Card 1: TOTAL VENTAS (Enfoque en la Mayoría a Crédito) */}
        <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-[#1b1b2f] to-[#141424] border border-amber-500/25 shadow-lg relative overflow-hidden">
          <div className="absolute -right-6 -top-6 w-24 h-24 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />
          
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-black uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
              <ShoppingBag className="w-3.5 h-3.5 text-amber-400" />
              Mercancía Vendida ({periodSales.length} operaciones)
            </span>
            <span className="text-[10px] text-gray-400 bg-white/5 px-2 py-0.5 rounded-full font-bold">
              {timeFilter === 'today' ? 'Hoy' : timeFilter === 'week' ? '7 días' : timeFilter === 'month' ? 'Este Mes' : 'Todo'}
            </span>
          </div>

          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black text-white">
              {formatUSD(totalPeriodSalesUSD)}
            </span>
            <span className="text-xs sm:text-sm font-bold text-amber-400">
              ≈ {formatBS(totalPeriodSalesUSD * bcvRate)}
            </span>
          </div>

          <p className="text-[11px] text-gray-400 mt-1 mb-3">
            Monto total de prendas entregadas tanto a crédito como de contado.
          </p>

          {/* Desglose: Crédito (Mayoría) vs Contado */}
          <div className="grid grid-cols-2 gap-2 pt-3 border-t border-white/10">
            <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black uppercase text-amber-300 flex items-center gap-1">
                  <CreditCard className="w-3 h-3" />
                  A Crédito (Mayoría)
                </span>
                <span className="text-[10px] font-black text-amber-400 bg-amber-500/20 px-1.5 py-0.2 rounded">
                  {totalPeriodSalesUSD > 0 ? `${Math.round((totalCreditoUSD / totalPeriodSalesUSD) * 100)}%` : '0%'}
                </span>
              </div>
              <div className="text-sm font-black text-white mt-1">
                {formatUSD(totalCreditoUSD)}
              </div>
              <div className="text-[10px] text-amber-200/70 font-semibold">
                {salesCredito.length} ventas a crédito
              </div>
            </div>

            <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black uppercase text-emerald-300 flex items-center gap-1">
                  <Banknote className="w-3 h-3" />
                  De Contado
                </span>
                <span className="text-[10px] font-black text-emerald-400 bg-emerald-500/20 px-1.5 py-0.2 rounded">
                  {totalPeriodSalesUSD > 0 ? `${Math.round((totalContadoUSD / totalPeriodSalesUSD) * 100)}%` : '0%'}
                </span>
              </div>
              <div className="text-sm font-black text-white mt-1">
                {formatUSD(totalContadoUSD)}
              </div>
              <div className="text-[10px] text-emerald-200/70 font-semibold">
                {salesContado.length} ventas de contado
              </div>
            </div>
          </div>
        </div>

        {/* Card 2: DINERO REAL EN CAJA (Entradas Líquidas Efectivo/Pago Móvil) */}
        <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-[#162722] to-[#121c19] border border-emerald-500/30 shadow-lg relative overflow-hidden">
          <div className="absolute -right-6 -top-6 w-24 h-24 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />
          
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-black uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
              <Wallet className="w-3.5 h-3.5 text-emerald-400" />
              Dinero Real Entrado a Caja ({periodInflows.length} cobros)
            </span>
            <span className="text-[10px] text-emerald-300 font-black bg-emerald-500/20 px-2 py-0.5 rounded-full">
              Líquido Recaudado
            </span>
          </div>

          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black text-emerald-300">
              {formatUSD(totalInflowsUSD)}
            </span>
            <span className="text-xs sm:text-sm font-bold text-emerald-400">
              ≈ {formatBS(totalInflowsBS)}
            </span>
          </div>

          <p className="text-[11px] text-gray-400 mt-1 mb-3">
            Plata en mano o cuenta: suma de abonos de crédito + ventas de contado.
          </p>

          {/* Arqueo por instrumento de pago */}
          <div className="grid grid-cols-3 gap-1.5 pt-3 border-t border-white/10 text-center">
            <div className="p-2 rounded-xl bg-black/30 border border-white/5">
              <span className="text-[9px] font-bold text-gray-400 block truncate">Efectivo $</span>
              <span className="text-xs font-black text-white block mt-0.5 truncate">{formatUSD(efectivoUSD)}</span>
            </div>
            <div className="p-2 rounded-xl bg-black/30 border border-white/5">
              <span className="text-[9px] font-bold text-gray-400 block truncate">Pago Móvil Bs</span>
              <span className="text-xs font-black text-emerald-400 block mt-0.5 truncate">{formatBS(pagoMovilBS)}</span>
            </div>
            <div className="p-2 rounded-xl bg-black/30 border border-white/5">
              <span className="text-[9px] font-bold text-gray-400 block truncate">Zelle / Transf</span>
              <span className="text-xs font-black text-cyan-400 block mt-0.5 truncate">{formatUSD(transferenciasUSD)}</span>
            </div>
          </div>

          {/* Origen del dinero líquido */}
          <div className="mt-2.5 flex items-center justify-between text-[10px] text-gray-300 bg-white/5 px-2.5 py-1.5 rounded-xl">
            <span>🔹 Por Abonos a Crédito: <strong className="text-amber-300">{formatUSD(abonosCreditoUSD)}</strong></span>
            <span>🔹 Por Contado: <strong className="text-emerald-300">{formatUSD(pagosContadoUSD)}</strong></span>
          </div>
        </div>
      </div>

      {/* Tabs para alternar entre: LIBRO DE VENTAS vs HISTORIAL DE COBROS/ENTRADAS */}
      <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-2 pt-2">
        <div className="flex items-center gap-1.5 bg-[#141424] p-1 rounded-xl border border-white/10">
          <button
            type="button"
            onClick={() => setSubView('sales')}
            className={`px-3.5 py-1.5 text-xs font-black rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
              subView === 'sales'
                ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-black shadow-md'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <Receipt className="w-3.5 h-3.5" />
            <span>Libro de Ventas ({filteredSales.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setSubView('cash_inflow')}
            className={`px-3.5 py-1.5 text-xs font-black rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
              subView === 'cash_inflow'
                ? 'bg-gradient-to-r from-emerald-500 to-emerald-600 text-black shadow-md'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <Wallet className="w-3.5 h-3.5" />
            <span>Entradas a Caja / Abonos ({filteredInflows.length})</span>
          </button>
        </div>

        {/* Buscador y filtro de tipo de venta */}
        <div className="flex items-center gap-2">
          {subView === 'sales' && (
            <div className="flex items-center gap-1 bg-[#141424] p-0.5 rounded-xl border border-white/10 text-xs">
              <button
                type="button"
                onClick={() => setTypeFilter('all')}
                className={`px-2.5 py-1 rounded-lg font-bold cursor-pointer ${typeFilter === 'all' ? 'bg-white/20 text-white' : 'text-gray-400 hover:text-white'}`}
              >
                Todas
              </button>
              <button
                type="button"
                onClick={() => setTypeFilter('credito')}
                className={`px-2.5 py-1 rounded-lg font-bold cursor-pointer ${typeFilter === 'credito' ? 'bg-amber-500/30 text-amber-300 border border-amber-500/40' : 'text-gray-400 hover:text-white'}`}
              >
                Crédito
              </button>
              <button
                type="button"
                onClick={() => setTypeFilter('contado')}
                className={`px-2.5 py-1 rounded-lg font-bold cursor-pointer ${typeFilter === 'contado' ? 'bg-emerald-500/30 text-emerald-300 border border-emerald-500/40' : 'text-gray-400 hover:text-white'}`}
              >
                Contado
              </button>
            </div>
          )}

          <div className="relative flex-1 sm:w-56">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar cliente, cédula..."
              className="w-full bg-[#141424] border border-white/10 text-xs text-white rounded-xl pl-8 pr-3 py-1.5 focus:outline-none focus:border-amber-500"
            />
            <Search className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-2" />
          </div>
        </div>
      </div>

      {/* VISTA 1: LIBRO DE VENTAS */}
      {subView === 'sales' && (
        <div className="bg-[#141424] border border-white/10 rounded-2xl overflow-hidden shadow-md">
          {filteredSales.length === 0 ? (
            <div className="p-8 text-center space-y-2">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-400 flex items-center justify-center mx-auto text-xl">
                <Receipt className="w-6 h-6" />
              </div>
              <p className="text-sm font-bold text-white">No hay ventas registradas en este período</p>
              <p className="text-xs text-gray-400 max-w-sm mx-auto">
                Registra tu primera venta con el botón <strong className="text-amber-400">+ Registrar Venta</strong> arriba a la derecha.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-white/10 bg-[#10101c] text-gray-400 font-bold uppercase text-[10px] tracking-wider">
                    <th className="py-3 px-3.5">Fecha</th>
                    <th className="py-3 px-3.5">Cliente</th>
                    <th className="py-3 px-3.5">Prenda(s) / Detalle</th>
                    <th className="py-3 px-3.5 text-center">Modalidad</th>
                    <th className="py-3 px-3.5 text-right">Total Venta</th>
                    <th className="py-3 px-3.5 text-right">Saldo Cuenta</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {filteredSales.map((sale) => (
                    <tr key={sale.id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="py-3 px-3.5 font-medium text-gray-300 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <Clock className="w-3 h-3 text-gray-500" />
                          <span>{sale.date}</span>
                        </div>
                      </td>
                      <td className="py-3 px-3.5">
                        <div className="font-bold text-white">{sale.clientName}</div>
                        <div className="text-[10px] text-gray-400">{sale.clientIdCard} • {sale.clientPhone}</div>
                      </td>
                      <td className="py-3 px-3.5 max-w-xs truncate text-gray-200" title={sale.description}>
                        {sale.description}
                      </td>
                      <td className="py-3 px-3.5 text-center whitespace-nowrap">
                        {sale.saleType === 'credito' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-amber-500/15 text-amber-300 border border-amber-500/30">
                            <CreditCard className="w-3 h-3" />
                            A CRÉDITO
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                            <CheckCircle2 className="w-3 h-3" />
                            DE CONTADO
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-3.5 text-right whitespace-nowrap">
                        <div className="font-black text-white">{formatUSD(sale.amountUSD)}</div>
                        <div className="text-[10px] text-gray-400 font-bold">{formatBS(sale.amountBS)}</div>
                      </td>
                      <td className="py-3 px-3.5 text-right whitespace-nowrap">
                        {sale.clientBalanceUSD > 0 ? (
                          <div>
                            <span className="font-black text-rose-400">{formatUSD(sale.clientBalanceUSD)}</span>
                            <span className="text-[9px] text-rose-400/80 block">deuda activa</span>
                          </div>
                        ) : (
                          <span className="text-emerald-400 font-bold text-[11px]">Al día ($0)</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* VISTA 2: HISTORIAL DE ENTRADAS DE DINERO / ARQUEO */}
      {subView === 'cash_inflow' && (
        <div className="bg-[#141424] border border-white/10 rounded-2xl overflow-hidden shadow-md">
          {filteredInflows.length === 0 ? (
            <div className="p-8 text-center space-y-2">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center mx-auto text-xl">
                <Wallet className="w-6 h-6" />
              </div>
              <p className="text-sm font-bold text-white">No hay entradas de dinero en este período</p>
              <p className="text-xs text-gray-400 max-w-sm mx-auto">
                Los cobros de abonos a crédito y pagos de contado aparecerán aquí detallados con su método y referencia.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-white/10 bg-[#10101c] text-gray-400 font-bold uppercase text-[10px] tracking-wider">
                    <th className="py-3 px-3.5">Fecha</th>
                    <th className="py-3 px-3.5">Cliente</th>
                    <th className="py-3 px-3.5 text-center">Tipo de Entrada</th>
                    <th className="py-3 px-3.5">Método de Pago</th>
                    <th className="py-3 px-3.5">Referencia / Nota</th>
                    <th className="py-3 px-3.5 text-right">Monto Recibido</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {filteredInflows.map((inf) => (
                    <tr key={inf.id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="py-3 px-3.5 font-medium text-gray-300 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <Clock className="w-3 h-3 text-gray-500" />
                          <span>{inf.date}</span>
                        </div>
                      </td>
                      <td className="py-3 px-3.5">
                        <div className="font-bold text-white">{inf.clientName}</div>
                        <div className="text-[10px] text-gray-400">{inf.clientIdCard}</div>
                      </td>
                      <td className="py-3 px-3.5 text-center whitespace-nowrap">
                        {inf.type === 'abono_credito' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-blue-500/15 text-blue-300 border border-blue-500/30">
                            <ArrowDownLeft className="w-3 h-3" />
                            Abono a Crédito
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                            <CheckCircle2 className="w-3 h-3" />
                            Venta de Contado
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-3.5 whitespace-nowrap">
                        <span className="font-semibold text-gray-200">{inf.method}</span>
                      </td>
                      <td className="py-3 px-3.5 max-w-xs truncate text-gray-400">
                        <span className="font-mono text-xs text-gray-300">{inf.reference}</span>
                        {inf.notes && <span className="block text-[10px] text-gray-500">{inf.notes}</span>}
                      </td>
                      <td className="py-3 px-3.5 text-right whitespace-nowrap">
                        <div className="font-black text-emerald-400">{formatUSD(inf.amountUSD)}</div>
                        <div className="text-[10px] text-gray-400 font-bold">{formatBS(inf.amountBS)}</div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL REGISTRAR NUEVA VENTA (CRÉDITO O CONTADO)          */}
      {/* ========================================================= */}
      {showNewSaleModal && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-3 animate-fadeIn">
          <div className="bg-[#181828] border border-amber-500/30 rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl flex flex-col max-h-[92vh]">
            
            {/* Header Modal */}
            <div className="p-4 bg-[#141420] border-b border-amber-500/20 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-400 flex items-center justify-center font-black shadow-md">
                  <Plus className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-black text-white">Registrar Nueva Venta</h4>
                  <p className="text-[11px] text-gray-400">Elige si es a crédito o de contado y asigna las prendas</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowNewSaleModal(false)}
                className="p-1.5 text-gray-400 hover:text-white rounded-xl hover:bg-white/10 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Body Modal Form */}
            <form onSubmit={handleSubmitNewSale} className="p-4 sm:p-5 space-y-4 overflow-y-auto flex-1">
              
              {formError && (
                <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-300 text-xs font-bold flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                  <span>{formError}</span>
                </div>
              )}

              {/* 1. SELECCIÓN DE MODALIDAD (CRÉDITO COMO PRIMERA OPCIÓN) */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-black uppercase text-gray-300 block">
                  1. Modalidad de Venta
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setSaleMode('credito');
                      setInitialAbonoUSD('');
                    }}
                    className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                      saleMode === 'credito'
                        ? 'bg-amber-500/15 border-amber-500 text-white shadow-lg ring-1 ring-amber-500/50'
                        : 'bg-white/5 border-white/10 text-gray-400 hover:bg-white/10'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-black text-amber-400 flex items-center gap-1.5">
                        <CreditCard className="w-4 h-4" />
                        A Crédito
                      </span>
                      <span className="text-[9px] bg-amber-500/20 text-amber-300 px-1.5 py-0.5 rounded font-black uppercase">
                        Mayoría
                      </span>
                    </div>
                    <p className="text-[10px] text-gray-300">
                      Cliente paga por partes / cuotas. Puede dejar abono inicial o $0.
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setSaleMode('contado');
                      setInitialAbonoUSD('');
                    }}
                    className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                      saleMode === 'contado'
                        ? 'bg-emerald-500/15 border-emerald-500 text-white shadow-lg ring-1 ring-emerald-500/50'
                        : 'bg-white/5 border-white/10 text-gray-400 hover:bg-white/10'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-black text-emerald-400 flex items-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4" />
                        De Contado
                      </span>
                      <span className="text-[9px] bg-emerald-500/20 text-emerald-300 px-1.5 py-0.5 rounded font-black uppercase">
                        100% Pago
                      </span>
                    </div>
                    <p className="text-[10px] text-gray-300">
                      Cancela la totalidad hoy. No genera deuda pendiente en la calle.
                    </p>
                  </button>
                </div>
              </div>

              {/* 2. DATOS DEL CLIENTE */}
              <div className="space-y-2 p-3 rounded-2xl bg-white/[0.03] border border-white/10">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-black uppercase text-gray-300 flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5 text-pink-400" />
                    2. Cliente
                  </label>
                  <div className="flex items-center gap-2 text-xs">
                    <button
                      type="button"
                      onClick={() => setClientType('existing')}
                      className={`text-[11px] font-bold pb-0.5 cursor-pointer ${clientType === 'existing' ? 'text-pink-400 border-b-2 border-pink-500' : 'text-gray-400'}`}
                    >
                      Cliente Existente
                    </button>
                    <button
                      type="button"
                      onClick={() => setClientType('new')}
                      className={`text-[11px] font-bold pb-0.5 cursor-pointer ${clientType === 'new' ? 'text-pink-400 border-b-2 border-pink-500' : 'text-gray-400'}`}
                    >
                      + Nuevo Cliente
                    </button>
                  </div>
                </div>

                {clientType === 'existing' ? (
                  <div>
                    <select
                      value={selectedClientId}
                      onChange={(e) => setSelectedClientId(e.target.value)}
                      className="w-full bg-[#12121e] border border-white/15 text-xs text-white rounded-xl p-2.5 focus:outline-none focus:border-amber-500"
                    >
                      <option value="">-- Selecciona un cliente registrado ({creditClients.length}) --</option>
                      {creditClients.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name} ({c.idCard}) - Saldo pendiente: ${c.balanceUSD.toFixed(2)}
                        </option>
                      ))}
                    </select>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <input
                      type="text"
                      value={newClientName}
                      onChange={(e) => setNewClientName(e.target.value)}
                      placeholder="Nombre y Apellido del cliente *"
                      className="w-full bg-[#12121e] border border-white/15 text-xs text-white rounded-xl p-2.5 focus:outline-none focus:border-amber-500"
                    />
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="text"
                        value={newClientIdCard}
                        onChange={(e) => setNewClientIdCard(e.target.value)}
                        placeholder="Cédula (ej. V-18456789) *"
                        className="w-full bg-[#12121e] border border-white/15 text-xs text-white rounded-xl p-2.5 focus:outline-none focus:border-amber-500"
                      />
                      <input
                        type="text"
                        value={newClientPhone}
                        onChange={(e) => setNewClientPhone(e.target.value)}
                        placeholder="Teléfono (0414-0000000)"
                        className="w-full bg-[#12121e] border border-white/15 text-xs text-white rounded-xl p-2.5 focus:outline-none focus:border-amber-500"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* 3. PRENDAS / DESCRIPCIÓN Y MONTO */}
              <div className="space-y-2 p-3 rounded-2xl bg-white/[0.03] border border-white/10">
                <label className="text-[11px] font-black uppercase text-gray-300 block">
                  3. Prendas Vendidas & Monto Total ($ USD)
                </label>

                {/* Accesos rápidos de prendas del catálogo */}
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-[10px]">
                  <span className="text-gray-400 font-bold shrink-0">Catálogo rápido:</span>
                  {products.slice(0, 5).map((prod) => (
                    <button
                      key={prod.id}
                      type="button"
                      onClick={() => {
                        const newDesc = saleDescription ? `${saleDescription}, 1 ${prod.name}` : `1 ${prod.name}`;
                        setSaleDescription(newDesc);
                        setSaleAmountUSD((prev) => (Number(prev) || 0) + prod.priceUSD);
                      }}
                      className="px-2 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-gray-200 border border-white/10 shrink-0 font-medium cursor-pointer"
                    >
                      + {prod.name} (${prod.priceUSD})
                    </button>
                  ))}
                </div>

                <textarea
                  value={saleDescription}
                  onChange={(e) => setSaleDescription(e.target.value)}
                  placeholder="Detalle de prendas: ej. 2 Jeans Levanta Cola Talla 30, 1 Camisa Oversize..."
                  rows={2}
                  className="w-full bg-[#12121e] border border-white/15 text-xs text-white rounded-xl p-2.5 focus:outline-none focus:border-amber-500"
                />

                <div className="grid grid-cols-2 gap-2 items-center">
                  <div>
                    <label className="text-[10px] text-gray-400 block mb-1 font-bold">Total Venta en Dólares ($) *</label>
                    <div className="relative">
                      <input
                        type="number"
                        step="0.01"
                        value={saleAmountUSD}
                        onChange={(e) => setSaleAmountUSD(e.target.value === '' ? '' : Number(e.target.value))}
                        placeholder="0.00"
                        className="w-full bg-[#12121e] border border-white/15 text-base font-black text-white rounded-xl pl-7 pr-3 py-2 focus:outline-none focus:border-amber-500"
                      />
                      <DollarSign className="w-4 h-4 text-amber-400 absolute left-2 top-3" />
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] text-gray-400 block mb-1 font-bold">Equivalente BCV (Bs.)</label>
                    <div className="p-2 bg-black/40 border border-white/10 rounded-xl text-right">
                      <span className="text-xs font-black text-amber-400">
                        {formatBS((Number(saleAmountUSD) || 0) * bcvRate)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* 4. CONDICIONES DE PAGO / ABONO INICIAL */}
              <div className="space-y-2 p-3 rounded-2xl bg-white/[0.03] border border-white/10">
                <label className="text-[11px] font-black uppercase text-gray-300 block">
                  4. {saleMode === 'credito' ? '¿Deja Abono Inicial Hoy?' : 'Detalles del Pago de Contado'}
                </label>

                {saleMode === 'credito' ? (
                  <div className="space-y-2">
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[10px] text-gray-400 block mb-1 font-bold">Abono Inicial en $ (opcional)</label>
                        <input
                          type="number"
                          step="0.01"
                          value={initialAbonoUSD}
                          onChange={(e) => setInitialAbonoUSD(e.target.value === '' ? '' : Number(e.target.value))}
                          placeholder="$0.00 (puede ser cero)"
                          className="w-full bg-[#12121e] border border-white/15 text-xs font-black text-white rounded-xl p-2.5 focus:outline-none focus:border-amber-500"
                        />
                      </div>
                      <div className="p-2 bg-black/40 rounded-xl border border-white/10 flex flex-col justify-center text-right">
                        <span className="text-[10px] text-gray-400">Queda debiendo:</span>
                        <span className="text-xs font-black text-rose-400">
                          {formatUSD(Math.max(0, (Number(saleAmountUSD) || 0) - (Number(initialAbonoUSD) || 0)))}
                        </span>
                      </div>
                    </div>

                    {(Number(initialAbonoUSD) || 0) > 0 && (
                      <div className="grid grid-cols-2 gap-2 pt-1">
                        <select
                          value={paymentMethod}
                          onChange={(e) => setPaymentMethod(e.target.value)}
                          className="w-full bg-[#12121e] border border-white/15 text-xs text-white rounded-xl p-2 focus:outline-none"
                        >
                          <option value="Efectivo en Dólares ($)">💵 Efectivo en Dólares ($)</option>
                          <option value="Pago Móvil (Bs)">📲 Pago Móvil (Bs BCV)</option>
                          <option value="Transferencia Bancaria">🏦 Transferencia Bancaria</option>
                          <option value="Zelle">🇺🇸 Zelle</option>
                        </select>
                        <input
                          type="text"
                          value={paymentReference}
                          onChange={(e) => setPaymentReference(e.target.value)}
                          placeholder="Nro. de Referencia..."
                          className="w-full bg-[#12121e] border border-white/15 text-xs text-white rounded-xl p-2 focus:outline-none"
                        />
                      </div>
                    )}
                  </div>
                ) : (
                  /* De Contado: Pago Completo */
                  <div className="grid grid-cols-2 gap-2">
                    <select
                      value={paymentMethod}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                      className="w-full bg-[#12121e] border border-white/15 text-xs text-white rounded-xl p-2.5 focus:outline-none"
                    >
                      <option value="Efectivo en Dólares ($)">💵 Efectivo en Dólares ($)</option>
                      <option value="Pago Móvil (Bs)">📲 Pago Móvil (Bs BCV)</option>
                      <option value="Transferencia Bancaria">🏦 Transferencia Bancaria</option>
                      <option value="Zelle">🇺🇸 Zelle</option>
                    </select>
                    <input
                      type="text"
                      value={paymentReference}
                      onChange={(e) => setPaymentReference(e.target.value)}
                      placeholder="Referencia de pago..."
                      className="w-full bg-[#12121e] border border-white/15 text-xs text-white rounded-xl p-2.5 focus:outline-none"
                    />
                  </div>
                )}
              </div>

              {/* Botón Submit */}
              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full py-3 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black text-xs font-black rounded-xl shadow-lg transition-all active:scale-95 cursor-pointer flex items-center justify-center gap-2"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>
                    {saleMode === 'credito'
                      ? 'Guardar Venta a Crédito en la Nube'
                      : 'Guardar Venta de Contado en la Nube'}
                  </span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
