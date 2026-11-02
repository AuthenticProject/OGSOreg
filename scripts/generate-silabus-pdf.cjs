const fs = require('fs');
const path = require('path');
const XLSX = require('xlsx');
const { PDFDocument, rgb, StandardFonts } = require('pdf-lib');

async function generateSilabusPdf() {
  console.log('Reading Excel...');
  const excelPath = path.join(__dirname, '../public/documents/Silabus_OGSO_2026.xlsx');
  const wb = XLSX.readFile(excelPath);
  const sheet = wb.Sheets['For Sharey'];
  if (!sheet) {
    throw new Error('Sheet "For Sharey" not found in ' + excelPath);
  }
  const rawData = XLSX.utils.sheet_to_json(sheet, { header: 1 });

  // Parse sections
  const sections = [];
  let currentSection = null;
  let currentSubject = '';

  for (let i = 0; i < rawData.length; i++) {
    const row = rawData[i];
    if (!row || row.length === 0) continue;

    const col0 = (row[0] || '').toString().trim();
    const col1 = (row[1] || '').toString().trim();
    const col2 = (row[2] || '').toString().trim();

    if (col0.toLowerCase() === 'perlombaan') {
      currentSection = {
        title: col1.replace(/^:\s*/, ''),
        kelasTarget: '',
        bidangStudi: '',
        items: []
      };
      sections.push(currentSection);
      currentSubject = '';
      continue;
    }

    if (currentSection) {
      if (col0.toLowerCase() === 'kelas') {
        currentSection.kelasTarget = col1.replace(/^:\s*/, '');
        continue;
      }
      if (col0.toLowerCase() === 'bidang studi' && col1.startsWith(':')) {
        currentSection.bidangStudi = col1.replace(/^:\s*/, '');
        continue;
      }
      if (col0.toUpperCase() === 'BIDANG STUDI' && col1.toUpperCase() === 'MATERI') {
        continue;
      }

      // It's a data row
      if (col1) {
        if (col0) {
          currentSubject = col0;
        }
        currentSection.items.push({
          subject: currentSubject,
          materi: col1,
          kelas: col2 || currentSection.kelasTarget
        });
      }
    }
  }

  console.log(`Parsed ${sections.length} sections from "For Sharey".`);

  // Create PDF
  const pdfDoc = await PDFDocument.create();
  const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const fontItalic = await pdfDoc.embedFont(StandardFonts.HelveticaOblique);

  // Logo
  let logoImage = null;
  const logoPath = path.join(__dirname, '../public/logo.png');
  if (fs.existsSync(logoPath)) {
    try {
      const logoBytes = fs.readFileSync(logoPath);
      logoImage = await pdfDoc.embedPng(logoBytes);
    } catch (e) {
      console.warn('Could not embed logo image:', e.message);
    }
  }

  // Palette (OGSO Brand: Emerald & Gold)
  const cForest = rgb(12 / 255, 36 / 255, 27 / 255);       // #0C241B
  const cEmerald = rgb(22 / 255, 101 / 255, 52 / 255);     // #166534
  const cEmeraldLight = rgb(236 / 255, 253 / 255, 245 / 255); // #ECFDF5
  const cGold = rgb(213 / 255, 196 / 255, 154 / 255);      // #D5C49A
  const cDarkGold = rgb(161 / 255, 138 / 255, 78 / 255);
  const cSlate = rgb(71 / 255, 85 / 255, 105 / 255);       // #475569
  const cLightGray = rgb(241 / 255, 245 / 255, 249 / 255); // #F1F5F9
  const cBorder = rgb(226 / 255, 232 / 255, 240 / 255);    // #E2E8F0
  const cWhite = rgb(1, 1, 1);

  const pageWidth = 595.28; // A4
  const pageHeight = 841.89;
  const marginX = 40;
  const contentWidth = pageWidth - marginX * 2;
  const bottomMargin = 45;

  let currentPage = null;
  let cursorY = 0;
  let pageNumber = 0;
  const pagesList = [];

  function addNewPage() {
    currentPage = pdfDoc.addPage([pageWidth, pageHeight]);
    pageNumber++;
    pagesList.push(currentPage);
    cursorY = pageHeight - 45;
    return currentPage;
  }

  function drawHeader() {
    const headerTop = cursorY;
    const logoSize = 44;

    if (logoImage) {
      currentPage.drawImage(logoImage, {
        x: marginX + 6,
        y: headerTop - logoSize + 4,
        width: logoSize,
        height: logoSize
      });
    }

    const textX = marginX + (logoImage ? logoSize + 16 : 0);
    currentPage.drawText('PANITIA ONLINE GONTOR SCIENCE OLYMPIAD (OGSO)', {
      x: textX,
      y: headerTop,
      size: 11,
      font: fontBold,
      color: cEmerald
    });

    currentPage.drawText('PONDOK MODERN DARUSSALAM GONTOR', {
      x: textX,
      y: headerTop - 13,
      size: 10,
      font: fontBold,
      color: cForest
    });

    currentPage.drawText('SILABUS RESMI MATERI KOMPETISI (KURIKULUM KMI SYAR\'I) — 1448 H / 2026 M', {
      x: textX,
      y: headerTop - 25,
      size: 8,
      font: fontRegular,
      color: cSlate
    });

    cursorY = headerTop - logoSize - 8;

    // Divider line
    currentPage.drawLine({
      start: { x: marginX, y: cursorY },
      end: { x: marginX + contentWidth, y: cursorY },
      thickness: 1.5,
      color: cEmerald
    });
    currentPage.drawLine({
      start: { x: marginX, y: cursorY - 2 },
      end: { x: marginX + contentWidth, y: cursorY - 2 },
      thickness: 0.5,
      color: cDarkGold
    });

    cursorY -= 16;
  }

  // Initialize first page
  addNewPage();
  drawHeader();

  // Subtitle banner on Page 1
  currentPage.drawRectangle({
    x: marginX,
    y: cursorY - 34,
    width: contentWidth,
    height: 34,
    color: cEmeraldLight,
    borderColor: cEmerald,
    borderWidth: 0.75
  });

  currentPage.drawText('PANDUAN & KISI-KISI MATERI PENGUJIAN TINGKAT NASIONAL ANTAR-KAMPUS', {
    x: marginX + 12,
    y: cursorY - 14,
    size: 8.5,
    font: fontBold,
    color: cEmerald
  });

  currentPage.drawText('Dokumen resmi bidang studi sains terintegrasi (Fisika, Biologi, Kimia, Matematika) kurikulum KMI Pondok Modern.', {
    x: marginX + 12,
    y: cursorY - 26,
    size: 7.5,
    font: fontRegular,
    color: cSlate
  });

  cursorY -= 48;

  // Render each section
  for (let sIdx = 0; sIdx < sections.length; sIdx++) {
    const sec = sections[sIdx];

    // Check if we need a new page for section header + at least 3 rows
    if (cursorY < 180) {
      addNewPage();
      drawHeader();
    }

    // Section Header Box
    const boxHeight = 24;
    currentPage.drawRectangle({
      x: marginX,
      y: cursorY - boxHeight,
      width: contentWidth,
      height: boxHeight,
      color: cForest
    });

    const secTitle = `${sec.title.toUpperCase()} (KELAS: ${sec.kelasTarget})`.trim();
    currentPage.drawText(secTitle, {
      x: marginX + 10,
      y: cursorY - 16,
      size: 9.5,
      font: fontBold,
      color: cGold
    });

    const bidangText = `Bidang: ${sec.bidangStudi}`;
    const bidangWidth = fontRegular.widthOfTextAtSize(bidangText, 8);
    currentPage.drawText(bidangText, {
      x: marginX + contentWidth - bidangWidth - 10,
      y: cursorY - 15.5,
      size: 8,
      font: fontRegular,
      color: cWhite
    });

    cursorY -= (boxHeight + 2);

    // Table Header
    const colW_No = 30;
    const colW_Subject = 100;
    const colW_Materi = contentWidth - colW_No - colW_Subject - 60;
    const colW_Kelas = 60;
    const thHeight = 18;

    currentPage.drawRectangle({
      x: marginX,
      y: cursorY - thHeight,
      width: contentWidth,
      height: thHeight,
      color: cLightGray,
      borderColor: cBorder,
      borderWidth: 0.5
    });

    currentPage.drawText('NO', {
      x: marginX + 10,
      y: cursorY - 12,
      size: 8,
      font: fontBold,
      color: cSlate
    });
    currentPage.drawText('BIDANG STUDI', {
      x: marginX + colW_No + 8,
      y: cursorY - 12,
      size: 8,
      font: fontBold,
      color: cSlate
    });
    currentPage.drawText('KISI-KISI MATERI PENGUJIAN', {
      x: marginX + colW_No + colW_Subject + 8,
      y: cursorY - 12,
      size: 8,
      font: fontBold,
      color: cSlate
    });
    currentPage.drawText('TARGET', {
      x: marginX + colW_No + colW_Subject + colW_Materi + 8,
      y: cursorY - 12,
      size: 8,
      font: fontBold,
      color: cSlate
    });

    cursorY -= thHeight;

    // Table Rows
    for (let rIdx = 0; rIdx < sec.items.length; rIdx++) {
      const item = sec.items[rIdx];
      const rowHeight = 16.5;

      // Check page break
      if (cursorY - rowHeight < bottomMargin + 10) {
        addNewPage();
        drawHeader();

        // Repeat table header
        currentPage.drawRectangle({
          x: marginX,
          y: cursorY - thHeight,
          width: contentWidth,
          height: thHeight,
          color: cLightGray,
          borderColor: cBorder,
          borderWidth: 0.5
        });
        currentPage.drawText('NO', { x: marginX + 10, y: cursorY - 12, size: 8, font: fontBold, color: cSlate });
        currentPage.drawText('BIDANG STUDI', { x: marginX + colW_No + 8, y: cursorY - 12, size: 8, font: fontBold, color: cSlate });
        currentPage.drawText('KISI-KISI MATERI PENGUJIAN', { x: marginX + colW_No + colW_Subject + 8, y: cursorY - 12, size: 8, font: fontBold, color: cSlate });
        currentPage.drawText('TARGET', { x: marginX + colW_No + colW_Subject + colW_Materi + 8, y: cursorY - 12, size: 8, font: fontBold, color: cSlate });
        cursorY -= thHeight;
      }

      const isEven = rIdx % 2 === 0;
      if (isEven) {
        currentPage.drawRectangle({
          x: marginX,
          y: cursorY - rowHeight,
          width: contentWidth,
          height: rowHeight,
          color: rgb(249 / 255, 250 / 255, 251 / 255)
        });
      }

      // Border bottom
      currentPage.drawLine({
        start: { x: marginX, y: cursorY - rowHeight },
        end: { x: marginX + contentWidth, y: cursorY - rowHeight },
        thickness: 0.5,
        color: cBorder
      });

      // No
      currentPage.drawText(`${rIdx + 1}`, {
        x: marginX + 10,
        y: cursorY - 11.5,
        size: 7.5,
        font: fontRegular,
        color: cSlate
      });

      // Subject (only bold when changes or prominent)
      const prevSubject = rIdx > 0 ? sec.items[rIdx - 1].subject : '';
      const isNewSubject = item.subject !== prevSubject;

      currentPage.drawText(item.subject, {
        x: marginX + colW_No + 8,
        y: cursorY - 11.5,
        size: 8,
        font: isNewSubject ? fontBold : fontRegular,
        color: isNewSubject ? cEmerald : cSlate
      });

      // Materi
      currentPage.drawText(item.materi, {
        x: marginX + colW_No + colW_Subject + 8,
        y: cursorY - 11.5,
        size: 8,
        font: fontRegular,
        color: cForest
      });

      // Target
      currentPage.drawText(item.kelas, {
        x: marginX + colW_No + colW_Subject + colW_Materi + 8,
        y: cursorY - 11.5,
        size: 7.5,
        font: fontRegular,
        color: cSlate
      });

      cursorY -= rowHeight;
    }

    cursorY -= 14; // Space after table
  }

  // Draw footers on all pages
  const totalPages = pagesList.length;
  for (let p = 0; p < totalPages; p++) {
    const page = pagesList[p];
    const footerY = 25;

    page.drawLine({
      start: { x: marginX, y: footerY + 12 },
      end: { x: marginX + contentWidth, y: footerY + 12 },
      thickness: 0.5,
      color: cBorder
    });

    page.drawText('Dokumen Resmi Silabus OGSO 2026 • Kurikulum KMI Pondok Modern Darussalam Gontor', {
      x: marginX,
      y: footerY,
      size: 7,
      font: fontItalic,
      color: cSlate
    });

    const pageStr = `Halaman ${p + 1} dari ${totalPages}`;
    const pageStrWidth = fontRegular.widthOfTextAtSize(pageStr, 7);
    page.drawText(pageStr, {
      x: marginX + contentWidth - pageStrWidth,
      y: footerY,
      size: 7,
      font: fontRegular,
      color: cSlate
    });
  }

  // Save PDF
  const pdfBytes = await pdfDoc.save();
  const outputPath = path.join(__dirname, '../public/documents/Silabus_OGSO_2026.pdf');
  fs.writeFileSync(outputPath, pdfBytes);
  console.log(`Success! PDF written to ${outputPath} (${pdfBytes.length} bytes, ${totalPages} pages).`);
}

generateSilabusPdf().catch(err => {
  console.error('Error generating PDF:', err);
  process.exit(1);
});
