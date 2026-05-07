import * as XLSX from 'xlsx'
import { buildExplanation } from './fraudTests'

function getField(row, fieldName) {
  const target = fieldName.trim().toLowerCase()
  const key = Object.keys(row).find(k => k.trim().toLowerCase() === target)
  return key !== undefined ? row[key] : ''
}

function formatDateForExport(val) {
  if (!val && val !== 0) return ''
  if (val instanceof Date) return val.toLocaleDateString()
  const d = new Date(val)
  return isNaN(d.getTime()) ? String(val) : d.toLocaleDateString()
}

export function exportFraudReport(flaggedEntries, filename = 'Fraud_Report.xlsx') {
  const wb = XLSX.utils.book_new()

  // Sheet 1: Flagged Entries
  const reportData = flaggedEntries.map((entry, idx) => ({
    'No.':             idx + 1,
    'Row #':           entry.rowIndex + 1,
    'Account Number':  getField(entry.row, 'Account Number'),
    'Amount':          getField(entry.row, 'Amount'),
    'Posting Date':    formatDateForExport(getField(entry.row, 'Posting Date')),
    'Effective Date':  formatDateForExport(getField(entry.row, 'Effective Date')),
    'JE Narration':    getField(entry.row, 'JE Narration'),
    'User':            getField(entry.row, 'User'),
    'Risk Score':      entry.riskScore,
    'Risk Level':      entry.riskLevel,
    'Triggered Tests': entry.reasons.join(', '),
    'Explanation':     buildExplanation(entry.reasons),
  }))

  const ws1 = XLSX.utils.json_to_sheet(reportData)
  ws1['!cols'] = [
    { wch: 5 }, { wch: 6 }, { wch: 18 }, { wch: 14 }, { wch: 14 },
    { wch: 14 }, { wch: 40 }, { wch: 18 }, { wch: 11 }, { wch: 12 },
    { wch: 60 }, { wch: 80 },
  ]
  XLSX.utils.book_append_sheet(wb, ws1, 'Flagged Entries')

  // Sheet 2: Risk Summary
  const riskCounts = { Critical: 0, High: 0, Medium: 0, Low: 0 }
  for (const e of flaggedEntries) riskCounts[e.riskLevel] = (riskCounts[e.riskLevel] || 0) + 1

  const summaryData = [
    { 'Risk Level': 'Critical', Count: riskCounts.Critical },
    { 'Risk Level': 'High',     Count: riskCounts.High     },
    { 'Risk Level': 'Medium',   Count: riskCounts.Medium   },
    { 'Risk Level': 'Low',      Count: riskCounts.Low      },
    { 'Risk Level': 'Total Flagged', Count: flaggedEntries.length },
  ]
  const ws2 = XLSX.utils.json_to_sheet(summaryData)
  ws2['!cols'] = [{ wch: 16 }, { wch: 10 }]
  XLSX.utils.book_append_sheet(wb, ws2, 'Risk Summary')

  XLSX.writeFile(wb, filename)
}
