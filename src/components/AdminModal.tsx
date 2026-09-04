import React, { useState } from 'react';
import { useStore } from '../context/StoreContext';
import { Product, CreditClient } from '../types';
import { DEFAULT_PRODUCT_IMAGE } from '../data/initialData';
import { exportCreditsToExcel, exportInventoryToExcel, exportCashFlowAndSalesToExcel } from '../utils/excelExport';
import { CashFlowAndSalesTab } from './CashFlowAndSalesTab';
import { BulkProductUploadModal } from './BulkProductUploadModal';
import { compressImage } from '../utils/imageCompressor';
import { 
  X, 
  Lock, 
  DollarSign, 
  CreditCard, 
  Plus, 
  Trash2, 
  Edit3, 
  Check, 
  MessageCircle, 
  Users, 
  Settings, 
  ShoppingBag, 
  Search,
  KeyRound,
  ArrowRight,
  TrendingUp,
  Receipt,
  Upload,
  Sparkles,
  Layers,
  Filter,
  ShieldCheck,
  HelpCircle,
  Eye,
  EyeOff,
  Key,
  RotateCcw,
  FileSpreadsheet,
  Cloud,
  Download
} from 'lucide-react';

export const AdminModal: React.FC = () => {
  const { 
    isAdminOpen, 
    setIsAdminOpen, 
    cloudSyncStatus,
    isCloudQuotaExceeded,
    bcvRate, 
    setBcvRate, 
    paymentConfig, 
    updatePaymentConfig,
    products,
    addProduct,
    updateProduct,
    deleteProduct,
    creditClients,
    addCreditClient,
    addPaymentToClient,
    addPurchaseToClient,
    deleteCreditClient,
    formatUSD,
    formatBS
  } = useStore();

  const [pinInput, setPinInput] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [pinError, setPinError] = useState('');

  // Export to Excel state
  const [isExportingCredits, setIsExportingCredits] = useState(false);
  const [isExportingInventory, setIsExportingInventory] = useState(false);
  const [exportNotice, setExportNotice] = useState<string | null>(null);

  const handleExportCreditsExcel = async () => {
    try {
      setIsExportingCredits(true);
      setExportNotice(null);
      await exportCreditsToExcel(creditClients, bcvRate);
      setExportNotice('✅ Reporte de Créditos y Cobranzas exportado exitosamente a Excel con formato oficial.');
      setTimeout(() => setExportNotice(null), 5000);
    } catch (err) {
      console.error('Error al exportar créditos a Excel:', err);
      setExportNotice('❌ Error al generar el archivo Excel de créditos.');
    } finally {
      setIsExportingCredits(false);
    }
  };

  const handleExportInventoryExcel = async () => {
    try {
      setIsExportingInventory(true);
      setExportNotice(null);
      await exportInventoryToExcel(products, bcvRate);
      setExportNotice('✅ Catálogo e Inventario exportado exitosamente a Excel con formato oficial.');
      setTimeout(() => setExportNotice(null), 5000);
    } catch (err) {
      console.error('Error al exportar inventario a Excel:', err);
      setExportNotice('❌ Error al generar el archivo Excel de inventario.');
    } finally {
      setIsExportingInventory(false);
    }
  };

  // Password Recovery state
  const [isRecovering, setIsRecovering] = useState(false);
  const [recoveryStep, setRecoveryStep] = useState<'question' | 'new_pin'>('question');
  const [recoveryAnswerInput, setRecoveryAnswerInput] = useState('');
  const [recoveryError, setRecoveryError] = useState('');
  const [recoveryNewPin, setRecoveryNewPin] = useState('');
  const [recoveryConfirmPin, setRecoveryConfirmPin] = useState('');
  const [recoverySuccessMsg, setRecoverySuccessMsg] = useState('');

  const [activeTab, setActiveTab] = useState<'sales' | 'credits' | 'products' | 'bcv' | 'security'>('sales');

  // Security Tab state (Inside panel)
  const [currentPinInput, setCurrentPinInput] = useState('');
  const [newPinInput, setNewPinInput] = useState('');
  const [confirmNewPinInput, setConfirmNewPinInput] = useState('');
  const [secQuestionPreset, setSecQuestionPreset] = useState(
    paymentConfig.securityQuestion || '¿Cuál es el nombre de tu boutique o tienda favorita?'
  );
  const [customQuestionInput, setCustomQuestionInput] = useState('');
  const [secAnswerInput, setSecAnswerInput] = useState(paymentConfig.securityAnswer || 'mundo moda');
  const [showCurrentPin, setShowCurrentPin] = useState(false);
  const [showNewPin, setShowNewPin] = useState(false);
  const [securityNotice, setSecurityNotice] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Form State: BCV & Payments
  const [rateTemp, setRateTemp] = useState(bcvRate.toString());
  const [waTemp, setWaTemp] = useState(paymentConfig.whatsappNumber);
  const [pmBank, setPmBank] = useState(paymentConfig.pagoMovil.bank);
  const [pmPhone, setPmPhone] = useState(paymentConfig.pagoMovil.phone);
  const [pmId, setPmId] = useState(paymentConfig.pagoMovil.idNumber);
  const [pmHolder, setPmHolder] = useState(paymentConfig.pagoMovil.holderName);
  const [trBank, setTrBank] = useState(paymentConfig.transferencia.bank);
  const [trAcc, setTrAcc] = useState(paymentConfig.transferencia.accountNumber);
  const [trId, setTrId] = useState(paymentConfig.transferencia.idNumber);
  const [trHolder, setTrHolder] = useState(paymentConfig.transferencia.holderName);
  const [configSavedNotice, setConfigSavedNotice] = useState(false);

  // Form State: New Credit Client
  const [showAddClientForm, setShowAddClientForm] = useState(false);
  const [clientName, setClientName] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [clientIdCard, setClientIdCard] = useState('');
  const [clientSecretCode, setClientSecretCode] = useState('');
  const [clientInitialDebt, setClientInitialDebt] = useState('');
  const [clientNotes, setClientNotes] = useState('');
  const [clientSearch, setClientSearch] = useState('');

  // Selected client for adding payment / purchase
  const [selectedClientForPayment, setSelectedClientForPayment] = useState<CreditClient | null>(null);
  const [paymentAmountUSD, setPaymentAmountUSD] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('Pago Móvil');
  const [paymentRef, setPaymentRef] = useState('');
  const [paymentNotes, setPaymentNotes] = useState('');

  const [selectedClientForPurchase, setSelectedClientForPurchase] = useState<CreditClient | null>(null);
  const [purchaseDesc, setPurchaseDesc] = useState('');
  const [purchaseAmountUSD, setPurchaseAmountUSD] = useState('');

  // Form State: Add / Edit Product
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [prodType, setProdType] = useState<string>('jean');
  const [prodName, setProdName] = useState('');
  const [prodCategory, setProdCategory] = useState<'dama' | 'caballero' | 'unisex'>('dama');
  const [prodCut, setProdCut] = useState('Wide Leg');
  const [prodPriceUSD, setProdPriceUSD] = useState('');
  const [prodTag, setProdTag] = useState('🔥 MÁS VENDIDO');
  const [prodDescription, setProdDescription] = useState('');
  const [prodImage, setProdImage] = useState('');
  const [prodSizes, setProdSizes] = useState('28, 30, 32, 34');
  const [productSearch, setProductSearch] = useState('');
  const [productFilterType, setProductFilterType] = useState('all');
  const [isBulkUploadOpen, setIsBulkUploadOpen] = useState(false);
  const [failedPinAttempts, setFailedPinAttempts] = useState(0);
  const [lockoutUntil, setLockoutUntil] = useState<number>(0);
  const [deleteTarget, setDeleteTarget] = useState<{
    type: 'product' | 'client';
    id: string;
    name: string;
  } | null>(null);
  const [actionNotice, setActionNotice] = useState<string | null>(null);

  if (!isAdminOpen) return null;

  // Login handler
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (Date.now() < lockoutUntil) {
      const remainingSec = Math.ceil((lockoutUntil - Date.now()) / 1000);
      setPinError(`Acceso bloqueado por seguridad. Espera ${remainingSec} segundos.`);
      return;
    }

    if (pinInput === (paymentConfig.adminPin || '1234')) {
      setIsAuthenticated(true);
      setPinError('');
      setIsRecovering(false);
      setFailedPinAttempts(0);
    } else {
      const nextFailed = failedPinAttempts + 1;
      setFailedPinAttempts(nextFailed);
      if (nextFailed >= 5) {
        setLockoutUntil(Date.now() + 30000);
        setPinError('Demasiados intentos erróneos. Acceso bloqueado por 30 segundos por seguridad.');
      } else {
        setPinError(`PIN incorrecto (intento ${nextFailed}/5). Puedes recuperarlo con tu pregunta secreta.`);
      }
    }
  };

  // Verify Security Answer for Password Recovery
  const handleVerifySecurityAnswer = (e: React.FormEvent) => {
    e.preventDefault();
    const storedAnswer = (paymentConfig.securityAnswer || 'mundo moda').trim().toLowerCase();
    const inputAnswer = recoveryAnswerInput.trim().toLowerCase();

    if (!inputAnswer) {
      setRecoveryError('Por favor ingresa tu respuesta secreta.');
      return;
    }

    if (inputAnswer === storedAnswer) {
      setRecoveryError('');
      setRecoveryStep('new_pin');
    } else {
      setRecoveryError('Respuesta incorrecta. Verifica mayúsculas/minúsculas o palabras clave.');
    }
  };

  // Reset PIN via Recovery
  const handleResetPasswordViaRecovery = (e: React.FormEvent) => {
    e.preventDefault();
    if (!recoveryNewPin.trim()) {
      setRecoveryError('Ingresa un nuevo PIN de seguridad.');
      return;
    }
    if (recoveryNewPin.length < 4) {
      setRecoveryError('El PIN debe tener al menos 4 caracteres.');
      return;
    }
    if (recoveryNewPin !== recoveryConfirmPin) {
      setRecoveryError('Las claves ingresadas no coinciden.');
      return;
    }

    updatePaymentConfig({
      adminPin: recoveryNewPin.trim()
    });

    setRecoverySuccessMsg('¡Clave restablecida exitosamente! Entrando al panel...');
    setRecoveryError('');

    setTimeout(() => {
      setIsAuthenticated(true);
      setIsRecovering(false);
      setRecoveryStep('question');
      setRecoveryAnswerInput('');
      setRecoveryNewPin('');
      setRecoveryConfirmPin('');
      setRecoverySuccessMsg('');
      setActiveTab('security');
    }, 1200);
  };

  // Save Security Settings from within the Admin Dashboard
  const handleSaveSecuritySettings = (e: React.FormEvent) => {
    e.preventDefault();
    setSecurityNotice(null);

    // If changing PIN
    if (newPinInput.trim()) {
      if (currentPinInput !== (paymentConfig.adminPin || '1234')) {
        setSecurityNotice({ text: 'El PIN actual ingresado es incorrecto.', type: 'error' });
        return;
      }
      if (newPinInput.length < 4) {
        setSecurityNotice({ text: 'El nuevo PIN debe tener al menos 4 caracteres o números.', type: 'error' });
        return;
      }
      if (newPinInput !== confirmNewPinInput) {
        setSecurityNotice({ text: 'La confirmación del nuevo PIN no coincide.', type: 'error' });
        return;
      }
    }

    const finalQuestion = secQuestionPreset === 'personalizada'
      ? (customQuestionInput.trim() || paymentConfig.securityQuestion || '¿Cuál es el nombre de tu boutique o tienda favorita?')
      : secQuestionPreset;

    const finalAnswer = secAnswerInput.trim() || paymentConfig.securityAnswer || 'mundo moda';

    const updates: Partial<typeof paymentConfig> = {
      securityQuestion: finalQuestion,
      securityAnswer: finalAnswer,
    };

    if (newPinInput.trim()) {
      updates.adminPin = newPinInput.trim();
    }

    updatePaymentConfig(updates);
    setCurrentPinInput('');
    setNewPinInput('');
    setConfirmNewPinInput('');
    setSecurityNotice({ text: '¡Clave y pregunta de seguridad actualizadas con éxito!', type: 'success' });
    
    setTimeout(() => {
      setSecurityNotice(null);
    }, 4500);
  };

  // Switch product type & set smart defaults
  const handleTypeSelect = (type: string) => {
    setProdType(type);
    if (type === 'jean') {
      setProdCut('Wide Leg');
      setProdSizes('28, 30, 32, 34');
      setProdTag('🔥 MÁS VENDIDO');
      if (!prodImage || prodImage.includes('unsplash')) {
        setProdImage(prodCategory === 'caballero' 
          ? 'https://images.unsplash.com/photo-1604176354204-9268737828e4?auto=format&fit=crop&w=700&q=80'
          : 'https://images.unsplash.com/photo-1541099649105-f69ad21f3246?auto=format&fit=crop&w=700&q=80');
      }
    } else if (type === 'camisa') {
      setProdCut('Blusa / Manga Corta');
      setProdSizes('S, M, L, XL');
      setProdTag('✨ NUEVA COLECCIÓN');
      if (!prodImage || prodImage.includes('unsplash')) {
        setProdImage(prodCategory === 'caballero'
          ? 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?auto=format&fit=crop&w=700&q=80'
          : 'https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?auto=format&fit=crop&w=700&q=80');
      }
    } else if (type === 'colonia') {
      setProdCut('Fragancia Fina');
      setProdSizes('100 ml');
      setProdTag('💖 ALTA FIJACIÓN');
      if (!prodImage || prodImage.includes('unsplash')) {
        setProdImage(prodCategory === 'caballero'
          ? 'https://images.unsplash.com/photo-1523293182086-7651a899d37f?auto=format&fit=crop&w=700&q=80'
          : 'https://images.unsplash.com/photo-1541643600914-78b084683601?auto=format&fit=crop&w=700&q=80');
      }
    } else if (type === 'zapatos') {
      setProdCut('Calzado Confort');
      setProdSizes('36, 37, 38, 39, 40, 41, 42');
      setProdTag('⭐ TENDENCIA');
      if (!prodImage || prodImage.includes('unsplash')) {
        setProdImage('https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?auto=format&fit=crop&w=700&q=80');
      }
    } else if (type === 'vestido') {
      setProdCut('Corte Midi / Fiesta');
      setProdSizes('S, M, L');
      setProdTag('ELEGANTE');
      if (!prodImage || prodImage.includes('unsplash')) {
        setProdImage('https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?auto=format&fit=crop&w=700&q=80');
      }
    } else if (type === 'accesorio') {
      setProdCut('Boutique');
      setProdSizes('Única');
      setProdTag('TOP ACCESORIO');
      if (!prodImage || prodImage.includes('unsplash')) {
        setProdImage('https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&w=700&q=80');
      }
    } else if (type === 'conjunto') {
      setProdCut('Outfit 2 Piezas');
      setProdSizes('S, M, L');
      setProdTag('LOOK COMPLETO');
      if (!prodImage || prodImage.includes('unsplash')) {
        setProdImage('https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=700&q=80');
      }
    } else {
      setProdCut('Boutique');
      setProdSizes('Única');
      setProdTag('DISPONIBLE');
    }
  };

  // Handle image upload from file picker with smart compression
  const handleImageFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const compressed = await compressImage(file, { maxWidth: 1080, maxHeight: 1350, quality: 0.8 });
        setProdImage(compressed);
      } catch (err) {
        console.warn('Fallback to standard FileReader:', err);
        const reader = new FileReader();
        reader.onloadend = () => {
          if (typeof reader.result === 'string') {
            setProdImage(reader.result);
          }
        };
        reader.readAsDataURL(file);
      }
    }
  };

  // Start editing existing product
  const handleStartEditProduct = (prod: Product) => {
    setEditingProductId(prod.id);
    setProdType(prod.productType || 'jean');
    setProdName(prod.name);
    setProdCategory(prod.category as 'dama' | 'caballero' | 'unisex');
    setProdCut(prod.cut || '');
    setProdPriceUSD(prod.priceUSD.toString());
    setProdTag(prod.tag || '');
    setProdDescription(prod.description || '');
    setProdImage(prod.image || '');
    setProdSizes(prod.availableSizes.join(', '));
    setShowAddProduct(true);
  };

  // Cancel edit / reset form
  const handleCancelProductForm = () => {
    setShowAddProduct(false);
    setEditingProductId(null);
    setProdName('');
    setProdPriceUSD('');
    setProdTag('🔥 MÁS VENDIDO');
    setProdDescription('');
    setProdImage('');
    setProdCut('Wide Leg');
    setProdSizes('28, 30, 32, 34');
    setProdType('jean');
  };

  // Safe delete handler without browser confirm() dialog that gets blocked in iframes
  const handleExecuteDelete = () => {
    if (!deleteTarget) return;
    if (deleteTarget.type === 'product') {
      deleteProduct(deleteTarget.id);
      setActionNotice(`Se eliminó "${deleteTarget.name}" del catálogo y de la nube.`);
      if (editingProductId === deleteTarget.id) {
        handleCancelProductForm();
      }
    } else {
      deleteCreditClient(deleteTarget.id);
      setActionNotice(`Se eliminó la ficha de "${deleteTarget.name}".`);
      if (selectedClientForPayment?.id === deleteTarget.id) {
        setSelectedClientForPayment(null);
      }
      if (selectedClientForPurchase?.id === deleteTarget.id) {
        setSelectedClientForPurchase(null);
      }
    }
    setDeleteTarget(null);
    setTimeout(() => setActionNotice(null), 4000);
  };

  // Save BCV & Payment info
  const handleSavePaymentConfig = (e: React.FormEvent) => {
    e.preventDefault();
    const newRate = parseFloat(rateTemp) || bcvRate;
    setBcvRate(newRate);
    updatePaymentConfig({
      bcvRate: newRate,
      whatsappNumber: waTemp,
      pagoMovil: {
        bank: pmBank,
        phone: pmPhone,
        idNumber: pmId,
        holderName: pmHolder
      },
      transferencia: {
        bank: trBank,
        accountNumber: trAcc,
        idNumber: trId,
        holderName: trHolder,
        accountType: 'Cuenta Corriente'
      }
    });
    setConfigSavedNotice(true);
    setTimeout(() => setConfigSavedNotice(false), 2500);
  };

  // Create credit client
  const handleCreateClient = (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientName) return;

    const autoCode = clientSecretCode.trim() 
      ? clientSecretCode.toUpperCase().trim() 
      : `CLI-${Math.floor(1000 + Math.random() * 9000)}`;

    addCreditClient({
      name: clientName,
      phone: clientPhone,
      idCard: clientIdCard,
      secretCode: autoCode,
      totalPurchasedUSD: parseFloat(clientInitialDebt) || 0,
      notes: clientNotes,
    });

    setClientName('');
    setClientPhone('');
    setClientIdCard('');
    setClientSecretCode('');
    setClientInitialDebt('');
    setClientNotes('');
    setShowAddClientForm(false);
  };

  // Register payment for client
  const handleRegisterPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClientForPayment || !paymentAmountUSD) return;

    const amount = parseFloat(paymentAmountUSD) || 0;
    addPaymentToClient(selectedClientForPayment.id, {
      amountUSD: amount,
      amountBS: amount * bcvRate,
      method: paymentMethod,
      reference: paymentRef,
      notes: paymentNotes
    });

    // Send receipt via WhatsApp
    const newBal = Math.max(0, selectedClientForPayment.balanceUSD - amount);
    const receiptMsg = encodeURIComponent(
      `🧾 *RECIBO DE ABONO - MUNDO MODA SHOP*\n` +
      `━━━━━━━━━━━━━━━━━━━━━━\n` +
      `👤 *Cliente:* ${selectedClientForPayment.name}\n` +
      `💳 *Cédula:* ${selectedClientForPayment.idCard || 'Registrada'}\n` +
      `━━━━━━━━━━━━━━━━━━━━━━\n` +
      `✅ *Abono Recibido:* $${amount.toFixed(2)} USD (Bs. ${(amount * bcvRate).toFixed(2)})\n` +
      `🇻🇪 *Tasa BCV:* Bs. ${bcvRate.toFixed(2)}\n` +
      `🏦 *Método:* ${paymentMethod}\n` +
      (paymentRef ? `📋 *Ref:* ${paymentRef}\n` : '') +
      `━━━━━━━━━━━━━━━━━━━━━━\n` +
      `📉 *Saldo Restante Pendiente:* $${newBal.toFixed(2)} USD (Bs. ${(newBal * bcvRate).toFixed(2)})\n\n` +
      `¡Gracias por tu pago puntual! Puedes consultar tu estado de cuenta con tu cédula o teléfono en nuestro catálogo.`
    );

    window.open(`https://wa.me/${selectedClientForPayment.phone.replace(/\D/g, '')}?text=${receiptMsg}`, '_blank');

    setSelectedClientForPayment(null);
    setPaymentAmountUSD('');
    setPaymentRef('');
    setPaymentNotes('');
  };

  // Add purchase to client
  const handleAddPurchase = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClientForPurchase || !purchaseAmountUSD) return;

    const amount = parseFloat(purchaseAmountUSD) || 0;
    addPurchaseToClient(selectedClientForPurchase.id, {
      description: purchaseDesc || "Prendas de Jeans a crédito",
      amountUSD: amount
    });

    setSelectedClientForPurchase(null);
    setPurchaseDesc('');
    setPurchaseAmountUSD('');
  };

  // Add or update product
  const handleSaveProductSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!prodName.trim() || !prodPriceUSD) return;

    const sizesArr = prodSizes.split(',').map(s => s.trim()).filter(Boolean);
    const fallbackImage = prodType === 'colonia'
      ? (prodCategory === 'caballero' 
          ? 'https://images.unsplash.com/photo-1523293182086-7651a899d37f?auto=format&fit=crop&w=700&q=80'
          : 'https://images.unsplash.com/photo-1541643600914-78b084683601?auto=format&fit=crop&w=700&q=80')
      : prodType === 'camisa'
      ? (prodCategory === 'caballero'
          ? 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?auto=format&fit=crop&w=700&q=80'
          : 'https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?auto=format&fit=crop&w=700&q=80')
      : prodType === 'zapatos'
      ? 'https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?auto=format&fit=crop&w=700&q=80'
      : prodType === 'vestido'
      ? 'https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?auto=format&fit=crop&w=700&q=80'
      : prodType === 'accesorio'
      ? 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&w=700&q=80'
      : prodType === 'conjunto'
      ? 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=700&q=80'
      : prodCategory === 'caballero'
      ? 'https://images.unsplash.com/photo-1604176354204-9268737828e4?auto=format&fit=crop&w=700&q=80'
      : 'https://images.unsplash.com/photo-1541099649105-f69ad21f3246?auto=format&fit=crop&w=700&q=80';

    const finalImage = prodImage.trim() || fallbackImage;
    const finalDesc = prodDescription.trim() || `${prodName} - Mundo Moda Shop. Calidad premium garantizada.`;

    if (editingProductId) {
      updateProduct(editingProductId, {
        name: prodName.trim(),
        productType: prodType,
        category: prodCategory,
        cut: prodCut.trim() || 'Estilo Boutique',
        priceUSD: parseFloat(prodPriceUSD) || 20,
        tag: prodTag.trim() || 'DISPONIBLE',
        description: finalDesc,
        image: finalImage,
        gallery: [finalImage],
        availableSizes: sizesArr.length > 0 ? sizesArr : ['Única'],
        inStock: true
      });
      setEditingProductId(null);
    } else {
      addProduct({
        name: prodName.trim(),
        productType: prodType,
        category: prodCategory,
        cut: prodCut.trim() || 'Estilo Boutique',
        priceUSD: parseFloat(prodPriceUSD) || 20,
        tag: prodTag.trim() || 'NUEVO',
        rating: 5.0,
        reviewsCount: 1,
        description: finalDesc,
        image: finalImage,
        gallery: [finalImage],
        availableSizes: sizesArr.length > 0 ? sizesArr : ['Única'],
        inStock: true
      });
    }

    setProdName('');
    setProdPriceUSD('');
    setProdTag('🔥 MÁS VENDIDO');
    setProdDescription('');
    setProdImage('');
    setShowAddProduct(false);
  };

  // Stats for Credit monitoring
  const totalDebtUSD = creditClients.reduce((sum, c) => sum + c.balanceUSD, 0);
  const totalCollectedUSD = creditClients.reduce((sum, c) => {
    const paid = c.payments.reduce((pSum, p) => pSum + p.amountUSD, 0);
    return sum + paid;
  }, 0);

  const filteredClients = creditClients.filter(c => 
    c.name.toLowerCase().includes(clientSearch.toLowerCase()) ||
    c.idCard.toLowerCase().includes(clientSearch.toLowerCase()) ||
    c.secretCode.toLowerCase().includes(clientSearch.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4">
      <div className="relative w-full max-w-2xl bg-[#0F0F17] border border-pink-500/40 rounded-3xl text-white shadow-[0_0_50px_rgba(255,46,147,0.25)] overflow-hidden">
        
        {/* Header */}
        <div className="p-4 sm:p-5 bg-[#141420] border-b border-pink-500/20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-pink-600 to-rose-600 flex items-center justify-center text-white shadow-lg shrink-0">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[10px] font-black uppercase tracking-widest text-pink-400 block">
                  ADMINISTRACIÓN PRIVADA
                </span>
                <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 ${
                  cloudSyncStatus === 'connected' 
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' 
                    : isCloudQuotaExceeded
                    ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                    : cloudSyncStatus === 'connecting'
                    ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30 animate-pulse'
                    : 'bg-gray-500/20 text-gray-400 border border-gray-500/30'
                }`}>
                  <Cloud className="w-2.5 h-2.5" />
                  {cloudSyncStatus === 'connected' 
                    ? 'Nube Firebase Activa' 
                    : isCloudQuotaExceeded 
                    ? 'Almacenamiento Local Seguro (IndexedDB)' 
                    : cloudSyncStatus === 'connecting' 
                    ? 'Conectando...' 
                    : 'Modo Local (Offline)'}
                </span>
              </div>
              <h3 className="text-base sm:text-lg font-black text-white">
                Panel de la Dueña - Mundo Moda
              </h3>
            </div>
          </div>

          <button
            onClick={() => setIsAdminOpen(false)}
            className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-xl transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Auth Gate / Password Recovery */}
        {!isAuthenticated ? (
          <div className="p-6 sm:p-8 text-center space-y-4">
            {!isRecovering ? (
              <>
                <div className="w-14 h-14 rounded-2xl bg-pink-500/10 border border-pink-500/30 text-pink-400 flex items-center justify-center mx-auto text-xl shadow-md">
                  🔑
                </div>
                <h4 className="text-sm sm:text-base font-black text-white">Ingresa tu Clave / PIN de Seguridad</h4>
                <p className="text-xs text-gray-400 max-w-sm mx-auto">
                  Accede para actualizar la tasa oficial BCV, gestionar productos, clientes a crédito y configurar tu clave.
                </p>

                <form onSubmit={handleLogin} className="max-w-xs mx-auto space-y-3">
                  <input
                    type="password"
                    value={pinInput}
                    onChange={(e) => setPinInput(e.target.value)}
                    placeholder="PIN (por defecto: 1234)"
                    className="w-full bg-[#181826] border border-pink-500/30 text-center text-lg tracking-widest font-black rounded-xl py-2.5 text-white focus:outline-none focus:border-pink-500"
                    autoFocus
                  />
                  {pinError && (
                    <p className="text-[11px] font-bold text-rose-400">{pinError}</p>
                  )}
                  <button
                    type="submit"
                    className="w-full py-2.5 bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-500 hover:to-rose-500 text-white text-xs font-black rounded-xl shadow-lg transition-all active:scale-95 cursor-pointer"
                  >
                    Desbloquear Panel
                  </button>
                </form>

                {/* Botón ¿Olvidaste tu clave? */}
                <div className="pt-2 border-t border-white/5">
                  <button
                    type="button"
                    onClick={() => {
                      setIsRecovering(true);
                      setRecoveryStep('question');
                      setRecoveryError('');
                      setRecoveryAnswerInput('');
                    }}
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-pink-400 hover:text-pink-300 hover:underline cursor-pointer"
                  >
                    <HelpCircle className="w-3.5 h-3.5" />
                    <span>¿Olvidaste tu clave? Recuperar con pregunta secreta</span>
                  </button>
                </div>
              </>
            ) : (
              /* Flujo de Recuperación con Pregunta Secreta */
              <div className="max-w-sm mx-auto space-y-4 animate-fadeIn">
                <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center mx-auto text-lg shadow-md">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                
                <div>
                  <h4 className="text-sm sm:text-base font-black text-white">Recuperación de Clave Secreta</h4>
                  <p className="text-[11px] text-gray-400 mt-0.5">
                    {recoveryStep === 'question' 
                      ? 'Responde tu pregunta de seguridad para verificar tu identidad.'
                      : '¡Respuesta correcta! Escribe tu nuevo PIN de acceso.'}
                  </p>
                </div>

                {recoveryStep === 'question' ? (
                  <form onSubmit={handleVerifySecurityAnswer} className="space-y-3 text-left">
                    <div className="bg-[#141420] border border-amber-500/30 p-3 rounded-xl space-y-1.5">
                      <span className="text-[10px] text-amber-400 font-black uppercase tracking-wider flex items-center gap-1">
                        <HelpCircle className="w-3.5 h-3.5" /> Tu Pregunta Secreta:
                      </span>
                      <p className="text-xs font-bold text-white">
                        {paymentConfig.securityQuestion || '¿Cuál es el nombre de tu boutique o tienda favorita?'}
                      </p>
                    </div>

                    <div>
                      <label className="block text-[11px] text-gray-300 font-bold mb-1">
                        Escribe tu Respuesta Secreta:
                      </label>
                      <input
                        type="text"
                        value={recoveryAnswerInput}
                        onChange={(e) => setRecoveryAnswerInput(e.target.value)}
                        placeholder="Escribe tu respuesta aquí..."
                        className="w-full bg-[#181826] border border-white/20 rounded-xl px-3 py-2 text-xs font-bold text-white focus:outline-none focus:border-pink-500"
                        autoFocus
                        required
                      />
                    </div>

                    {recoveryError && (
                      <p className="text-[11px] font-bold text-rose-400 bg-rose-500/10 p-2 rounded-lg border border-rose-500/20 text-center">
                        {recoveryError}
                      </p>
                    )}

                    <div className="flex gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => {
                          setIsRecovering(false);
                          setRecoveryError('');
                        }}
                        className="flex-1 py-2.5 bg-white/10 hover:bg-white/15 text-gray-300 text-xs font-bold rounded-xl cursor-pointer"
                      >
                        Cancelar
                      </button>
                      <button
                        type="submit"
                        className="flex-1 py-2.5 bg-gradient-to-r from-amber-600 to-pink-600 hover:from-amber-500 hover:to-pink-500 text-white text-xs font-black rounded-xl shadow-lg cursor-pointer"
                      >
                        Verificar
                      </button>
                    </div>
                  </form>
                ) : (
                  <form onSubmit={handleResetPasswordViaRecovery} className="space-y-3 text-left">
                    <div>
                      <label className="block text-[11px] text-gray-300 font-bold mb-1">
                        Nuevo PIN / Clave (mínimo 4 caracteres):
                      </label>
                      <input
                        type="password"
                        value={recoveryNewPin}
                        onChange={(e) => setRecoveryNewPin(e.target.value)}
                        placeholder="Ej: 5678 o miClave2026"
                        className="w-full bg-[#181826] border border-emerald-500/50 rounded-xl px-3 py-2 text-xs font-black text-emerald-400 focus:outline-none focus:border-emerald-400"
                        autoFocus
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] text-gray-300 font-bold mb-1">
                        Confirma tu Nuevo PIN:
                      </label>
                      <input
                        type="password"
                        value={recoveryConfirmPin}
                        onChange={(e) => setRecoveryConfirmPin(e.target.value)}
                        placeholder="Vuelve a escribir el PIN"
                        className="w-full bg-[#181826] border border-emerald-500/50 rounded-xl px-3 py-2 text-xs font-black text-emerald-400 focus:outline-none focus:border-emerald-400"
                        required
                      />
                    </div>

                    {recoveryError && (
                      <p className="text-[11px] font-bold text-rose-400 bg-rose-500/10 p-2 rounded-lg border border-rose-500/20 text-center">
                        {recoveryError}
                      </p>
                    )}

                    {recoverySuccessMsg && (
                      <p className="text-[11px] font-bold text-emerald-400 bg-emerald-500/10 p-2 rounded-lg border border-emerald-500/20 text-center animate-pulse">
                        {recoverySuccessMsg}
                      </p>
                    )}

                    <button
                      type="submit"
                      className="w-full py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-black rounded-xl shadow-lg cursor-pointer"
                    >
                      Guardar Nueva Clave y Entrar
                    </button>
                  </form>
                )}
              </div>
            )}
          </div>
        ) : (
          <div className="flex flex-col h-[75vh]">
            
            {/* Tabs de Navegación (5 pestañas responsivas) */}
            <div className="grid grid-cols-2 sm:grid-cols-5 border-b border-pink-500/20 bg-[#12121E] p-1.5 gap-1.5 text-xs font-black">
              <button
                onClick={() => setActiveTab('sales')}
                className={`py-2 px-1 text-center rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1 truncate ${
                  activeTab === 'sales'
                    ? 'bg-[#181828] text-amber-400 border border-amber-500/50 shadow-md'
                    : 'text-gray-400 hover:text-white bg-white/5'
                }`}
              >
                <TrendingUp className="w-3.5 h-3.5 shrink-0 text-amber-400" />
                <span className="truncate">Caja & Ventas</span>
              </button>

              <button
                onClick={() => setActiveTab('credits')}
                className={`py-2 px-1 text-center rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1 truncate ${
                  activeTab === 'credits'
                    ? 'bg-[#181828] text-amber-400 border border-amber-500/50 shadow-md'
                    : 'text-gray-400 hover:text-white bg-white/5'
                }`}
              >
                <CreditCard className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">Créditos ({creditClients.length})</span>
              </button>

              <button
                onClick={() => setActiveTab('products')}
                className={`py-2 px-1 text-center rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1 truncate ${
                  activeTab === 'products'
                    ? 'bg-[#181828] text-pink-400 border border-pink-500/50 shadow-md'
                    : 'text-gray-400 hover:text-white bg-white/5'
                }`}
              >
                <ShoppingBag className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">Productos ({products.length})</span>
              </button>

              <button
                onClick={() => setActiveTab('bcv')}
                className={`py-2 px-1 text-center rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1 truncate ${
                  activeTab === 'bcv'
                    ? 'bg-[#181828] text-pink-400 border border-pink-500/50 shadow-md'
                    : 'text-gray-400 hover:text-white bg-white/5'
                }`}
              >
                <DollarSign className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">Tasa BCV</span>
              </button>

              <button
                onClick={() => setActiveTab('security')}
                className={`py-2 px-1 text-center rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1 truncate ${
                  activeTab === 'security'
                    ? 'bg-[#181828] text-emerald-400 border border-emerald-500/50 shadow-md'
                    : 'text-gray-400 hover:text-white bg-white/5'
                }`}
              >
                <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">Seguridad</span>
              </button>
            </div>

            {/* Contenido de la Pestaña */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 bg-[#181828]">
              
              {/* Notificación de Exportación a Excel */}
              {exportNotice && (
                <div className="p-3 bg-emerald-500/10 border border-emerald-500/40 rounded-xl flex items-center justify-between text-emerald-300 text-xs font-bold animate-fadeIn shadow-md">
                  <div className="flex items-center gap-2">
                    <FileSpreadsheet className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>{exportNotice}</span>
                  </div>
                  <button 
                    type="button" 
                    onClick={() => setExportNotice(null)} 
                    className="p-1 hover:bg-emerald-500/20 rounded-lg text-emerald-400 cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              {/* ========================================================= */}
              {/* PESTAÑA 0: CAJA, VENTAS & FLUJO DE DINERO                 */}
              {/* ========================================================= */}
              {activeTab === 'sales' && (
                <CashFlowAndSalesTab onGoToCredits={() => setActiveTab('credits')} />
              )}
              
              {/* ========================================================= */}
              {/* PESTAÑA 1: TASA BCV & CONFIGURACIÓN DE PAGO              */}
              {/* ========================================================= */}
              {activeTab === 'bcv' && (
                <form onSubmit={handleSavePaymentConfig} className="space-y-4">
                  
                  {/* Tasa BCV Destacada */}
                  <div className="bg-gradient-to-r from-pink-900/30 to-purple-900/30 border border-pink-500/40 p-4 rounded-2xl space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-sm font-black text-white flex items-center gap-1.5">
                          <DollarSign className="w-4 h-4 text-emerald-400" /> Tasa Oficial Banco Central de Venezuela (BCV)
                        </h4>
                        <p className="text-[11px] text-gray-300 mt-0.5">
                          Todos los precios en $ USD se convertirán automáticamente a Bolívares usando este valor.
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-gray-300">1 USD = Bs.</span>
                      <input
                        type="number"
                        step="0.01"
                        value={rateTemp}
                        onChange={(e) => setRateTemp(e.target.value)}
                        className="w-32 bg-black/60 border border-emerald-500/60 text-lg font-black text-emerald-400 px-3 py-1.5 rounded-xl text-center focus:outline-none focus:ring-1 focus:ring-emerald-500"
                        required
                      />
                      <div className="flex gap-1 text-xs">
                        <button
                          type="button"
                          onClick={() => setRateTemp((parseFloat(rateTemp || '0') + 0.20).toFixed(2))}
                          className="px-2 py-1 bg-white/10 hover:bg-white/20 rounded-lg font-bold"
                        >
                          +0.20
                        </button>
                        <button
                          type="button"
                          onClick={() => setRateTemp((Math.max(1, parseFloat(rateTemp || '0') - 0.20)).toFixed(2))}
                          className="px-2 py-1 bg-white/10 hover:bg-white/20 rounded-lg font-bold"
                        >
                          -0.20
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* WhatsApp de la Tienda */}
                  <div className="bg-[#141420] p-4 rounded-2xl border border-white/5 space-y-2">
                    <h4 className="text-xs font-black text-white uppercase tracking-wider">
                      📱 WhatsApp de Pedidos y Cobranzas
                    </h4>
                    <input
                      type="text"
                      value={waTemp}
                      onChange={(e) => setWaTemp(e.target.value)}
                      placeholder="Ej: 584121234567 (con código de país sin +)"
                      className="w-full bg-[#1C1C2C] border border-white/10 rounded-xl px-3 py-2 text-xs font-bold text-white focus:outline-none focus:border-pink-500"
                    />
                  </div>

                  {/* Datos Pago Móvil */}
                  <div className="bg-[#141420] p-4 rounded-2xl border border-white/5 space-y-3">
                    <h4 className="text-xs font-black text-pink-400 uppercase tracking-wider flex items-center gap-1.5">
                      📱 Cuentas de Pago Móvil:
                    </h4>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <label className="block text-[10px] text-gray-400 mb-1 font-bold">Banco:</label>
                        <input
                          type="text"
                          value={pmBank}
                          onChange={(e) => setPmBank(e.target.value)}
                          className="w-full bg-[#1C1C2C] border border-white/10 rounded-xl px-3 py-1.5 text-xs font-semibold text-white focus:outline-none focus:border-pink-500"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] text-gray-400 mb-1 font-bold">Teléfono:</label>
                        <input
                          type="text"
                          value={pmPhone}
                          onChange={(e) => setPmPhone(e.target.value)}
                          className="w-full bg-[#1C1C2C] border border-white/10 rounded-xl px-3 py-1.5 text-xs font-semibold text-white focus:outline-none focus:border-pink-500"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] text-gray-400 mb-1 font-bold">Cédula / RIF:</label>
                        <input
                          type="text"
                          value={pmId}
                          onChange={(e) => setPmId(e.target.value)}
                          className="w-full bg-[#1C1C2C] border border-white/10 rounded-xl px-3 py-1.5 text-xs font-semibold text-white focus:outline-none focus:border-pink-500"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] text-gray-400 mb-1 font-bold">Titular:</label>
                        <input
                          type="text"
                          value={pmHolder}
                          onChange={(e) => setPmHolder(e.target.value)}
                          className="w-full bg-[#1C1C2C] border border-white/10 rounded-xl px-3 py-1.5 text-xs font-semibold text-white focus:outline-none focus:border-pink-500"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Datos Transferencia Bancaria */}
                  <div className="bg-[#141420] p-4 rounded-2xl border border-white/5 space-y-3">
                    <h4 className="text-xs font-black text-blue-400 uppercase tracking-wider flex items-center gap-1.5">
                      🏦 Cuenta de Transferencia Bancaria:
                    </h4>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <label className="block text-[10px] text-gray-400 mb-1 font-bold">Banco:</label>
                        <input
                          type="text"
                          value={trBank}
                          onChange={(e) => setTrBank(e.target.value)}
                          className="w-full bg-[#1C1C2C] border border-white/10 rounded-xl px-3 py-1.5 text-xs font-semibold text-white focus:outline-none focus:border-pink-500"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] text-gray-400 mb-1 font-bold">Número de Cuenta (20 dígitos):</label>
                        <input
                          type="text"
                          value={trAcc}
                          onChange={(e) => setTrAcc(e.target.value)}
                          className="w-full bg-[#1C1C2C] border border-white/10 rounded-xl px-3 py-1.5 text-xs font-semibold text-white focus:outline-none focus:border-pink-500"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] text-gray-400 mb-1 font-bold">RIF / Cédula:</label>
                        <input
                          type="text"
                          value={trId}
                          onChange={(e) => setTrId(e.target.value)}
                          className="w-full bg-[#1C1C2C] border border-white/10 rounded-xl px-3 py-1.5 text-xs font-semibold text-white focus:outline-none focus:border-pink-500"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] text-gray-400 mb-1 font-bold">Titular:</label>
                        <input
                          type="text"
                          value={trHolder}
                          onChange={(e) => setTrHolder(e.target.value)}
                          className="w-full bg-[#1C1C2C] border border-white/10 rounded-xl px-3 py-1.5 text-xs font-semibold text-white focus:outline-none focus:border-pink-500"
                        />
                      </div>
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3 bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-500 hover:to-rose-500 text-white text-xs font-black rounded-xl shadow-lg transition-all active:scale-98 cursor-pointer flex items-center justify-center gap-2"
                  >
                    <Check className="w-4 h-4" />
                    <span>Guardar Cambios de Tasa y Métodos</span>
                  </button>

                  {configSavedNotice && (
                    <p className="text-center text-xs font-bold text-emerald-400 animate-fadeIn">
                      ✅ ¡Configuración y Tasa BCV actualizadas con éxito!
                    </p>
                  )}
                </form>
              )}

              {/* ========================================================= */}
              {/* PESTAÑA 2: CONTROL DE CRÉDITOS Y ABONOS                   */}
              {/* ========================================================= */}
              {activeTab === 'credits' && (
                <div className="space-y-4">
                  
                  {/* Resumen de Cobranzas */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    <div className="bg-[#141420] border border-amber-500/30 p-3 rounded-2xl">
                      <span className="text-[10px] font-bold text-gray-400 block uppercase">Por Cobrar en la Calle</span>
                      <span className="text-lg sm:text-xl font-black text-amber-400">{formatUSD(totalDebtUSD)}</span>
                      <span className="text-[10px] text-gray-400 block">{formatBS(totalDebtUSD)}</span>
                    </div>

                    <div className="bg-[#141420] border border-emerald-500/30 p-3 rounded-2xl">
                      <span className="text-[10px] font-bold text-gray-400 block uppercase">Total Recaudado en Abonos</span>
                      <span className="text-lg sm:text-xl font-black text-emerald-400">{formatUSD(totalCollectedUSD)}</span>
                      <span className="text-[10px] text-gray-400 block">{formatBS(totalCollectedUSD)}</span>
                    </div>

                    <div className="bg-[#141420] border border-white/10 p-3 rounded-2xl col-span-2 sm:col-span-1">
                      <span className="text-[10px] font-bold text-gray-400 block uppercase">Clientes Registrados</span>
                      <span className="text-lg sm:text-xl font-black text-white">{creditClients.length}</span>
                      <span className="text-[10px] text-pink-400 block">Acceso por Cédula / Teléfono</span>
                    </div>
                  </div>

                  {/* Acciones: Buscar, Exportar Excel y Crear Cliente */}
                  <div className="flex flex-col sm:flex-row gap-2 justify-between items-stretch sm:items-center">
                    <div className="relative flex-1">
                      <input
                        type="text"
                        value={clientSearch}
                        onChange={(e) => setClientSearch(e.target.value)}
                        placeholder="Buscar cliente por nombre o cédula..."
                        className="w-full bg-[#141420] border border-white/10 text-white placeholder-gray-500 text-xs font-semibold rounded-xl py-2 pl-8 pr-3 focus:outline-none focus:border-amber-500"
                      />
                      <Search className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-2.5" />
                    </div>

                    <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
                      <button
                        type="button"
                        onClick={handleExportCreditsExcel}
                        disabled={isExportingCredits || creditClients.length === 0}
                        className="px-3.5 py-2 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 border border-emerald-500/40 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 shadow-sm shrink-0 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                        title="Descargar archivo Excel con la lista de clientes, deudas activas, compras y abonos"
                      >
                        <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
                        <span>{isExportingCredits ? 'Generando...' : 'Descargar Excel'}</span>
                      </button>

                      <button
                        onClick={() => setShowAddClientForm(!showAddClientForm)}
                        className="px-3 py-2 bg-amber-500 hover:bg-amber-400 text-black text-xs font-black rounded-xl transition-all flex items-center justify-center gap-1.5 shadow-md shrink-0 cursor-pointer"
                      >
                        <Plus className="w-4 h-4" />
                        <span>{showAddClientForm ? 'Cancelar' : 'Nuevo Cliente a Crédito'}</span>
                      </button>
                    </div>
                  </div>

                  {/* Formulario Crear Cliente */}
                  {showAddClientForm && (
                    <form onSubmit={handleCreateClient} className="bg-[#141420] border border-amber-500/40 p-4 rounded-2xl space-y-3">
                      <h4 className="text-xs font-black text-amber-400 uppercase tracking-wider">
                        Registrar Nuevo Cliente a Crédito
                      </h4>

                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div>
                          <label className="block text-[10px] text-gray-400 mb-1 font-bold">Nombre Completo *:</label>
                          <input
                            type="text"
                            value={clientName}
                            onChange={(e) => setClientName(e.target.value)}
                            placeholder="Ej: Carmen Gómez"
                            className="w-full bg-[#1C1C2C] border border-white/10 rounded-xl px-3 py-2 text-xs font-semibold text-white focus:outline-none focus:border-amber-500"
                            required
                          />
                        </div>

                        <div>
                          <label className="block text-[10px] text-gray-400 mb-1 font-bold">Teléfono WhatsApp *:</label>
                          <input
                            type="text"
                            value={clientPhone}
                            onChange={(e) => setClientPhone(e.target.value)}
                            placeholder="Ej: 0414-1234567"
                            className="w-full bg-[#1C1C2C] border border-white/10 rounded-xl px-3 py-2 text-xs font-semibold text-white focus:outline-none focus:border-amber-500"
                            required
                          />
                        </div>

                        <div>
                          <label className="block text-[10px] text-gray-400 mb-1 font-bold">Cédula / Identidad:</label>
                          <input
                            type="text"
                            value={clientIdCard}
                            onChange={(e) => setClientIdCard(e.target.value)}
                            placeholder="Ej: V-18.234.567"
                            className="w-full bg-[#1C1C2C] border border-white/10 rounded-xl px-3 py-2 text-xs font-semibold text-white focus:outline-none focus:border-amber-500"
                          />
                        </div>

                        <div>
                          <label className="block text-[10px] text-gray-400 mb-1 font-bold">Monto Inicial Comprado ($ USD):</label>
                          <input
                            type="number"
                            step="0.01"
                            value={clientInitialDebt}
                            onChange={(e) => setClientInitialDebt(e.target.value)}
                            placeholder="Ej: 50.00"
                            className="w-full bg-[#1C1C2C] border border-white/10 rounded-xl px-3 py-2 text-xs font-bold text-white focus:outline-none focus:border-amber-500"
                            required
                          />
                        </div>

                        <div>
                          <label className="block text-[10px] text-gray-400 mb-1 font-bold">Notas / Acuerdos de Pago:</label>
                          <input
                            type="text"
                            value={clientNotes}
                            onChange={(e) => setClientNotes(e.target.value)}
                            placeholder="Ej: Paga los 15 y 30"
                            className="w-full bg-[#1C1C2C] border border-white/10 rounded-xl px-3 py-2 text-xs font-semibold text-white focus:outline-none focus:border-amber-500"
                          />
                        </div>
                      </div>

                      <button
                        type="submit"
                        className="w-full py-2.5 bg-amber-500 hover:bg-amber-400 text-black text-xs font-black rounded-xl shadow-md transition-all cursor-pointer"
                      >
                        Guardar Cliente a Crédito
                      </button>
                    </form>
                  )}

                  {/* Modal / Formulario Registrar Abono */}
                  {selectedClientForPayment && (
                    <div className="bg-[#141420] border-2 border-emerald-500/50 p-4 rounded-2xl space-y-3 animate-fadeIn">
                      <div className="flex justify-between items-center">
                        <h4 className="text-xs font-black text-emerald-400 uppercase tracking-wider">
                          💵 Registrar Abono para: {selectedClientForPayment.name}
                        </h4>
                        <button
                          onClick={() => setSelectedClientForPayment(null)}
                          className="text-gray-400 hover:text-white text-xs"
                        >
                          ✕ Cancelar
                        </button>
                      </div>

                      <p className="text-[11px] text-gray-300">
                        Saldo actual: <b>{formatUSD(selectedClientForPayment.balanceUSD)}</b> (Bs. {(selectedClientForPayment.balanceUSD * bcvRate).toFixed(2)})
                      </p>

                      <form onSubmit={handleRegisterPayment} className="grid grid-cols-2 gap-2 text-xs">
                        <div>
                          <label className="block text-[10px] text-gray-400 mb-1 font-bold">Monto Abonado ($ USD) *:</label>
                          <input
                            type="number"
                            step="0.01"
                            value={paymentAmountUSD}
                            onChange={(e) => setPaymentAmountUSD(e.target.value)}
                            placeholder="Ej: 20.00"
                            className="w-full bg-[#1C1C2C] border border-emerald-500/50 rounded-xl px-3 py-2 text-xs font-black text-emerald-400 focus:outline-none"
                            required
                          />
                        </div>

                        <div>
                          <label className="block text-[10px] text-gray-400 mb-1 font-bold">Método:</label>
                          <select
                            value={paymentMethod}
                            onChange={(e) => setPaymentMethod(e.target.value)}
                            className="w-full bg-[#1C1C2C] border border-white/10 rounded-xl px-2.5 py-2 text-xs font-bold text-white"
                          >
                            <option value="Pago Móvil">Pago Móvil</option>
                            <option value="Transferencia Bancaria">Transferencia Bancaria</option>
                            <option value="Efectivo USD">Efectivo USD</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-[10px] text-gray-400 mb-1 font-bold">Referencia (si aplica):</label>
                          <input
                            type="text"
                            value={paymentRef}
                            onChange={(e) => setPaymentRef(e.target.value)}
                            placeholder="Ej: Ref 492018"
                            className="w-full bg-[#1C1C2C] border border-white/10 rounded-xl px-3 py-2 text-xs font-semibold text-white"
                          />
                        </div>

                        <div>
                          <label className="block text-[10px] text-gray-400 mb-1 font-bold">Observaciones:</label>
                          <input
                            type="text"
                            value={paymentNotes}
                            onChange={(e) => setPaymentNotes(e.target.value)}
                            placeholder="Ej: Abono de quincena"
                            className="w-full bg-[#1C1C2C] border border-white/10 rounded-xl px-3 py-2 text-xs font-semibold text-white"
                          />
                        </div>

                        <div className="col-span-2 pt-1">
                          <button
                            type="submit"
                            className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black rounded-xl shadow-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                          >
                            <Receipt className="w-4 h-4" />
                            <span>Registrar Abono y Generar Recibo WhatsApp</span>
                          </button>
                        </div>
                      </form>
                    </div>
                  )}

                  {/* Modal / Formulario Agregar Nueva Compra al Cliente */}
                  {selectedClientForPurchase && (
                    <div className="bg-[#141420] border-2 border-pink-500/50 p-4 rounded-2xl space-y-3 animate-fadeIn">
                      <div className="flex justify-between items-center">
                        <h4 className="text-xs font-black text-pink-400 uppercase tracking-wider">
                          🛍️ Sumar Nueva Compra a: {selectedClientForPurchase.name}
                        </h4>
                        <button
                          onClick={() => setSelectedClientForPurchase(null)}
                          className="text-gray-400 hover:text-white text-xs"
                        >
                          ✕ Cancelar
                        </button>
                      </div>

                      <form onSubmit={handleAddPurchase} className="grid grid-cols-2 gap-2 text-xs">
                        <div>
                          <label className="block text-[10px] text-gray-400 mb-1 font-bold">Descripción de Prendas:</label>
                          <input
                            type="text"
                            value={purchaseDesc}
                            onChange={(e) => setPurchaseDesc(e.target.value)}
                            placeholder="Ej: 1 Jean Push Up Talla 32"
                            className="w-full bg-[#1C1C2C] border border-white/10 rounded-xl px-3 py-2 text-xs font-semibold text-white focus:outline-none"
                            required
                          />
                        </div>

                        <div>
                          <label className="block text-[10px] text-gray-400 mb-1 font-bold">Monto en $ USD *:</label>
                          <input
                            type="number"
                            step="0.01"
                            value={purchaseAmountUSD}
                            onChange={(e) => setPurchaseAmountUSD(e.target.value)}
                            placeholder="Ej: 25.00"
                            className="w-full bg-[#1C1C2C] border border-pink-500/50 rounded-xl px-3 py-2 text-xs font-black text-pink-400 focus:outline-none"
                            required
                          />
                        </div>

                        <div className="col-span-2 pt-1">
                          <button
                            type="submit"
                            className="w-full py-2 bg-pink-600 hover:bg-pink-500 text-white text-xs font-black rounded-xl shadow-md cursor-pointer"
                          >
                            Sumar a la Deuda del Cliente
                          </button>
                        </div>
                      </form>
                    </div>
                  )}

                  {/* Lista de Clientes con Crédito */}
                  <div className="space-y-3">
                    {filteredClients.map((client) => {
                      const totalPaid = client.payments.reduce((s, p) => s + p.amountUSD, 0);
                      return (
                        <div
                          key={client.id}
                          className="bg-[#141420] border border-white/10 hover:border-amber-500/40 p-4 rounded-2xl space-y-3 transition-all"
                        >
                          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                            <div>
                              <div className="flex items-center gap-2">
                                <h4 className="text-sm font-black text-white">{client.name}</h4>
                                <span className="text-[10px] font-bold bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded-full border border-emerald-500/20">
                                  Crédito Activo
                                </span>
                              </div>
                              <p className="text-[11px] text-gray-400">
                                Cédula: {client.idCard || 'S/N'} • Tel: {client.phone}
                              </p>
                              {client.notes && (
                                <p className="text-[10px] text-pink-300 italic">📝 {client.notes}</p>
                              )}
                            </div>

                            <div className="text-left sm:text-right">
                              <span className="text-[10px] text-gray-400 uppercase font-bold block">Debe Actualmente</span>
                              <div className="text-lg font-black text-amber-400">
                                {formatUSD(client.balanceUSD)} <span className="text-xs text-white">USD</span>
                              </div>
                              <div className="text-[11px] font-bold text-emerald-400">
                                {formatBS(client.balanceUSD)}
                              </div>
                            </div>
                          </div>

                          {/* Botones de Acción de Cobranza */}
                          <div className="flex flex-wrap gap-1.5 pt-1 border-t border-white/5">
                            <button
                              onClick={() => {
                                setSelectedClientForPayment(client);
                                setSelectedClientForPurchase(null);
                              }}
                              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-black rounded-xl transition-all flex items-center gap-1 cursor-pointer"
                            >
                              <Plus className="w-3.5 h-3.5" />
                              <span>Registrar Abono ($)</span>
                            </button>

                            <button
                              onClick={() => {
                                setSelectedClientForPurchase(client);
                                setSelectedClientForPayment(null);
                              }}
                              className="px-3 py-1.5 bg-pink-600/30 hover:bg-pink-600 text-pink-300 hover:text-white border border-pink-500/40 text-[11px] font-bold rounded-xl transition-all flex items-center gap-1 cursor-pointer"
                            >
                              <ShoppingBag className="w-3.5 h-3.5" />
                              <span>+ Sumar Compra</span>
                            </button>

                            {/* Enviar Recordatorio / Estado WhatsApp */}
                            <button
                              onClick={() => {
                                const msg = encodeURIComponent(
                                  `Hola ${client.name}! 👋 Te saludamos de *Mundo Moda Shop*.\n\n` +
                                  `Te recordamos el estado actual de tu cuenta de crédito:\n` +
                                  `💰 *Saldo pendiente:* $${client.balanceUSD.toFixed(2)} USD (Bs. ${(client.balanceUSD * bcvRate).toFixed(2)} a tasa BCV Bs. ${bcvRate.toFixed(2)})\n\n` +
                                  `💳 Puedes consultar tu estado de cuenta con tu cédula o teléfono en nuestro catálogo.\n\n` +
                                  `¿Deseas reportar un abono hoy por Pago Móvil, Transferencia o Efectivo? Quedamos a tu orden.`
                                );
                                window.open(`https://wa.me/${client.phone.replace(/\D/g, '')}?text=${msg}`, '_blank');
                              }}
                              className="px-3 py-1.5 bg-[#22C55E]/20 hover:bg-[#22C55E] text-green-300 hover:text-white border border-green-500/30 text-[11px] font-bold rounded-xl transition-all flex items-center gap-1 cursor-pointer"
                            >
                              <MessageCircle className="w-3.5 h-3.5" />
                              <span>Estado x WhatsApp</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => setDeleteTarget({ type: 'client', id: client.id, name: client.name })}
                              className="p-1.5 text-gray-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg ml-auto transition-colors cursor-pointer"
                              title="Eliminar Cliente"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>

                          {/* Historial de Abonos Recientes */}
                          {client.payments.length > 0 && (
                            <div className="bg-black/30 p-2 rounded-xl text-[10px] space-y-1">
                              <span className="font-bold text-gray-400 block">Últimos abonos:</span>
                              {client.payments.slice(0, 2).map((p) => (
                                <div key={p.id} className="flex justify-between text-gray-300">
                                  <span>{p.date} • {p.method} {p.reference ? `(${p.reference})` : ''}</span>
                                  <span className="font-bold text-emerald-400">+{formatUSD(p.amountUSD)} USD</span>
                                </div>
                              ))}
                            </div>
                          )}

                        </div>
                      );
                    })}
                  </div>

                </div>
              )}

              {/* ========================================================= */}
              {/* PESTAÑA 3: GESTIÓN MULTI-PRODUCTOS & CATÁLOGO             */}
              {/* ========================================================= */}
              {activeTab === 'products' && (
                <div className="space-y-4">
                  
                  {/* Mensaje de Acción Exitosa */}
                  {actionNotice && (
                    <div className="p-3 bg-emerald-500/15 border border-emerald-500/40 rounded-xl text-xs font-bold text-emerald-300 flex items-center justify-between animate-fadeIn">
                      <span>✓ {actionNotice}</span>
                      <button type="button" onClick={() => setActionNotice(null)} className="text-gray-400 hover:text-white ml-2 cursor-pointer">
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}

                  {/* Cabecera y Botones de Acción */}
                  <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2.5">
                    <div>
                      <h4 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
                        <ShoppingBag className="w-4 h-4 text-pink-400" />
                        Catálogo de Productos e Inventario ({products.length})
                      </h4>
                      <p className="text-[11px] text-gray-400">
                        Administra Jeans, Camisas, Colonias, Calzado, Vestidos y existencias
                      </p>
                    </div>

                    <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
                      <button
                        type="button"
                        onClick={() => setIsBulkUploadOpen(true)}
                        className="px-3.5 py-2 bg-gradient-to-r from-purple-600 via-pink-600 to-rose-600 hover:from-purple-500 hover:to-rose-500 text-white text-xs font-black rounded-xl transition-all shadow-md flex items-center justify-center gap-1.5 cursor-pointer shrink-0"
                        title="Subir varias fotos a la vez para registrar mercancía rápido"
                      >
                        <Sparkles className="w-4 h-4 text-amber-300" />
                        <span>⚡ Carga Masiva x Fotos</span>
                      </button>

                      <button
                        type="button"
                        onClick={handleExportInventoryExcel}
                        disabled={isExportingInventory || products.length === 0}
                        className="px-3.5 py-2 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 border border-emerald-500/40 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 shadow-sm cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
                        title="Descargar archivo Excel con todo el inventario de productos, tallas, precios en USD y Bs"
                      >
                        <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
                        <span>{isExportingInventory ? 'Generando...' : 'Descargar Inventario Excel'}</span>
                      </button>

                      <button
                        onClick={() => {
                          if (showAddProduct) {
                            handleCancelProductForm();
                          } else {
                            setShowAddProduct(true);
                            setEditingProductId(null);
                          }
                        }}
                        className="px-3.5 py-2 bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-500 hover:to-rose-500 text-white text-xs font-black rounded-xl transition-all shadow-lg flex items-center justify-center gap-1.5 cursor-pointer shrink-0"
                      >
                        {showAddProduct ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                        <span>{showAddProduct ? 'Cerrar Formulario' : '+ Agregar Nuevo Producto'}</span>
                      </button>
                    </div>
                  </div>

                  {/* Formulario Agregar / Editar Producto */}
                  {showAddProduct && (
                    <form onSubmit={handleSaveProductSubmit} className="bg-[#141420] border-2 border-pink-500/50 p-4 sm:p-5 rounded-2xl space-y-4 shadow-[0_0_25px_rgba(255,46,147,0.15)] animate-fadeIn">
                      
                      <div className="flex items-center justify-between border-b border-white/10 pb-2.5">
                        <div className="flex items-center gap-2">
                          <Sparkles className="w-4 h-4 text-pink-400" />
                          <h4 className="text-xs font-black text-pink-400 uppercase tracking-wider">
                            {editingProductId ? '✏️ Editar Datos del Producto' : '✨ Nuevo Producto para el Catálogo'}
                          </h4>
                        </div>
                        {editingProductId && (
                          <span className="text-[10px] bg-pink-500/20 text-pink-300 font-bold px-2 py-0.5 rounded-full border border-pink-500/30">
                            Modificando ID: {editingProductId}
                          </span>
                        )}
                      </div>

                      {/* Selector Visual de Tipo de Producto */}
                      <div>
                        <label className="block text-[11px] text-pink-300 font-black mb-1.5">
                          1. Selecciona el Tipo de Producto *:
                        </label>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                          {[
                            { id: 'jean', label: '👖 Jeans & Denim' },
                            { id: 'camisa', label: '👚 Camisas / Tops' },
                            { id: 'colonia', label: '🌸 Perfumes / Colonias' },
                            { id: 'zapatos', label: '👟 Calzado / Zapatos' },
                            { id: 'vestido', label: '👗 Vestidos' },
                            { id: 'accesorio', label: '👜 Accesorios / Bolsos' },
                            { id: 'conjunto', label: '✨ Conjuntos' },
                            { id: 'otro', label: '🏷️ Otro Producto' },
                          ].map((t) => (
                            <button
                              key={t.id}
                              type="button"
                              onClick={() => handleTypeSelect(t.id)}
                              className={`py-2 px-2.5 rounded-xl text-xs font-black transition-all text-left truncate cursor-pointer ${
                                prodType === t.id
                                  ? 'bg-gradient-to-r from-pink-600 to-rose-600 text-white shadow-md ring-1 ring-white/40'
                                  : 'bg-[#1C1C2C] text-gray-300 hover:text-white hover:bg-white/10 border border-white/10'
                              }`}
                            >
                              {t.label}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Campos Principales */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                        
                        <div className="sm:col-span-2">
                          <label className="block text-[10px] text-gray-300 mb-1 font-bold">
                            Nombre del Producto / Fragancia / Prenda *:
                          </label>
                          <input
                            type="text"
                            value={prodName}
                            onChange={(e) => setProdName(e.target.value)}
                            placeholder={
                              prodType === 'colonia' 
                                ? 'Ej: Perfume Rosé Sweet Paris 100ml / Colonia Dama'
                                : prodType === 'camisa'
                                ? 'Ej: Blusa Satín Manga Larga Elegante / Camisa Lino'
                                : prodType === 'zapatos'
                                ? 'Ej: Sneakers Blancos Plataforma Confort'
                                : 'Ej: Jean Wide Leg Celeste Nevada Tiro Alto'
                            }
                            className="w-full bg-[#1C1C2C] border border-white/15 rounded-xl px-3 py-2.5 text-xs font-bold text-white focus:outline-none focus:border-pink-500"
                            required
                          />
                        </div>

                        <div>
                          <label className="block text-[10px] text-gray-300 mb-1 font-bold">Para quién es (Categoría):</label>
                          <select
                            value={prodCategory}
                            onChange={(e) => setProdCategory(e.target.value as 'dama' | 'caballero' | 'unisex')}
                            className="w-full bg-[#1C1C2C] border border-white/15 rounded-xl px-3 py-2.5 text-xs font-bold text-white focus:outline-none focus:border-pink-500"
                          >
                            <option value="dama">👩 Dama / Mujer</option>
                            <option value="caballero">👨 Caballero / Hombre</option>
                            <option value="unisex">🌟 Unisex / Todo Público</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-[10px] text-gray-300 mb-1 font-bold">
                            {prodType === 'colonia' ? 'Estilo de Fragancia / Tipo:' : prodType === 'zapatos' ? 'Tipo de Calzado:' : 'Corte / Silueta / Modelo:'}
                          </label>
                          <input
                            type="text"
                            value={prodCut}
                            onChange={(e) => setProdCut(e.target.value)}
                            placeholder="Ej: Wide Leg / Floral Frutal / Manga Larga"
                            className="w-full bg-[#1C1C2C] border border-white/15 rounded-xl px-3 py-2.5 text-xs font-bold text-white focus:outline-none focus:border-pink-500"
                          />
                        </div>

                        <div>
                          <label className="block text-[10px] text-pink-300 mb-1 font-black">
                            Precio de Venta ($ USD) *:
                          </label>
                          <div className="relative">
                            <span className="absolute left-3 top-2.5 text-pink-400 font-bold">$</span>
                            <input
                              type="number"
                              step="0.01"
                              value={prodPriceUSD}
                              onChange={(e) => setProdPriceUSD(e.target.value)}
                              placeholder="Ej: 25.00"
                              className="w-full bg-[#1C1C2C] border-2 border-pink-500/50 rounded-xl pl-7 pr-3 py-2 text-xs font-black text-pink-400 focus:outline-none focus:border-pink-400"
                              required
                            />
                          </div>
                          {prodPriceUSD && (
                            <p className="text-[10px] text-emerald-400 font-bold mt-1">
                              ≈ {formatBS(parseFloat(prodPriceUSD) || 0)} (Tasa BCV {bcvRate.toFixed(2)})
                            </p>
                          )}
                        </div>

                        <div>
                          <label className="block text-[10px] text-gray-300 mb-1 font-bold">
                            Etiqueta Destacada (Badge):
                          </label>
                          <input
                            type="text"
                            value={prodTag}
                            onChange={(e) => setProdTag(e.target.value)}
                            placeholder="Ej: 🔥 MÁS VENDIDO / 💖 ALTA FIJACIÓN"
                            className="w-full bg-[#1C1C2C] border border-white/15 rounded-xl px-3 py-2 text-xs font-semibold text-white focus:outline-none focus:border-pink-500"
                          />
                          <div className="flex gap-1 mt-1 overflow-x-auto py-0.5">
                            {['🔥 MÁS VENDIDO', '💖 ALTA FIJACIÓN', '✨ NUEVO', '🍑 PUSH-UP', '⭐ TENDENCIA'].map(t => (
                              <button
                                key={t}
                                type="button"
                                onClick={() => setProdTag(t)}
                                className="text-[9px] bg-white/5 hover:bg-pink-500/20 text-gray-300 hover:text-pink-300 px-1.5 py-0.5 rounded-md shrink-0 border border-white/5"
                              >
                                {t}
                              </button>
                            ))}
                          </div>
                        </div>

                        <div className="sm:col-span-2">
                          <label className="block text-[10px] text-gray-300 mb-1 font-bold">
                            Tallas o Presentaciones Disponibles (separadas por coma):
                          </label>
                          <input
                            type="text"
                            value={prodSizes}
                            onChange={(e) => setProdSizes(e.target.value)}
                            placeholder="Ej: S, M, L, XL  o  28, 30, 32, 34  o  100 ml"
                            className="w-full bg-[#1C1C2C] border border-white/15 rounded-xl px-3 py-2 text-xs font-semibold text-white focus:outline-none focus:border-pink-500"
                          />
                          <div className="flex gap-1.5 mt-1.5 items-center text-[10px] text-gray-400">
                            <span className="font-bold">Plantillas rápidas:</span>
                            <button
                              type="button"
                              onClick={() => setProdSizes('S, M, L, XL')}
                              className="px-2 py-0.5 bg-white/10 hover:bg-white/20 text-white rounded-md font-bold"
                            >
                              S, M, L, XL
                            </button>
                            <button
                              type="button"
                              onClick={() => setProdSizes('28, 30, 32, 34, 36')}
                              className="px-2 py-0.5 bg-white/10 hover:bg-white/20 text-white rounded-md font-bold"
                            >
                              28..36
                            </button>
                            <button
                              type="button"
                              onClick={() => setProdSizes('36, 37, 38, 39, 40')}
                              className="px-2 py-0.5 bg-white/10 hover:bg-white/20 text-white rounded-md font-bold"
                            >
                              36..40
                            </button>
                            <button
                              type="button"
                              onClick={() => setProdSizes('100 ml')}
                              className="px-2 py-0.5 bg-white/10 hover:bg-white/20 text-white rounded-md font-bold"
                            >
                              100 ml
                            </button>
                            <button
                              type="button"
                              onClick={() => setProdSizes('Única')}
                              className="px-2 py-0.5 bg-white/10 hover:bg-white/20 text-white rounded-md font-bold"
                            >
                              Única
                            </button>
                          </div>
                        </div>

                        {/* Foto del Producto */}
                        <div className="sm:col-span-2 bg-[#10101A] p-3 rounded-xl border border-white/10 space-y-2">
                          <label className="block text-[11px] text-pink-300 font-black">
                            Foto del Producto:
                          </label>

                          <div className="flex items-center gap-3">
                            {prodImage && prodImage.trim() !== '' ? (
                              <img
                                src={prodImage}
                                alt="Vista previa"
                                className="w-16 h-20 object-cover rounded-xl border border-pink-500/40 shrink-0"
                                onError={(e) => {
                                  const target = e.currentTarget;
                                  if (target.src !== DEFAULT_PRODUCT_IMAGE) {
                                    target.src = DEFAULT_PRODUCT_IMAGE;
                                  }
                                }}
                              />
                            ) : (
                              <div className="w-16 h-20 bg-white/5 rounded-xl border border-dashed border-white/20 flex flex-col items-center justify-center text-gray-500 text-[9px] shrink-0">
                                <Upload className="w-4 h-4 mb-1" />
                                Sin Foto
                              </div>
                            )}

                            <div className="flex-1 space-y-2">
                              {/* Botón Subir Archivo */}
                              <label className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white text-xs font-bold rounded-xl shadow hover:opacity-90">
                                <Upload className="w-3.5 h-3.5" />
                                <span>Cargar Foto desde Celular / PC</span>
                                <input
                                  type="file"
                                  accept="image/*"
                                  onChange={handleImageFileUpload}
                                  className="hidden"
                                />
                              </label>

                              {/* O pegar URL */}
                              <input
                                type="url"
                                value={prodImage}
                                onChange={(e) => setProdImage(e.target.value)}
                                placeholder="O pega el link URL de la foto..."
                                className="w-full bg-[#1C1C2C] border border-white/15 rounded-xl px-3 py-1.5 text-xs text-white placeholder:text-gray-500 focus:outline-none focus:border-pink-500"
                              />
                            </div>
                          </div>
                        </div>

                      </div>

                      {/* Botones Guardar / Cancelar */}
                      <div className="flex gap-2 pt-2">
                        {editingProductId && (
                          <button
                            type="button"
                            onClick={() => {
                              const p = products.find(prod => prod.id === editingProductId);
                              setDeleteTarget({
                                type: 'product',
                                id: editingProductId,
                                name: p?.name || prodName || 'Esta prenda'
                              });
                            }}
                            className="px-3 py-2.5 bg-rose-600/20 hover:bg-rose-600/30 text-rose-400 border border-rose-500/30 text-xs font-bold rounded-xl cursor-pointer flex items-center gap-1.5 shrink-0 transition-colors"
                            title="Eliminar esta prenda definitivamente"
                          >
                            <Trash2 className="w-4 h-4" />
                            <span className="hidden sm:inline">Eliminar Prenda</span>
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={handleCancelProductForm}
                          className="flex-1 py-2.5 bg-white/10 hover:bg-white/15 text-gray-300 text-xs font-bold rounded-xl cursor-pointer"
                        >
                          Cancelar
                        </button>
                        <button
                          type="submit"
                          className="flex-2 py-2.5 bg-gradient-to-r from-pink-600 via-rose-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 text-white text-xs font-black rounded-xl shadow-lg cursor-pointer flex items-center justify-center gap-1.5"
                        >
                          <Check className="w-4 h-4" />
                          <span>{editingProductId ? 'Guardar Cambios del Producto' : 'Publicar Producto en Catálogo'}</span>
                        </button>
                      </div>

                    </form>
                  )}

                  {/* Filtro y Búsqueda en la lista de productos */}
                  <div className="flex flex-col sm:flex-row gap-2">
                    <div className="relative flex-1">
                      <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-3" />
                      <input
                        type="text"
                        value={productSearch}
                        onChange={(e) => setProductSearch(e.target.value)}
                        placeholder="Buscar por nombre o corte..."
                        className="w-full bg-[#141420] border border-white/10 rounded-xl pl-8 pr-3 py-2 text-xs text-white focus:outline-none focus:border-pink-500"
                      />
                    </div>

                    <select
                      value={productFilterType}
                      onChange={(e) => setProductFilterType(e.target.value)}
                      className="bg-[#141420] border border-white/10 rounded-xl px-3 py-2 text-xs font-bold text-pink-300 focus:outline-none shrink-0"
                    >
                      <option value="all">Todas las categorías</option>
                      <option value="jean">👖 Jeans</option>
                      <option value="camisa">👚 Camisas / Tops</option>
                      <option value="colonia">🌸 Perfumes / Colonias</option>
                      <option value="zapatos">👟 Calzado</option>
                      <option value="vestido">👗 Vestidos</option>
                      <option value="accesorio">👜 Accesorios</option>
                      <option value="conjunto">✨ Conjuntos</option>
                      <option value="otro">🏷️ Otros</option>
                    </select>
                  </div>

                  {/* Lista de Productos */}
                  <div className="space-y-2">
                    {products
                      .filter((prod) => {
                        const matchesSearch = 
                          prod.name.toLowerCase().includes(productSearch.toLowerCase()) ||
                          prod.id.toLowerCase().includes(productSearch.toLowerCase()) ||
                          (prod.cut && prod.cut.toLowerCase().includes(productSearch.toLowerCase()));
                        const matchesType = productFilterType === 'all' || prod.productType === productFilterType;
                        return matchesSearch && matchesType;
                      })
                      .map((prod) => {
                        const typeEmoji = 
                          prod.productType === 'colonia' ? '🌸' :
                          prod.productType === 'camisa' ? '👚' :
                          prod.productType === 'zapatos' ? '👟' :
                          prod.productType === 'vestido' ? '👗' :
                          prod.productType === 'accesorio' ? '👜' :
                          prod.productType === 'conjunto' ? '✨' : '👖';

                        return (
                          <div
                            key={prod.id}
                            className="bg-[#141420] border border-white/10 hover:border-pink-500/30 p-3 rounded-2xl flex items-center justify-between gap-3 transition-all"
                          >
                            <img
                              src={prod.image && prod.image.trim() !== '' ? prod.image : DEFAULT_PRODUCT_IMAGE}
                              alt={prod.name}
                              className="w-12 h-14 object-cover rounded-xl shrink-0 bg-white/5"
                              onError={(e) => {
                                const target = e.currentTarget;
                                if (target.src !== DEFAULT_PRODUCT_IMAGE) {
                                  target.src = DEFAULT_PRODUCT_IMAGE;
                                }
                              }}
                            />

                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="text-[10px] bg-pink-500/20 text-pink-300 font-black px-1.5 py-0.5 rounded-md uppercase">
                                  {typeEmoji} {prod.productType || 'jean'}
                                </span>
                                <h4 className="text-xs font-black text-white truncate">{prod.name}</h4>
                              </div>
                              
                              <p className="text-[10px] text-gray-400 truncate mt-0.5">
                                {prod.id} • {prod.category} {prod.cut ? `• ${prod.cut}` : ''} • Tallas: [{prod.availableSizes?.join(', ')}]
                              </p>
                            </div>

                            {/* Editor Rápido de Precio en USD */}
                            <div className="flex items-center gap-1 text-xs shrink-0">
                              <span className="text-pink-400 font-bold">$</span>
                              <input
                                type="number"
                                step="1"
                                defaultValue={prod.priceUSD}
                                onBlur={(e) => {
                                  const val = parseFloat(e.target.value);
                                  if (!isNaN(val)) updateProduct(prod.id, { priceUSD: val });
                                }}
                                className="w-14 bg-[#1C1C2C] border border-white/15 text-pink-400 font-black px-1.5 py-1 rounded-lg text-center"
                              />
                              <span className="text-[10px] text-emerald-400 font-bold hidden sm:inline">
                                ({formatBS(prod.priceUSD)})
                              </span>
                            </div>

                            {/* Botón Editar y Eliminar */}
                            <div className="flex items-center gap-1 shrink-0">
                              <button
                                onClick={() => handleStartEditProduct(prod)}
                                className="p-1.5 text-gray-400 hover:text-pink-400 hover:bg-white/5 rounded-lg transition-colors cursor-pointer"
                                title="Editar producto"
                              >
                                <Edit3 className="w-4 h-4" />
                              </button>

                              <button
                                type="button"
                                onClick={() => setDeleteTarget({ type: 'product', id: prod.id, name: prod.name })}
                                className="p-1.5 text-gray-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors cursor-pointer"
                                title="Eliminar Prenda"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>

                          </div>
                        );
                      })}
                  </div>

                </div>
              )}

              {/* ========================================================= */}
              {/* PESTAÑA 4: SEGURIDAD, CAMBIO DE CLAVE & RECUPERACIÓN      */}
              {/* ========================================================= */}
              {activeTab === 'security' && (
                <form onSubmit={handleSaveSecuritySettings} className="space-y-5 animate-fadeIn">
                  
                  {/* Encabezado del Módulo de Seguridad */}
                  <div className="bg-gradient-to-r from-emerald-900/30 via-teal-900/20 to-purple-900/30 border border-emerald-500/40 p-4 sm:p-5 rounded-2xl space-y-2 shadow-lg">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
                        <ShieldCheck className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="text-sm font-black text-white uppercase tracking-wider">
                          Seguridad y Clave de la Administradora
                        </h4>
                        <p className="text-[11px] text-gray-300">
                          Cambia tu PIN cuando lo desees y configura tu pregunta secreta de respaldo en caso de olvido.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Notificación de Éxito / Error */}
                  {securityNotice && (
                    <div
                      className={`p-3.5 rounded-2xl text-xs font-bold flex items-center gap-2 border animate-fadeIn ${
                        securityNotice.type === 'success'
                          ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300'
                          : 'bg-rose-500/15 border-rose-500/40 text-rose-300'
                      }`}
                    >
                      {securityNotice.type === 'success' ? (
                        <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                      ) : (
                        <X className="w-4 h-4 text-rose-400 shrink-0" />
                      )}
                      <span>{securityNotice.text}</span>
                    </div>
                  )}

                  {/* SECCIÓN 1: CAMBIO DE PIN / CLAVE */}
                  <div className="bg-[#141420] border border-white/10 p-4 sm:p-5 rounded-2xl space-y-4">
                    <div className="flex items-center justify-between border-b border-white/5 pb-2.5">
                      <h4 className="text-xs font-black text-pink-400 uppercase tracking-wider flex items-center gap-1.5">
                        <Key className="w-4 h-4" /> 1. Cambiar PIN / Clave de Acceso
                      </h4>
                      <span className="text-[10px] text-gray-400">
                        (Deja en blanco si solo deseas cambiar la pregunta)
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                      {/* PIN Actual */}
                      <div>
                        <label className="block text-[10px] text-gray-300 font-bold mb-1">
                          PIN Actual:
                        </label>
                        <div className="relative">
                          <input
                            type={showCurrentPin ? 'text' : 'password'}
                            value={currentPinInput}
                            onChange={(e) => setCurrentPinInput(e.target.value)}
                            placeholder="PIN actual"
                            className="w-full bg-[#1C1C2C] border border-white/15 rounded-xl px-3 py-2 text-xs font-bold text-white pr-9 focus:outline-none focus:border-pink-500"
                          />
                          <button
                            type="button"
                            onClick={() => setShowCurrentPin(!showCurrentPin)}
                            className="absolute right-2.5 top-2.5 text-gray-400 hover:text-white"
                          >
                            {showCurrentPin ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                      </div>

                      {/* Nuevo PIN */}
                      <div>
                        <label className="block text-[10px] text-emerald-300 font-bold mb-1">
                          Nuevo PIN (mín. 4 dígitos):
                        </label>
                        <div className="relative">
                          <input
                            type={showNewPin ? 'text' : 'password'}
                            value={newPinInput}
                            onChange={(e) => setNewPinInput(e.target.value)}
                            placeholder="Nuevo PIN"
                            className="w-full bg-[#1C1C2C] border border-emerald-500/40 rounded-xl px-3 py-2 text-xs font-bold text-emerald-300 pr-9 focus:outline-none focus:border-emerald-400"
                          />
                          <button
                            type="button"
                            onClick={() => setShowNewPin(!showNewPin)}
                            className="absolute right-2.5 top-2.5 text-gray-400 hover:text-white"
                          >
                            {showNewPin ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                      </div>

                      {/* Confirmar Nuevo PIN */}
                      <div>
                        <label className="block text-[10px] text-emerald-300 font-bold mb-1">
                          Confirmar Nuevo PIN:
                        </label>
                        <input
                          type={showNewPin ? 'text' : 'password'}
                          value={confirmNewPinInput}
                          onChange={(e) => setConfirmNewPinInput(e.target.value)}
                          placeholder="Repite el nuevo PIN"
                          className="w-full bg-[#1C1C2C] border border-emerald-500/40 rounded-xl px-3 py-2 text-xs font-bold text-emerald-300 focus:outline-none focus:border-emerald-400"
                        />
                      </div>
                    </div>
                  </div>

                  {/* SECCIÓN 2: PREGUNTA Y RESPUESTA DE SEGURIDAD */}
                  <div className="bg-[#141420] border border-white/10 p-4 sm:p-5 rounded-2xl space-y-4">
                    <div className="flex items-center justify-between border-b border-white/5 pb-2.5">
                      <h4 className="text-xs font-black text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                        <HelpCircle className="w-4 h-4" /> 2. Pregunta Secreta para Recuperar tu Clave
                      </h4>
                      <span className="text-[10px] bg-amber-500/20 text-amber-300 font-bold px-2 py-0.5 rounded-full border border-amber-500/30">
                        🛡️ Respaldo de Olvido
                      </span>
                    </div>

                    <p className="text-[11px] text-gray-400">
                      Si alguna vez no recuerdas tu PIN, podrás responder a esta pregunta desde la pantalla de inicio para restablecer tu clave sin perder nada.
                    </p>

                    <div className="space-y-3 text-xs">
                      {/* Selector de Pregunta */}
                      <div>
                        <label className="block text-[10px] text-gray-300 font-bold mb-1">
                          Selecciona o personaliza tu Pregunta de Seguridad:
                        </label>
                        <select
                          value={secQuestionPreset}
                          onChange={(e) => setSecQuestionPreset(e.target.value)}
                          className="w-full bg-[#1C1C2C] border border-white/15 rounded-xl px-3 py-2.5 text-xs font-bold text-white focus:outline-none focus:border-amber-500"
                        >
                          <option value="¿Cuál es el nombre de tu boutique o tienda favorita?">
                            🏪 ¿Cuál es el nombre de tu boutique o tienda favorita?
                          </option>
                          <option value="¿Cuál fue el nombre de tu primera mascota?">
                            🐾 ¿Cuál fue el nombre de tu primera mascota?
                          </option>
                          <option value="¿Cuál es tu perfume o fragancia favorita?">
                            🌸 ¿Cuál es tu perfume o fragancia favorita?
                          </option>
                          <option value="¿En qué ciudad naciste o abriste tu negocio?">
                            📍 ¿En qué ciudad naciste o abriste tu negocio?
                          </option>
                          <option value="¿Cuál es tu color o prenda de moda preferida?">
                            👗 ¿Cuál es tu color o prenda de moda preferida?
                          </option>
                          <option value="personalizada">
                            ✏️ Escribir mi propia pregunta personalizada...
                          </option>
                        </select>
                      </div>

                      {/* Input para Pregunta Personalizada */}
                      {secQuestionPreset === 'personalizada' && (
                        <div>
                          <label className="block text-[10px] text-amber-300 font-bold mb-1">
                            Escribe tu Pregunta Personalizada:
                          </label>
                          <input
                            type="text"
                            value={customQuestionInput}
                            onChange={(e) => setCustomQuestionInput(e.target.value)}
                            placeholder="Ej: ¿Cómo se llama mi mejor amiga de la infancia?"
                            className="w-full bg-[#1C1C2C] border border-amber-500/40 rounded-xl px-3 py-2 text-xs font-bold text-white focus:outline-none focus:border-amber-400"
                            required
                          />
                        </div>
                      )}

                      {/* Respuesta Secreta */}
                      <div>
                        <label className="block text-[10px] text-amber-300 font-bold mb-1">
                          Respuesta Secreta a la Pregunta *:
                        </label>
                        <input
                          type="text"
                          value={secAnswerInput}
                          onChange={(e) => setSecAnswerInput(e.target.value)}
                          placeholder="Ej: mundo moda / toby / parís"
                          className="w-full bg-[#1C1C2C] border-2 border-amber-500/40 rounded-xl px-3 py-2.5 text-xs font-black text-amber-300 focus:outline-none focus:border-amber-400"
                          required
                        />
                        <p className="text-[10px] text-gray-500 mt-1">
                          * Nota: No distingue entre mayúsculas y minúsculas. Solo tú debes conocer esta respuesta.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Botón Guardar Cambios */}
                  <div className="pt-2">
                    <button
                      type="submit"
                      className="w-full py-3 bg-gradient-to-r from-emerald-600 via-teal-600 to-pink-600 hover:from-emerald-500 hover:to-pink-500 text-white text-xs font-black rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-98"
                    >
                      <Check className="w-4 h-4" />
                      <span>Guardar Cambios de Clave y Seguridad</span>
                    </button>
                  </div>

                </form>
              )}

            </div>

          </div>
        )}

        {/* Bulk Product Upload Modal */}
        <BulkProductUploadModal
          isOpen={isBulkUploadOpen}
          onClose={() => setIsBulkUploadOpen(false)}
        />

        {/* Modal de Confirmación de Eliminación Seguro (Sin confirm() nativo que falla en iframes) */}
        {deleteTarget && (
          <div className="fixed inset-0 z-[80] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
            <div className="bg-[#181828] border-2 border-rose-500/60 rounded-3xl max-w-md w-full p-5 sm:p-6 text-white shadow-[0_0_40px_rgba(244,63,94,0.3)] space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-rose-500/20 border border-rose-500/40 flex items-center justify-center text-rose-400 shrink-0">
                  <Trash2 className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="text-sm sm:text-base font-black text-white">
                    {deleteTarget.type === 'product' ? '¿Eliminar Prenda del Catálogo?' : '¿Eliminar Ficha de Crédito?'}
                  </h4>
                  <p className="text-xs text-rose-300/90 font-medium">
                    Esta acción es inmediata y se sincroniza en la tienda y en la nube.
                  </p>
                </div>
              </div>

              <div className="p-3.5 bg-black/40 border border-white/10 rounded-2xl">
                <span className="text-[10px] text-gray-400 uppercase tracking-wider block font-bold">
                  {deleteTarget.type === 'product' ? 'Prenda seleccionada:' : 'Cliente seleccionado:'}
                </span>
                <p className="text-sm font-black text-white mt-1 break-words">
                  {deleteTarget.name}
                </p>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setDeleteTarget(null)}
                  className="flex-1 py-2.5 bg-white/10 hover:bg-white/15 text-gray-300 text-xs font-bold rounded-xl transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleExecuteDelete}
                  className="flex-1 py-2.5 bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white text-xs font-black rounded-xl shadow-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer active:scale-98"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Sí, Eliminar Ahora</span>
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
