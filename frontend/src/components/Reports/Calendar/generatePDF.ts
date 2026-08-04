import { type DayData, type ProductStat, formatFullDay } from '../../../lib/reports'
import { SaveFile } from '../../../bindings'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

// PDF styling constants
const COLORS = {
  darkGray: [33, 37, 41] as [number, number, number],
  mediumGray: [108, 117, 125] as [number, number, number],
  lightGray: [245, 245, 245] as [number, number, number],
  tableBg: [248, 249, 250] as [number, number, number],
  headerBg: [52, 58, 64] as [number, number, number],
  green: [25, 135, 84] as [number, number, number],
  blue: [13, 110, 253] as [number, number, number],
}

const MARGIN = 20

function drawHeader(doc: jsPDF, shopName: string, pageWidth: number, yPos: number): number {
  // Shop Name
  doc.setFontSize(22)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(...COLORS.darkGray)
  doc.text(shopName, pageWidth / 2, yPos, { align: 'center' })
  yPos += 8

  // Report Title
  doc.setFontSize(12)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(...COLORS.mediumGray)
  doc.text('Daily Sales Report', pageWidth / 2, yPos, { align: 'center' })
  yPos += 6

  // Divider
  doc.setDrawColor(200)
  doc.setLineWidth(0.5)
  doc.line(MARGIN, yPos, pageWidth - MARGIN, yPos)
  yPos += 8

  return yPos
}

function drawDate(doc: jsPDF, date: string, yPos: number): number {
  doc.setFontSize(11)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(...COLORS.darkGray)
  doc.text(formatFullDay(date), MARGIN, yPos)
  return yPos + 10
}

function drawSummary(doc: jsPDF, selectedDay: DayData, contentWidth: number, yPos: number): number {
  // Section label
  doc.setFontSize(9)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(...COLORS.mediumGray)
  doc.text('SUMMARY', MARGIN, yPos)
  yPos += 4

  // Summary box
  doc.setFillColor(...COLORS.lightGray)
  doc.roundedRect(MARGIN, yPos, contentWidth, 18, 1, 1, 'F')

  const summaryY = yPos + 7
  const colWidth = contentWidth / 4

  // Labels
  doc.setFontSize(8)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(...COLORS.mediumGray)
  doc.text('Total Sales', MARGIN + 5, summaryY)
  doc.text('Transactions', MARGIN + colWidth + 5, summaryY)
  doc.text('UPI', MARGIN + colWidth * 2 + 5, summaryY)
  doc.text('Cash', MARGIN + colWidth * 3 + 5, summaryY)

  // Values
  doc.setFontSize(12)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(...COLORS.darkGray)
  doc.text(`Rs. ${selectedDay.revenue.toFixed(0)}`, MARGIN + 5, summaryY + 6)
  doc.text(String(selectedDay.transactions), MARGIN + colWidth + 5, summaryY + 6)

  doc.setTextColor(...COLORS.green)
  doc.text(`Rs. ${selectedDay.upi.toFixed(0)}`, MARGIN + colWidth * 2 + 5, summaryY + 6)

  doc.setTextColor(...COLORS.blue)
  doc.text(`Rs. ${selectedDay.cash.toFixed(0)}`, MARGIN + colWidth * 3 + 5, summaryY + 6)

  return yPos + 24
}

function drawTaxSection(doc: jsPDF, taxCollected: number, yPos: number): number {
  doc.setFontSize(9)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(...COLORS.mediumGray)
  doc.text('TAX SUMMARY', MARGIN, yPos)
  yPos += 4

  doc.setFillColor(...COLORS.lightGray)
  doc.roundedRect(MARGIN, yPos, 170, 10, 1, 1, 'F')

  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(...COLORS.darkGray)
  doc.text(`Tax Collected: Rs. ${taxCollected.toFixed(2)}`, MARGIN + 5, yPos + 7)

  return yPos + 14
}

function drawTopItems(doc: jsPDF, topItems: ProductStat[], yPos: number): number {
  doc.setFontSize(9)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(...COLORS.mediumGray)
  doc.text('TOP SELLING ITEMS', MARGIN, yPos)
  yPos += 4

  autoTable(doc, {
    startY: yPos,
    head: [['Rank', 'Item', 'Qty Sold', 'Revenue']],
    body: topItems.map((item, i) => [
      `${i + 1}.`,
      item.name,
      String(item.qty),
      `Rs. ${item.revenue.toFixed(0)}`
    ]),
    theme: 'striped',
    headStyles: { fillColor: COLORS.headerBg, textColor: 255, fontStyle: 'bold', fontSize: 9 },
    bodyStyles: { fontSize: 9, textColor: COLORS.darkGray },
    alternateRowStyles: { fillColor: COLORS.tableBg },
    margin: { left: MARGIN, right: MARGIN },
    columnStyles: {
      0: { cellWidth: 'auto' },
      1: { cellWidth: 30, halign: 'center' },
      2: { cellWidth: 35, halign: 'right' },
    },
  })

  return (doc as any).lastAutoTable.finalY + 8
}

function drawAllItems(doc: jsPDF, items: DayData['items'], yPos: number): number {
  doc.setFontSize(9)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(...COLORS.mediumGray)
  doc.text('ALL ITEMS SOLD', MARGIN, yPos)
  yPos += 4

  autoTable(doc, {
    startY: yPos,
    head: [['#', 'Item', 'Qty', 'Unit Price', 'Revenue']],
    body: items.map((item, i) => [
      String(i + 1),
      item.name,
      String(item.qty),
      `Rs. ${(item.revenue / item.qty).toFixed(0)}`,
      `Rs. ${item.revenue.toFixed(0)}`
    ]),
    foot: [['', '', '', 'Total', `Rs. ${items.reduce((a, item) => a + item.revenue, 0).toFixed(0)}`]],
    theme: 'striped',
    headStyles: { fillColor: COLORS.headerBg, textColor: 255, fontStyle: 'bold', fontSize: 9 },
    bodyStyles: { fontSize: 9, textColor: COLORS.darkGray },
    alternateRowStyles: { fillColor: COLORS.tableBg },
    footStyles: { fillColor: COLORS.lightGray, fontStyle: 'bold', textColor: COLORS.darkGray, fontSize: 9 },
    margin: { left: MARGIN, right: MARGIN },
    columnStyles: {
      0: { cellWidth: 15, halign: 'center' },
      1: { cellWidth: 'auto' },
      2: { cellWidth: 25, halign: 'center' },
      3: { cellWidth: 30, halign: 'right' },
      4: { cellWidth: 35, halign: 'right' },
    },
  })

  return (doc as any).lastAutoTable.finalY + 8
}

function drawFooter(doc: jsPDF, shopName: string, pageWidth: number, yPos: number) {
  doc.setDrawColor(200)
  doc.setLineWidth(0.3)
  doc.line(MARGIN, yPos, pageWidth - MARGIN, yPos)
  yPos += 5

  doc.setFontSize(7)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(...COLORS.mediumGray)
  const timestamp = new Date().toLocaleDateString('en-IN', {
    day: 'numeric', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  })
  doc.text(`Generated: ${timestamp}`, MARGIN, yPos)
  doc.text(`${shopName} • Point of Sale`, pageWidth - MARGIN, yPos, { align: 'right' })
}

export async function generateDailyReportPDF(
  selectedDay: DayData,
  shopName: string,
  taxEnabled: boolean,
  topItems: ProductStat[],
  taxCollected: number
): Promise<string | null> {
  const doc = new jsPDF('p', 'mm', 'a4')
  const pageWidth = doc.internal.pageSize.getWidth()
  const contentWidth = pageWidth - MARGIN * 2

  let yPos = MARGIN
  yPos = drawHeader(doc, shopName, pageWidth, yPos)
  yPos = drawDate(doc, selectedDay.date, yPos)
  yPos = drawSummary(doc, selectedDay, contentWidth, yPos)

  if (taxEnabled) {
    yPos = drawTaxSection(doc, taxCollected, yPos)
  }

  if (topItems.length > 0) {
    yPos = drawTopItems(doc, topItems, yPos)
  }

  if (selectedDay.items.length > 0) {
    yPos = drawAllItems(doc, selectedDay.items, yPos)
  }

  drawFooter(doc, shopName, pageWidth, yPos)

  // Save via Go backend
  const pdfBase64 = doc.output('datauristring').split(',')[1]
  const path = await SaveFile('Save PDF Report', `daily-report-${selectedDay.date}.pdf`, pdfBase64)
  return path
}
