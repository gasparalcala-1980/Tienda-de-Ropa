import { Product, PaymentConfig, CreditClient } from '../types';

export const DEFAULT_PRODUCT_IMAGE = "https://images.unsplash.com/photo-1541099649105-f69ad21f3246?auto=format&fit=crop&w=700&q=80";

export const INITIAL_PAYMENT_CONFIG: PaymentConfig = {
  bcvRate: 37.50,
  lastRateUpdate: "En vivo",
  isAutoRate: true,
  whatsappNumber: "584120000000",
  adminPin: "1234",
  securityQuestion: "¿Cuál es el nombre de tu boutique o tienda favorita?",
  securityAnswer: "mundo moda",
  pagoMovil: {
    bank: "Banesco (0134)",
    phone: "0412-1234567",
    idNumber: "V-24.567.890",
    holderName: "Mundo Moda Shop C.A."
  },
  transferencia: {
    bank: "Banesco Banco Universal",
    accountNumber: "0134-0000-00-0000000000",
    idNumber: "J-50123456-7",
    holderName: "Mundo Moda Shop C.A.",
    accountType: "Cuenta Corriente"
  },
  efectivo: {
    instructions: "Billetes en buen estado (sin roturas ni manchas). Entrega personal o en boutique."
  }
};

export const INITIAL_PRODUCTS: Product[] = [
  // --- JEANS DAMAS ---
  {
    id: "MMS-1042",
    name: "Jean Wide Leg Celeste Hielo High-Rise",
    productType: "jean",
    category: "dama",
    cut: "Wide Leg",
    priceUSD: 24.00,
    tag: "🔥 MÁS VENDIDO",
    rating: 4.9,
    reviewsCount: 142,
    description: "Tiro alto esculpido, bota ancha fluida y lavado celeste hielo vintage en mezclilla confort de alto gramaje.",
    image: "https://images.unsplash.com/photo-1541099649105-f69ad21f3246?auto=format&fit=crop&w=700&q=80",
    gallery: [
      "https://images.unsplash.com/photo-1541099649105-f69ad21f3246?auto=format&fit=crop&w=1000&q=85",
      "https://images.unsplash.com/photo-1582533561751-ef6f6ab93a2e?auto=format&fit=crop&w=1000&q=85"
    ],
    availableSizes: ["28", "30", "32", "34"],
    inStock: true
  },
  {
    id: "MMS-3011",
    name: "Jean Push-Up Levanta Cola 3 Botones",
    productType: "jean",
    category: "dama",
    cut: "Push-Up (3 Botones)",
    priceUSD: 25.00,
    tag: "🍑 EFECTO PUSH-UP",
    rating: 5.0,
    reviewsCount: 218,
    description: "Pretina faja anatómica de 3 botones, costuras en corazón levanta cola y mezclilla bi-stretch súper moldeadora.",
    image: "https://images.unsplash.com/photo-1582533561751-ef6f6ab93a2e?auto=format&fit=crop&w=700&q=80",
    gallery: [
      "https://images.unsplash.com/photo-1582533561751-ef6f6ab93a2e?auto=format&fit=crop&w=1000&q=85",
      "https://images.unsplash.com/photo-1541099649105-f69ad21f3246?auto=format&fit=crop&w=1000&q=85"
    ],
    availableSizes: ["28", "30", "32", "34"],
    inStock: true
  },
  {
    id: "MMS-5014",
    name: "Jean Cargo Denim Multi-Bolsillos",
    productType: "jean",
    category: "dama",
    cut: "Cargo Denim",
    priceUSD: 26.00,
    tag: "STREETWEAR",
    rating: 4.9,
    reviewsCount: 110,
    description: "Bolsillos fuelle laterales funcionales, corte relajado y tejido denim premium ultra resistente.",
    image: "https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?auto=format&fit=crop&w=700&q=80",
    gallery: [
      "https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?auto=format&fit=crop&w=1000&q=85"
    ],
    availableSizes: ["28", "30", "32", "34"],
    inStock: true
  },

  // --- JEANS CABALLEROS ---
  {
    id: "MMS-M101",
    name: "Jean Caballero Slim Fit Azul Índigo",
    productType: "jean",
    category: "caballero",
    cut: "Slim Fit",
    priceUSD: 25.00,
    tag: "TOP CABALLERO",
    rating: 4.9,
    reviewsCount: 130,
    description: "Corte Slim estructurado pero flexible, denim con 2% elastano para máximo confort diario.",
    image: "https://images.unsplash.com/photo-1604176354204-9268737828e4?auto=format&fit=crop&w=700&q=80",
    gallery: [
      "https://images.unsplash.com/photo-1604176354204-9268737828e4?auto=format&fit=crop&w=1000&q=85"
    ],
    availableSizes: ["30", "32", "34", "36", "38"],
    inStock: true
  },

  // --- BLUSAS & CAMISAS ---
  {
    id: "MMS-C201",
    name: "Blusa Elegante Satinada Cuello V",
    productType: "camisa",
    category: "dama",
    cut: "Seda & Satén",
    priceUSD: 18.00,
    tag: "✨ NUEVA COLECCIÓN",
    rating: 4.9,
    reviewsCount: 88,
    description: "Confeccionada en suave satén premium con caída fluida. Ideal para ocasiones casuales y eventos especiales.",
    image: "https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?auto=format&fit=crop&w=700&q=80",
    gallery: [
      "https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?auto=format&fit=crop&w=1000&q=85"
    ],
    availableSizes: ["S", "M", "L"],
    inStock: true
  },
  {
    id: "MMS-C202",
    name: "Camisa Casual Caballero Lino Confort",
    productType: "camisa",
    category: "caballero",
    cut: "Manga Corta / Lino",
    priceUSD: 22.00,
    tag: "FRESCA & MODERNA",
    rating: 4.8,
    reviewsCount: 64,
    description: "Tejido de lino suave y transpirable, corte contemporáneo perfecto para clima cálido.",
    image: "https://images.unsplash.com/photo-1596755094514-f87e34085b2c?auto=format&fit=crop&w=700&q=80",
    gallery: [
      "https://images.unsplash.com/photo-1596755094514-f87e34085b2c?auto=format&fit=crop&w=1000&q=85"
    ],
    availableSizes: ["S", "M", "L", "XL"],
    inStock: true
  },

  // --- PERFUMES & COLONIAS ---
  {
    id: "MMS-P301",
    name: "Perfume Dama Glamour Rosé Eau de Parfum (100ml)",
    productType: "colonia",
    category: "dama",
    cut: "Floral Frutal Dulce",
    priceUSD: 30.00,
    tag: "💖 ALTA FIJACIÓN",
    rating: 5.0,
    reviewsCount: 156,
    description: "Notas de jazmín, fresas silvestres y vainilla bourbon. Fragancia duradera de proyección cautivadora.",
    image: "https://images.unsplash.com/photo-1541643600914-78b084683601?auto=format&fit=crop&w=700&q=80",
    gallery: [
      "https://images.unsplash.com/photo-1541643600914-78b084683601?auto=format&fit=crop&w=1000&q=85"
    ],
    availableSizes: ["100 ml"],
    inStock: true
  },
  {
    id: "MMS-P302",
    name: "Colonia Caballero Black Intense (100ml)",
    productType: "colonia",
    category: "caballero",
    cut: "Amaderada Especiada",
    priceUSD: 32.00,
    tag: "🔥 EXCLUSIVA",
    rating: 4.9,
    reviewsCount: 94,
    description: "Esencia masculina con acordes de cedro, ámbar negro, bergamota y cuero refinado.",
    image: "https://images.unsplash.com/photo-1523293182086-7651a899d37f?auto=format&fit=crop&w=700&q=80",
    gallery: [
      "https://images.unsplash.com/photo-1523293182086-7651a899d37f?auto=format&fit=crop&w=1000&q=85"
    ],
    availableSizes: ["100 ml"],
    inStock: true
  },

  // --- ZAPATOS & CALZADO ---
  {
    id: "MMS-Z401",
    name: "Sneakers Urbanos Blancos Suela Confort",
    productType: "zapatos",
    category: "unisex",
    cut: "Calzado Deportivo Urbano",
    priceUSD: 35.00,
    tag: "⭐ TENDENCIA",
    rating: 4.9,
    reviewsCount: 112,
    description: "Zapatillas urbanas en cuero sintético de fácil limpieza, plantilla acolchada y suela antideslizante.",
    image: "https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?auto=format&fit=crop&w=700&q=80",
    gallery: [
      "https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?auto=format&fit=crop&w=1000&q=85"
    ],
    availableSizes: ["36", "37", "38", "39", "40", "41", "42"],
    inStock: true
  },
  {
    id: "MMS-Z402",
    name: "Sandalias Tacón Block Dama Nude",
    productType: "zapatos",
    category: "dama",
    cut: "Tacón Medio 5cm",
    priceUSD: 28.00,
    tag: "ELEGANTE",
    rating: 4.8,
    reviewsCount: 78,
    description: "Sandalias de tacón ancho cómodo y tiras minimalistas. Combinan con vestidos, jeans y conjuntos.",
    image: "https://images.unsplash.com/photo-1543163521-1bf539c55dd2?auto=format&fit=crop&w=700&q=80",
    gallery: [
      "https://images.unsplash.com/photo-1543163521-1bf539c55dd2?auto=format&fit=crop&w=1000&q=85"
    ],
    availableSizes: ["36", "37", "38", "39"],
    inStock: true
  },

  // --- VESTIDOS & ACCESORIOS ---
  {
    id: "MMS-V501",
    name: "Vestido Casual Floral con Ajuste en Cintura",
    productType: "vestido",
    category: "dama",
    cut: "Corte Midi",
    priceUSD: 26.00,
    tag: "FRESCO",
    rating: 4.9,
    reviewsCount: 65,
    description: "Hermoso vestido de estampado floral delicado con silueta favorecedora y tela fresca de alta durabilidad.",
    image: "https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?auto=format&fit=crop&w=700&q=80",
    gallery: [
      "https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?auto=format&fit=crop&w=1000&q=85"
    ],
    availableSizes: ["S", "M", "L"],
    inStock: true
  },
  {
    id: "MMS-A601",
    name: "Cartera Bandolera Crossbody Dorada & Negra",
    productType: "accesorio",
    category: "dama",
    cut: "Accesorios Boutique",
    priceUSD: 20.00,
    tag: "TOP ACCESORIO",
    rating: 5.0,
    reviewsCount: 140,
    description: "Bolso cruzado compacto con herrajes dorados inoxidables y correa ajustable de lujo.",
    image: "https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&w=700&q=80",
    gallery: [
      "https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&w=1000&q=85"
    ],
    availableSizes: ["Única"],
    inStock: true
  }
];

export const INITIAL_CREDIT_CLIENTS: CreditClient[] = [
  {
    id: "cli-01",
    name: "Carmen Gómez",
    phone: "0414-9876543",
    idCard: "V-18.345.678",
    saleType: "credito",
    totalPurchasedUSD: 50.00,
    balanceUSD: 20.00,
    notes: "Cliente fija. Abona quincenal.",
    createdAt: "2026-08-15",
    purchases: [
      {
        id: "pur-1",
        date: "2026-08-15",
        description: "2 Jeans Wide Leg (Talla 30)",
        amountUSD: 50.00
      }
    ],
    payments: [
      {
        id: "pay-1",
        date: "2026-08-30",
        amountUSD: 30.00,
        amountBS: 1125.00,
        rateBCV: 37.50,
        method: "Pago Móvil Banesco",
        reference: "Ref: 983214",
        notes: "Primer abono quincenal"
      }
    ]
  },
  {
    id: "cli-02",
    name: "Mariana Silva",
    phone: "0424-5551234",
    idCard: "V-22.100.200",
    saleType: "credito",
    totalPurchasedUSD: 75.00,
    balanceUSD: 45.00,
    notes: "Abona semanal.",
    createdAt: "2026-08-20",
    purchases: [
      {
        id: "pur-2",
        date: "2026-08-20",
        description: "3 Jeans Push-Up (Talla 32)",
        amountUSD: 75.00
      }
    ],
    payments: [
      {
        id: "pay-2",
        date: "2026-08-27",
        amountUSD: 30.00,
        amountBS: 1125.00,
        rateBCV: 37.50,
        method: "Efectivo USD",
        reference: "Entrega personal",
        notes: "Abono en billete de $30"
      }
    ]
  },
  {
    id: "cli-03",
    name: "Pedro Rivas",
    phone: "0412-7778899",
    idCard: "V-19.450.320",
    saleType: "contado",
    totalPurchasedUSD: 57.00,
    balanceUSD: 0.00,
    notes: "Compra de Contado (Sneakers + Jean Slim)",
    createdAt: "2026-08-25",
    purchases: [
      {
        id: "pur-3",
        date: "2026-08-25",
        description: "Sneakers Urbanos (Talla 41) + Jean Slim (Talla 32)",
        amountUSD: 57.00
      }
    ],
    payments: [
      {
        id: "pay-3",
        date: "2026-08-25",
        amountUSD: 57.00,
        amountBS: 2137.50,
        rateBCV: 37.50,
        method: "Pago Móvil",
        reference: "Ref: 541289",
        notes: "Pago de Contado 100% liquidado"
      }
    ]
  }
];

