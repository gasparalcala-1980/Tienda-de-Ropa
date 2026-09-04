import ExcelJS from 'exceljs';
import { CreditClient, Product } from '../types';

// Helper to load logo as ArrayBuffer safely with extension detection
async function getLogoBuffer(): Promise<{ buffer: ArrayBuffer; extension: 'png' | 'jpeg' } | null> {
  try {
    const response = await fetch('/logo.png');
    if (response.ok) {
      const buffer = await response.arrayBuffer();
      return { buffer, extension: 'png' };
    }
  } catch {}

  try {
    const responseJpg = await fetch('/logo.jpg');
    if (responseJpg.ok) {
      const buffer = await responseJpg.arrayBuffer();
      return { buffer, extension: 'jpeg' };
    }
  } catch {}

  return null;
}

// Helper to trigger file download in browser
function downloadWorkbook(workbook: ExcelJS.Workbook, filename: string) {
  workbook.xlsx.writeBuffer().then((buffer) => {
    const blob = new Blob([buffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });
    const url = window.URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = filename;
    document.body.appendChild(anchor);
    anchor.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(anchor);
  });
}

/**
 * Export Credits & Receivables Report to Excel
 */
export async function exportCreditsToExcel(clients: CreditClient[], bcvRate: number) {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Mundo Moda Shop';
  workbook.lastModifiedBy = 'Mundo Moda Shop Admin';
  workbook.created = new Date();

  const worksheet = workbook.addWorksheet('Créditos y Cuentas por Cobrar', {
    views: [{ showGridLines: true }],
  });

  // Try to insert Logo
  const logoData = await getLogoBuffer();
  if (logoData) {
    const imageId = workbook.addImage({
      buffer: logoData.buffer,
      extension: logoData.extension,
    });
    worksheet.addImage(imageId, {
      tl: { col: 0.1, row: 0.2 },
      ext: { width: 75, height: 75 },
    });
  }

  // Column definitions with proper widths
  worksheet.columns = [
    { key: 'colA', width: 6 },   // Space for logo or margin
    { key: 'colB', width: 26 },  // Cliente
    { key: 'colC', width: 16 },  // Cédula
    { key: 'colD', width: 18 },  // Teléfono
    { key: 'colE', width: 16 },  // Estado
    { key: 'colF', width: 18 },  // Total Comprado ($)
    { key: 'colG', width: 18 },  // Total Abonado ($)
    { key: 'colH', width: 20 },  // Saldo Pendiente ($)
    { key: 'colI', width: 24 },  // Saldo en Bs (BCV)
  ];

  // Header Title Row (MUNDO MODA SHOP)
  worksheet.mergeCells('B2:I2');
  const titleCell = worksheet.getCell('B2');
  titleCell.value = 'MUNDO MODA SHOP - BOUTIQUE & JEANS';
  titleCell.font = { name: 'Arial', size: 16, bold: true, color: { argb: 'FFFFFFFF' } };
  titleCell.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF0C0C14' }, // Luxury Dark
  };
  titleCell.alignment = { vertical: 'middle', horizontal: 'center' };
  worksheet.getRow(2).height = 30;

  // Subtitle Row
  worksheet.mergeCells('B3:I3');
  const subtitleCell = worksheet.getCell('B3');
  subtitleCell.value = 'REPORTE OFICIAL DE CLIENTES, CRÉDITOS Y COBRANZAS';
  subtitleCell.font = { name: 'Arial', size: 11, bold: true, color: { argb: 'FFF472B6' } }; // Rose Pink
  subtitleCell.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF141420' },
  };
  subtitleCell.alignment = { vertical: 'middle', horizontal: 'center' };
  worksheet.getRow(3).height = 22;

  // Metadata block (Date, BCV Rate, Totals)
  const nowStr = new Date().toLocaleDateString('es-VE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });

  const totalPorCobrarUSD = clients.reduce((sum, c) => sum + (c.balanceUSD || 0), 0);
  const totalPorCobrarBS = totalPorCobrarUSD * bcvRate;
  const totalCompradoUSD = clients.reduce((sum, c) => sum + (c.totalPurchasedUSD || 0), 0);

  worksheet.mergeCells('B4:D4');
  const metaDate = worksheet.getCell('B4');
  metaDate.value = `📅 Fecha de emisión: ${nowStr} | Tasa BCV: Bs. ${bcvRate.toFixed(2)}`;
  metaDate.font = { name: 'Arial', size: 10, italic: true, color: { argb: 'FF475569' } };
  metaDate.alignment = { vertical: 'middle', horizontal: 'left' };

  worksheet.mergeCells('E4:I4');
  const metaSummary = worksheet.getCell('E4');
  metaSummary.value = `Total por cobrar: $${totalPorCobrarUSD.toFixed(2)} USD (Bs. ${totalPorCobrarBS.toLocaleString('es-VE', { minimumFractionDigits: 2 })})`;
  metaSummary.font = { name: 'Arial', size: 10, bold: true, color: { argb: 'FFE11D48' } };
  metaSummary.alignment = { vertical: 'middle', horizontal: 'right' };
  worksheet.getRow(4).height = 22;

  // Empty row separator
  worksheet.getRow(5).height = 10;

  // Table Headers
  const headers = [
    '#',
    'Nombre del Cliente',
    'Cédula de Identidad',
    'Teléfono',
    'Estado Cuenta',
    'Total Compras ($)',
    'Total Abonado ($)',
    'Saldo Deudor ($ USD)',
    'Saldo Deudor (Bs. BCV)',
  ];

  const headerRow = worksheet.getRow(6);
  headerRow.height = 26;
  headers.forEach((hdr, idx) => {
    const colNum = idx + 1;
    const cell = headerRow.getCell(colNum);
    cell.value = hdr;
    cell.font = { name: 'Arial', size: 10, bold: true, color: { argb: 'FFFFFFFF' } };
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF1E1E2F' }, // Boutique Dark Slate
    };
    cell.alignment = {
      vertical: 'middle',
      horizontal: idx >= 5 ? 'right' : 'center',
    };
    cell.border = {
      top: { style: 'medium', color: { argb: 'FFF43F5E' } },
      bottom: { style: 'medium', color: { argb: 'FFF43F5E' } },
      left: { style: 'thin', color: { argb: 'FF334155' } },
      right: { style: 'thin', color: { argb: 'FF334155' } },
    };
  });

  // Rows Data
  clients.forEach((client, index) => {
    const rowIndex = 7 + index;
    const row = worksheet.getRow(rowIndex);
    row.height = 22;

    const totalPaid = (client.payments || []).reduce((sum, p) => sum + (p.amountUSD || 0), 0);
    const balance = client.balanceUSD || 0;
    const balanceBS = balance * bcvRate;
    const isSolvente = balance <= 0.01;

    const rowData = [
      index + 1,
      client.name,
      client.idCard || 'N/A',
      client.phone || 'N/A',
      isSolvente ? 'SOLVENTE' : 'DEUDOR ACTIVO',
      client.totalPurchasedUSD || 0,
      totalPaid,
      balance,
      balanceBS,
    ];

    const isEven = index % 2 === 0;
    const rowBg = isEven ? 'FFFFFFFF' : 'FFF8FAFC';

    rowData.forEach((val, colIdx) => {
      const cell = row.getCell(colIdx + 1);
      cell.value = val;
      cell.font = { name: 'Arial', size: 9.5 };
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: rowBg },
      };
      cell.border = {
        top: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        left: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        right: { style: 'thin', color: { argb: 'FFE2E8F0' } },
      };

      // Alignment and formats
      if (colIdx === 0) {
        cell.alignment = { vertical: 'middle', horizontal: 'center' };
      } else if (colIdx === 1) {
        cell.font = { name: 'Arial', size: 9.5, bold: true, color: { argb: 'FF0F172A' } };
        cell.alignment = { vertical: 'middle', horizontal: 'left' };
      } else if (colIdx === 4) {
        // Status badge
        cell.alignment = { vertical: 'middle', horizontal: 'center' };
        cell.font = {
          name: 'Arial',
          size: 9,
          bold: true,
          color: { argb: isSolvente ? 'FF059669' : 'FFDC2626' },
        };
      } else if (colIdx === 5 || colIdx === 6) {
        cell.numFmt = '"$"#,##0.00';
        cell.alignment = { vertical: 'middle', horizontal: 'right' };
      } else if (colIdx === 7) {
        // Balance USD
        cell.numFmt = '"$"#,##0.00';
        cell.alignment = { vertical: 'middle', horizontal: 'right' };
        cell.font = {
          name: 'Arial',
          size: 10,
          bold: true,
          color: { argb: isSolvente ? 'FF059669' : 'FFDC2626' },
        };
      } else if (colIdx === 8) {
        // Balance Bs
        cell.numFmt = '"Bs. "#,##0.00';
        cell.alignment = { vertical: 'middle', horizontal: 'right' };
        cell.font = {
          name: 'Arial',
          size: 10,
          bold: true,
          color: { argb: isSolvente ? 'FF059669' : 'FFDC2626' },
        };
      } else {
        cell.alignment = { vertical: 'middle', horizontal: 'center' };
      }
    });
  });

  // Summary Totals Row at the bottom
  const totalRowIdx = 7 + clients.length;
  const totalRow = worksheet.getRow(totalRowIdx);
  totalRow.height = 28;

  totalRow.getCell(2).value = 'TOTALES GENERALES:';
  totalRow.getCell(2).font = { name: 'Arial', size: 10, bold: true, color: { argb: 'FFFFFFFF' } };

  totalRow.getCell(6).value = totalCompradoUSD;
  totalRow.getCell(6).numFmt = '"$"#,##0.00';
  totalRow.getCell(6).font = { name: 'Arial', size: 10, bold: true, color: { argb: 'FFFFFFFF' } };

  const totalAbonadoGeneral = clients.reduce(
    (sum, c) => sum + (c.payments || []).reduce((s, p) => s + (p.amountUSD || 0), 0),
    0
  );
  totalRow.getCell(7).value = totalAbonadoGeneral;
  totalRow.getCell(7).numFmt = '"$"#,##0.00';
  totalRow.getCell(7).font = { name: 'Arial', size: 10, bold: true, color: { argb: 'FF10B981' } };

  totalRow.getCell(8).value = totalPorCobrarUSD;
  totalRow.getCell(8).numFmt = '"$"#,##0.00';
  totalRow.getCell(8).font = { name: 'Arial', size: 11, bold: true, color: { argb: 'FFFDE047' } }; // Gold

  totalRow.getCell(9).value = totalPorCobrarBS;
  totalRow.getCell(9).numFmt = '"Bs. "#,##0.00';
  totalRow.getCell(9).font = { name: 'Arial', size: 11, bold: true, color: { argb: 'FFFDE047' } };

  for (let c = 1; c <= 9; c++) {
    const cell = totalRow.getCell(c);
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF0C0C14' },
    };
    cell.border = {
      top: { style: 'double', color: { argb: 'FFF43F5E' } },
      bottom: { style: 'double', color: { argb: 'FFF43F5E' } },
    };
    if (c >= 6) {
      cell.alignment = { vertical: 'middle', horizontal: 'right' };
    }
  }

  // Second sheet: Historial de Abonos detallado
  const paymentsSheet = workbook.addWorksheet('Detalle de Abonos', {
    views: [{ showGridLines: true }],
  });

  paymentsSheet.columns = [
    { key: 'pA', width: 6 },
    { key: 'pB', width: 14 }, // Fecha
    { key: 'pC', width: 24 }, // Cliente
    { key: 'pD', width: 16 }, // Cédula
    { key: 'pE', width: 16 }, // Monto USD
    { key: 'pF', width: 18 }, // Monto Bs
    { key: 'pG', width: 14 }, // Tasa BCV
    { key: 'pH', width: 18 }, // Método
    { key: 'pI', width: 22 }, // Referencia
    { key: 'pJ', width: 24 }, // Notas
  ];

  // Header for payments
  paymentsSheet.mergeCells('B2:J2');
  const payTitle = paymentsSheet.getCell('B2');
  payTitle.value = 'MUNDO MODA SHOP - HISTORIAL DETALLADO DE ABONOS RECIBIDOS';
  payTitle.font = { name: 'Arial', size: 13, bold: true, color: { argb: 'FFFFFFFF' } };
  payTitle.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF0C0C14' },
  };
  payTitle.alignment = { vertical: 'middle', horizontal: 'center' };
  paymentsSheet.getRow(2).height = 28;

  const payHeaders = [
    '#',
    'Fecha',
    'Cliente',
    'Cédula',
    'Monto ($ USD)',
    'Monto (Bs.)',
    'Tasa BCV',
    'Método de Pago',
    'Nro. Referencia',
    'Observaciones',
  ];

  const payHdrRow = paymentsSheet.getRow(4);
  payHdrRow.height = 24;
  payHeaders.forEach((h, idx) => {
    const cell = payHdrRow.getCell(idx + 1);
    cell.value = h;
    cell.font = { name: 'Arial', size: 9.5, bold: true, color: { argb: 'FFFFFFFF' } };
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF1E1E2F' },
    };
    cell.alignment = { vertical: 'middle', horizontal: idx >= 4 && idx <= 6 ? 'right' : 'center' };
  });

  // Flatten all payments
  let payIndex = 1;
  clients.forEach((c) => {
    (c.payments || []).forEach((p) => {
      const pRowIdx = 4 + payIndex;
      const pRow = paymentsSheet.getRow(pRowIdx);
      pRow.height = 20;

      const pData = [
        payIndex,
        p.date,
        c.name,
        c.idCard,
        p.amountUSD,
        p.amountBS || p.amountUSD * (p.rateBCV || bcvRate),
        p.rateBCV || bcvRate,
        p.method,
        p.reference || 'N/A',
        p.notes || '',
      ];

      pData.forEach((val, ci) => {
        const cell = pRow.getCell(ci + 1);
        cell.value = val;
        cell.font = { name: 'Arial', size: 9 };
        cell.border = {
          top: { style: 'thin', color: { argb: 'FFE2E8F0' } },
          bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        };
        if (ci === 4) {
          cell.numFmt = '"$"#,##0.00';
          cell.alignment = { vertical: 'middle', horizontal: 'right' };
          cell.font = { name: 'Arial', size: 9, bold: true, color: { argb: 'FF059669' } };
        } else if (ci === 5) {
          cell.numFmt = '"Bs. "#,##0.00';
          cell.alignment = { vertical: 'middle', horizontal: 'right' };
        } else if (ci === 6) {
          cell.numFmt = '"Bs. "#,##0.00';
          cell.alignment = { vertical: 'middle', horizontal: 'right' };
        } else {
          cell.alignment = { vertical: 'middle', horizontal: ci === 2 ? 'left' : 'center' };
        }
      });
      payIndex++;
    });
  });

  const dateFile = new Date().toISOString().split('T')[0];
  downloadWorkbook(workbook, `MundoModa_Reporte_Creditos_${dateFile}.xlsx`);
}

/**
 * Export Inventory Report to Excel
 */
export async function exportInventoryToExcel(products: Product[], bcvRate: number) {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Mundo Moda Shop';
  workbook.lastModifiedBy = 'Mundo Moda Shop Admin';
  workbook.created = new Date();

  const worksheet = workbook.addWorksheet('Inventario de Prendas', {
    views: [{ showGridLines: true }],
  });

  // Try to insert Logo
  const logoData = await getLogoBuffer();
  if (logoData) {
    const imageId = workbook.addImage({
      buffer: logoData.buffer,
      extension: logoData.extension,
    });
    worksheet.addImage(imageId, {
      tl: { col: 0.1, row: 0.2 },
      ext: { width: 75, height: 75 },
    });
  }

  // Column definitions
  worksheet.columns = [
    { key: 'colA', width: 6 },   // Index
    { key: 'colB', width: 14 },  // Código ID
    { key: 'colC', width: 28 },  // Nombre Prenda
    { key: 'colD', width: 16 },  // Tipo / Categoría
    { key: 'colE', width: 18 },  // Estilo / Corte
    { key: 'colF', width: 24 },  // Tallas Disponibles
    { key: 'colG', width: 16 },  // Estado / Stock
    { key: 'colH', width: 18 },  // Precio ($ USD)
    { key: 'colI', width: 22 },  // Precio (Bs. BCV)
  ];

  // Header Title
  worksheet.mergeCells('B2:I2');
  const titleCell = worksheet.getCell('B2');
  titleCell.value = 'MUNDO MODA SHOP - CATÁLOGO E INVENTARIO GENERAL';
  titleCell.font = { name: 'Arial', size: 16, bold: true, color: { argb: 'FFFFFFFF' } };
  titleCell.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF0C0C14' },
  };
  titleCell.alignment = { vertical: 'middle', horizontal: 'center' };
  worksheet.getRow(2).height = 30;

  // Subtitle
  worksheet.mergeCells('B3:I3');
  const subtitleCell = worksheet.getCell('B3');
  subtitleCell.value = 'REPORTE OFICIAL DE EXISTENCIAS, PRENDAS Y PRECIOS';
  subtitleCell.font = { name: 'Arial', size: 11, bold: true, color: { argb: 'FFF472B6' } };
  subtitleCell.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF141420' },
  };
  subtitleCell.alignment = { vertical: 'middle', horizontal: 'center' };
  worksheet.getRow(3).height = 22;

  // Metadata
  const nowStr = new Date().toLocaleDateString('es-VE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
  const totalModelos = products.length;
  const totalActivos = products.filter((p) => p.inStock !== false).length;
  const valorTotalInventarioUSD = products.reduce((sum, p) => sum + (p.priceUSD || 0), 0);
  const valorTotalInventarioBS = valorTotalInventarioUSD * bcvRate;

  worksheet.mergeCells('B4:D4');
  const metaDate = worksheet.getCell('B4');
  metaDate.value = `📅 Fecha: ${nowStr} | Tasa BCV: Bs. ${bcvRate.toFixed(2)}`;
  metaDate.font = { name: 'Arial', size: 10, italic: true, color: { argb: 'FF475569' } };
  metaDate.alignment = { vertical: 'middle', horizontal: 'left' };

  worksheet.mergeCells('E4:I4');
  const metaSummary = worksheet.getCell('E4');
  metaSummary.value = `Modelos: ${totalModelos} (${totalActivos} disponibles) | Total Catálogo: $${valorTotalInventarioUSD.toFixed(2)} USD`;
  metaSummary.font = { name: 'Arial', size: 10, bold: true, color: { argb: 'FF10B981' } };
  metaSummary.alignment = { vertical: 'middle', horizontal: 'right' };
  worksheet.getRow(4).height = 22;

  // Separator
  worksheet.getRow(5).height = 10;

  // Headers
  const headers = [
    '#',
    'Código ID',
    'Nombre del Producto',
    'Categoría',
    'Corte / Modelo',
    'Tallas Disponibles',
    'Disponibilidad',
    'Precio ($ USD)',
    'Precio (Bs. BCV)',
  ];

  const headerRow = worksheet.getRow(6);
  headerRow.height = 26;
  headers.forEach((hdr, idx) => {
    const colNum = idx + 1;
    const cell = headerRow.getCell(colNum);
    cell.value = hdr;
    cell.font = { name: 'Arial', size: 10, bold: true, color: { argb: 'FFFFFFFF' } };
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF1E1E2F' },
    };
    cell.alignment = {
      vertical: 'middle',
      horizontal: idx >= 7 ? 'right' : 'center',
    };
    cell.border = {
      top: { style: 'medium', color: { argb: 'FFF43F5E' } },
      bottom: { style: 'medium', color: { argb: 'FFF43F5E' } },
      left: { style: 'thin', color: { argb: 'FF334155' } },
      right: { style: 'thin', color: { argb: 'FF334155' } },
    };
  });

  // Rows
  products.forEach((prod, index) => {
    const rowIndex = 7 + index;
    const row = worksheet.getRow(rowIndex);
    row.height = 22;

    const inStock = prod.inStock !== false;
    const priceUSD = prod.priceUSD || 0;
    const priceBS = priceUSD * bcvRate;
    const sizes = (prod.availableSizes || []).join(', ') || 'Única';

    const rowData = [
      index + 1,
      prod.id,
      prod.name,
      prod.category ? prod.category.toUpperCase() : 'GENERAL',
      prod.cut || prod.productType || 'N/A',
      sizes,
      inStock ? 'DISPONIBLE' : 'AGOTADO',
      priceUSD,
      priceBS,
    ];

    const isEven = index % 2 === 0;
    const rowBg = isEven ? 'FFFFFFFF' : 'FFF8FAFC';

    rowData.forEach((val, colIdx) => {
      const cell = row.getCell(colIdx + 1);
      cell.value = val;
      cell.font = { name: 'Arial', size: 9.5 };
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: rowBg },
      };
      cell.border = {
        top: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        left: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        right: { style: 'thin', color: { argb: 'FFE2E8F0' } },
      };

      if (colIdx === 0 || colIdx === 1) {
        cell.alignment = { vertical: 'middle', horizontal: 'center' };
        if (colIdx === 1) cell.font = { name: 'Arial', size: 9, bold: true, color: { argb: 'FF6366F1' } };
      } else if (colIdx === 2) {
        cell.font = { name: 'Arial', size: 9.5, bold: true, color: { argb: 'FF0F172A' } };
        cell.alignment = { vertical: 'middle', horizontal: 'left' };
      } else if (colIdx === 6) {
        cell.alignment = { vertical: 'middle', horizontal: 'center' };
        cell.font = {
          name: 'Arial',
          size: 9,
          bold: true,
          color: { argb: inStock ? 'FF059669' : 'FFDC2626' },
        };
      } else if (colIdx === 7) {
        cell.numFmt = '"$"#,##0.00';
        cell.alignment = { vertical: 'middle', horizontal: 'right' };
        cell.font = { name: 'Arial', size: 10, bold: true, color: { argb: 'FF0F172A' } };
      } else if (colIdx === 8) {
        cell.numFmt = '"Bs. "#,##0.00';
        cell.alignment = { vertical: 'middle', horizontal: 'right' };
        cell.font = { name: 'Arial', size: 10, bold: true, color: { argb: 'FF059669' } };
      } else {
        cell.alignment = { vertical: 'middle', horizontal: 'center' };
      }
    });
  });

  // Summary row
  const totalRowIdx = 7 + products.length;
  const totalRow = worksheet.getRow(totalRowIdx);
  totalRow.height = 28;

  totalRow.getCell(3).value = 'TOTAL VALORIZADO CATÁLOGO:';
  totalRow.getCell(3).font = { name: 'Arial', size: 10, bold: true, color: { argb: 'FFFFFFFF' } };

  totalRow.getCell(8).value = valorTotalInventarioUSD;
  totalRow.getCell(8).numFmt = '"$"#,##0.00';
  totalRow.getCell(8).font = { name: 'Arial', size: 11, bold: true, color: { argb: 'FFFDE047' } };

  totalRow.getCell(9).value = valorTotalInventarioBS;
  totalRow.getCell(9).numFmt = '"Bs. "#,##0.00';
  totalRow.getCell(9).font = { name: 'Arial', size: 11, bold: true, color: { argb: 'FFFDE047' } };

  for (let c = 1; c <= 9; c++) {
    const cell = totalRow.getCell(c);
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF0C0C14' },
    };
    cell.border = {
      top: { style: 'double', color: { argb: 'FFF43F5E' } },
      bottom: { style: 'double', color: { argb: 'FFF43F5E' } },
    };
    if (c >= 8) {
      cell.alignment = { vertical: 'middle', horizontal: 'right' };
    }
  }

  const dateFile = new Date().toISOString().split('T')[0];
  downloadWorkbook(workbook, `MundoModa_Inventario_${dateFile}.xlsx`);
}

/**
 * Export Cash Flow, Daily Cash Closing & Sales Report to Excel
 */
export async function exportCashFlowAndSalesToExcel(clients: CreditClient[], bcvRate: number) {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Mundo Moda Shop';
  workbook.lastModifiedBy = 'Mundo Moda Shop Admin';
  workbook.created = new Date();

  // Extract all sales (purchases)
  interface FlatSale {
    id: string;
    date: string;
    clientName: string;
    clientIdCard: string;
    clientPhone: string;
    saleType: 'credito' | 'contado';
    description: string;
    amountUSD: number;
    amountBS: number;
  }

  // Extract all cash inflows (payments)
  interface FlatPayment {
    id: string;
    date: string;
    clientName: string;
    clientIdCard: string;
    type: 'Abono a Crédito' | 'Pago de Contado';
    method: string;
    amountUSD: number;
    amountBS: number;
    rateBCV: number;
    reference: string;
    notes: string;
  }

  const sales: FlatSale[] = [];
  const payments: FlatPayment[] = [];

  clients.forEach((c) => {
    (c.purchases || []).forEach((p) => {
      sales.push({
        id: p.id,
        date: p.date,
        clientName: c.name,
        clientIdCard: c.idCard,
        clientPhone: c.phone,
        saleType: c.saleType || 'credito',
        description: p.description,
        amountUSD: p.amountUSD,
        amountBS: p.amountUSD * bcvRate,
      });
    });

    (c.payments || []).forEach((pm) => {
      const isContado = (pm.notes && pm.notes.toLowerCase().includes('contado')) ||
                        (pm.reference && pm.reference.toLowerCase().includes('contado'));
      payments.push({
        id: pm.id,
        date: pm.date,
        clientName: c.name,
        clientIdCard: c.idCard,
        type: isContado ? 'Pago de Contado' : 'Abono a Crédito',
        method: pm.method,
        amountUSD: pm.amountUSD,
        amountBS: pm.amountBS || pm.amountUSD * (pm.rateBCV || bcvRate),
        rateBCV: pm.rateBCV || bcvRate,
        reference: pm.reference || '-',
        notes: pm.notes || '',
      });
    });
  });

  // Sort by date descending
  sales.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  payments.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  // Metrics
  const totalVentasUSD = sales.reduce((acc, s) => acc + s.amountUSD, 0);
  const totalVentasBS = totalVentasUSD * bcvRate;

  const ventasCredito = sales.filter((s) => s.saleType === 'credito');
  const totalCreditoUSD = ventasCredito.reduce((acc, s) => acc + s.amountUSD, 0);

  const ventasContado = sales.filter((s) => s.saleType === 'contado');
  const totalContadoUSD = ventasContado.reduce((acc, s) => acc + s.amountUSD, 0);

  const totalDineroEntradoUSD = payments.reduce((acc, p) => acc + p.amountUSD, 0);
  const totalDineroEntradoBS = payments.reduce((acc, p) => acc + p.amountBS, 0);

  const abonosCreditoUSD = payments.filter((p) => p.type === 'Abono a Crédito').reduce((acc, p) => acc + p.amountUSD, 0);
  const pagosContadoUSD = payments.filter((p) => p.type === 'Pago de Contado').reduce((acc, p) => acc + p.amountUSD, 0);

  const efectivoUSD = payments.filter((p) => p.method.toLowerCase().includes('efectivo') || p.method.toLowerCase().includes('dolar') || p.method.toLowerCase().includes('cash')).reduce((acc, p) => acc + p.amountUSD, 0);
  const pagoMovilBS = payments.filter((p) => p.method.toLowerCase().includes('movil') || p.method.toLowerCase().includes('móvil')).reduce((acc, p) => acc + p.amountBS, 0);
  const transferenciaUSD = payments.filter((p) => p.method.toLowerCase().includes('transf') || p.method.toLowerCase().includes('zelle')).reduce((acc, p) => acc + p.amountUSD, 0);

  const logoData = await getLogoBuffer();

  // -------------------------------------------------------------
  // HOJA 1: RESUMEN Y CUADRE DE CAJA
  // -------------------------------------------------------------
  const wsResumen = workbook.addWorksheet('Resumen y Cuadre de Caja', {
    views: [{ showGridLines: true }],
  });

  if (logoData) {
    const imageId = workbook.addImage({
      buffer: logoData.buffer,
      extension: logoData.extension,
    });
    wsResumen.addImage(imageId, {
      tl: { col: 0.1, row: 0.2 },
      ext: { width: 68, height: 68 },
    });
  }

  wsResumen.columns = [
    { width: 5 },
    { width: 28 },
    { width: 20 },
    { width: 24 },
    { width: 20 },
    { width: 15 },
  ];

  wsResumen.mergeCells('B1:E1');
  const titleR = wsResumen.getCell('B1');
  titleR.value = 'MUNDO MODA SHOP - CUADRE DE CAJA Y REPORTE DE VENTAS';
  titleR.font = { name: 'Arial', size: 13, bold: true, color: { argb: 'FFE11D48' } };

  wsResumen.mergeCells('B2:E2');
  const subR = wsResumen.getCell('B2');
  subR.value = `Generado el: ${new Date().toLocaleDateString('es-VE')} • Tasa Oficial BCV: Bs. ${bcvRate.toFixed(2)}`;
  subR.font = { name: 'Arial', size: 9, italic: true, color: { argb: 'FF64748B' } };

  // Section 1: Ventas Totales (Crédito vs Contado)
  wsResumen.mergeCells('B4:E4');
  const sec1 = wsResumen.getCell('B4');
  sec1.value = '1. COMPROMISO COMERCIAL / VENTAS TOTALES';
  sec1.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E1B4B' } };
  sec1.font = { name: 'Arial', size: 10, bold: true, color: { argb: 'FFFFFFFF' } };

  const r5 = wsResumen.getRow(5);
  r5.values = ['', 'Concepto de Venta', 'Cantidad de Operaciones', 'Monto en Dólares ($)', 'Monto en Bolívares (Bs)'];
  r5.font = { name: 'Arial', size: 9, bold: true, color: { argb: 'FFFFFFFF' } };
  for (let c = 2; c <= 5; c++) {
    r5.getCell(c).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF312E81' } };
  }

  const r6 = wsResumen.getRow(6);
  r6.values = ['', 'Ventas a Crédito (Mayoría de las ventas)', ventasCredito.length, totalCreditoUSD, totalCreditoUSD * bcvRate];
  r6.getCell(4).numFmt = '"$"#,##0.00';
  r6.getCell(5).numFmt = '"Bs. "#,##0.00';

  const r7 = wsResumen.getRow(7);
  r7.values = ['', 'Ventas de Contado (Ocasionales)', ventasContado.length, totalContadoUSD, totalContadoUSD * bcvRate];
  r7.getCell(4).numFmt = '"$"#,##0.00';
  r7.getCell(5).numFmt = '"Bs. "#,##0.00';

  const r8 = wsResumen.getRow(8);
  r8.values = ['', 'TOTAL VENTAS REALIZADAS', sales.length, totalVentasUSD, totalVentasBS];
  r8.font = { name: 'Arial', size: 10, bold: true, color: { argb: 'FFFDE047' } };
  r8.getCell(4).numFmt = '"$"#,##0.00';
  r8.getCell(5).numFmt = '"Bs. "#,##0.00';
  for (let c = 2; c <= 5; c++) {
    r8.getCell(c).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0C0C14' } };
  }

  // Section 2: Dinero Real Líquido que Entró (Flujo de Caja)
  wsResumen.mergeCells('B10:E10');
  const sec2 = wsResumen.getCell('B10');
  sec2.value = '2. DINERO LÍQUIDO RECAUDADO (ARQUEO REAL DE CAJA)';
  sec2.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF064E3B' } };
  sec2.font = { name: 'Arial', size: 10, bold: true, color: { argb: 'FFFFFFFF' } };

  const r11 = wsResumen.getRow(11);
  r11.values = ['', 'Medio de Cobro / Método', 'Origen del Dinero', 'Monto Recibido ($)', 'Monto en Bolívares (Bs)'];
  r11.font = { name: 'Arial', size: 9, bold: true, color: { argb: 'FFFFFFFF' } };
  for (let c = 2; c <= 5; c++) {
    r11.getCell(c).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF047857' } };
  }

  const r12 = wsResumen.getRow(12);
  r12.values = ['', 'Abonos de Clientes a Crédito', 'Cobranza de Deudas / Calle', abonosCreditoUSD, abonosCreditoUSD * bcvRate];
  r12.getCell(4).numFmt = '"$"#,##0.00';
  r12.getCell(5).numFmt = '"Bs. "#,##0.00';

  const r13 = wsResumen.getRow(13);
  r13.values = ['', 'Ventas Cobradas de Contado', 'Ingreso Directo Inmediato', pagosContadoUSD, pagosContadoUSD * bcvRate];
  r13.getCell(4).numFmt = '"$"#,##0.00';
  r13.getCell(5).numFmt = '"Bs. "#,##0.00';

  const r14 = wsResumen.getRow(14);
  r14.values = ['', 'TOTAL DINERO ENTRADO A CAJA', 'Total Recaudado', totalDineroEntradoUSD, totalDineroEntradoBS];
  r14.font = { name: 'Arial', size: 10, bold: true, color: { argb: 'FF34D399' } };
  r14.getCell(4).numFmt = '"$"#,##0.00';
  r14.getCell(5).numFmt = '"Bs. "#,##0.00';
  for (let c = 2; c <= 5; c++) {
    r14.getCell(c).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF064E3B' } };
  }

  // Desglose por instrumento financiero
  wsResumen.mergeCells('B16:E16');
  const sec3 = wsResumen.getCell('B16');
  sec3.value = '3. ARQUEO POR INSTRUMENTO DE PAGO';
  sec3.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF831843' } };
  sec3.font = { name: 'Arial', size: 10, bold: true, color: { argb: 'FFFFFFFF' } };

  const r17 = wsResumen.getRow(17);
  r17.values = ['', 'Efectivo Dólares ($ en mano)', '', efectivoUSD, efectivoUSD * bcvRate];
  r17.getCell(4).numFmt = '"$"#,##0.00';
  r17.getCell(5).numFmt = '"Bs. "#,##0.00';

  const r18 = wsResumen.getRow(18);
  r18.values = ['', 'Pago Móvil en Bolívares (En banco)', '', pagoMovilBS / (bcvRate || 1), pagoMovilBS];
  r18.getCell(4).numFmt = '"$"#,##0.00';
  r18.getCell(5).numFmt = '"Bs. "#,##0.00';

  const r19 = wsResumen.getRow(19);
  r19.values = ['', 'Transferencias / Zelle / Otros', '', transferenciaUSD, transferenciaUSD * bcvRate];
  r19.getCell(4).numFmt = '"$"#,##0.00';
  r19.getCell(5).numFmt = '"Bs. "#,##0.00';

  // Format borders
  for (let r = 5; r <= 19; r++) {
    if (r === 9 || r === 15) continue;
    for (let c = 2; c <= 5; c++) {
      const cell = wsResumen.getRow(r).getCell(c);
      cell.border = {
        top: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        left: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        right: { style: 'thin', color: { argb: 'FFE2E8F0' } },
      };
      if (c >= 3) cell.alignment = { vertical: 'middle', horizontal: 'right' };
      else cell.alignment = { vertical: 'middle', horizontal: 'left' };
    }
  }

  // -------------------------------------------------------------
  // HOJA 2: LIBRO DETALLADO DE VENTAS
  // -------------------------------------------------------------
  const wsVentas = workbook.addWorksheet('Libro Detallado de Ventas', {
    views: [{ showGridLines: true }],
  });

  wsVentas.columns = [
    { header: 'Fecha', key: 'date', width: 14 },
    { header: 'Cliente', key: 'client', width: 24 },
    { header: 'Cédula', key: 'idCard', width: 15 },
    { header: 'Teléfono', key: 'phone', width: 16 },
    { header: 'Prenda(s) / Descripción', key: 'desc', width: 36 },
    { header: 'Modalidad', key: 'type', width: 18 },
    { header: 'Total ($)', key: 'amountUSD', width: 16 },
    { header: 'Total (Bs BCV)', key: 'amountBS', width: 18 },
  ];

  const headerVentas = wsVentas.getRow(1);
  headerVentas.height = 26;
  headerVentas.font = { name: 'Arial', size: 10, bold: true, color: { argb: 'FFFFFFFF' } };
  for (let c = 1; c <= 8; c++) {
    const cell = headerVentas.getCell(c);
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF831843' } };
    cell.alignment = { vertical: 'middle', horizontal: 'center' };
  }

  sales.forEach((s) => {
    const row = wsVentas.addRow({
      date: s.date,
      client: s.clientName,
      idCard: s.clientIdCard,
      phone: s.clientPhone,
      desc: s.description,
      type: s.saleType === 'credito' ? '💳 A CRÉDITO' : '💵 DE CONTADO',
      amountUSD: s.amountUSD,
      amountBS: s.amountBS,
    });
    row.height = 22;
    row.getCell(6).alignment = { vertical: 'middle', horizontal: 'center' };
    row.getCell(6).font = {
      name: 'Arial',
      size: 9,
      bold: true,
      color: { argb: s.saleType === 'credito' ? 'FFD97706' : 'FF059669' },
    };
    row.getCell(7).numFmt = '"$"#,##0.00';
    row.getCell(7).alignment = { vertical: 'middle', horizontal: 'right' };
    row.getCell(8).numFmt = '"Bs. "#,##0.00';
    row.getCell(8).alignment = { vertical: 'middle', horizontal: 'right' };
  });

  // -------------------------------------------------------------
  // HOJA 3: ENTRADAS DE DINERO A CAJA (ABONOS Y PAGOS)
  // -------------------------------------------------------------
  const wsPagos = workbook.addWorksheet('Entradas Reales a Caja', {
    views: [{ showGridLines: true }],
  });

  wsPagos.columns = [
    { header: 'Fecha', key: 'date', width: 14 },
    { header: 'Cliente', key: 'client', width: 24 },
    { header: 'Cédula', key: 'idCard', width: 15 },
    { header: 'Concepto de Entrada', key: 'type', width: 22 },
    { header: 'Método de Pago', key: 'method', width: 18 },
    { header: 'Monto ($)', key: 'amountUSD', width: 16 },
    { header: 'Monto (Bs)', key: 'amountBS', width: 18 },
    { header: 'Tasa BCV', key: 'rate', width: 14 },
    { header: 'Referencia Bancaria', key: 'ref', width: 20 },
    { header: 'Notas / Observaciones', key: 'notes', width: 26 },
  ];

  const headerPagos = wsPagos.getRow(1);
  headerPagos.height = 26;
  headerPagos.font = { name: 'Arial', size: 10, bold: true, color: { argb: 'FFFFFFFF' } };
  for (let c = 1; c <= 10; c++) {
    const cell = headerPagos.getCell(c);
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF064E3B' } };
    cell.alignment = { vertical: 'middle', horizontal: 'center' };
  }

  payments.forEach((p) => {
    const row = wsPagos.addRow({
      date: p.date,
      client: p.clientName,
      idCard: p.clientIdCard,
      type: p.type,
      method: p.method,
      amountUSD: p.amountUSD,
      amountBS: p.amountBS,
      rate: p.rateBCV,
      ref: p.reference,
      notes: p.notes,
    });
    row.height = 22;
    row.getCell(4).alignment = { vertical: 'middle', horizontal: 'center' };
    row.getCell(4).font = {
      name: 'Arial',
      size: 9,
      bold: true,
      color: { argb: p.type === 'Abono a Crédito' ? 'FF2563EB' : 'FF059669' },
    };
    row.getCell(6).numFmt = '"$"#,##0.00';
    row.getCell(6).alignment = { vertical: 'middle', horizontal: 'right' };
    row.getCell(7).numFmt = '"Bs. "#,##0.00';
    row.getCell(7).alignment = { vertical: 'middle', horizontal: 'right' };
    row.getCell(8).numFmt = '"Bs. "#,##0.00';
    row.getCell(8).alignment = { vertical: 'middle', horizontal: 'right' };
  });

  const dateFile = new Date().toISOString().split('T')[0];
  downloadWorkbook(workbook, `MundoModa_Caja_y_Ventas_${dateFile}.xlsx`);
}

