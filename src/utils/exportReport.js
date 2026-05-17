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

function dateToKey(val) {
  if (!val && val !== 0) return null
  let d
  if (val instanceof Date) d = val
  else if (typeof val === 'number' && val > 0) d = new Date(Math.round((val - 25569) * 86400 * 1000))
  else { d = new Date(val); if (isNaN(d.getTime())) return null }
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export function exportFraudReport(flaggedEntries, filename = 'Fraud_Report.xlsx', holidayMap = {}, isDoubleEntry = false) {
  const wb = XLSX.utils.book_new()

  // Sheet 1: Flagged Entries
  const reportData = flaggedEntries.map((entry, idx) => {
    const postingRaw  = getField(entry.row, 'Posting Date')
    const holidayName = entry.reasons.includes('Holiday Entry')
      ? (() => { const k = dateToKey(postingRaw); return k ? (holidayMap[k] || '') : '' })()
      : ''
    const detailStr = Object.entries(entry.flagDetails || {}).map(([r, d]) => `${r}: ${d}`).join(' | ')

    if (isDoubleEntry) {
      return {
        'No.':             idx + 1,
        'Row #':           entry.rowIndex + 1,
        'Journal ID':      getField(entry.row, 'Journal ID') || '',
        'DR Account':      entry.row['DR Account'] || '',
        'CR Account':      entry.row['CR Account'] || '',
        'Amount':          getField(entry.row, 'Amount'),
        'Posting Date':    formatDateForExport(postingRaw),
        'Effective Date':  formatDateForExport(getField(entry.row, 'Effective Date')),
        'JE Narration':    getField(entry.row, 'JE Narration'),
        'User':            getField(entry.row, 'User'),
        'Risk Score':      entry.riskScore,
        'Risk Level':      entry.riskLevel,
        'Triggered Tests': entry.reasons.join(', '),
        'Flag Details':    detailStr,
        'Holiday Name':    holidayName,
        'Explanation':     buildExplanation(entry.reasons),
      }
    }

    return {
      'No.':             idx + 1,
      'Row #':           entry.rowIndex + 1,
      'Account Number':  getField(entry.row, 'Account Number'),
      'Amount':          getField(entry.row, 'Amount'),
      'Posting Date':    formatDateForExport(postingRaw),
      'Effective Date':  formatDateForExport(getField(entry.row, 'Effective Date')),
      'JE Narration':    getField(entry.row, 'JE Narration'),
      'User':            getField(entry.row, 'User'),
      'Risk Score':      entry.riskScore,
      'Risk Level':      entry.riskLevel,
      'Triggered Tests': entry.reasons.join(', '),
      'Holiday Name':    holidayName,
      'Explanation':     buildExplanation(entry.reasons),
    }
  })

  const ws1 = XLSX.utils.json_to_sheet(reportData)
  ws1['!cols'] = isDoubleEntry
    ? [{ wch: 5 }, { wch: 6 }, { wch: 14 }, { wch: 18 }, { wch: 18 }, { wch: 14 }, { wch: 14 }, { wch: 14 }, { wch: 40 }, { wch: 18 }, { wch: 11 }, { wch: 12 }, { wch: 50 }, { wch: 28 }, { wch: 80 }]
    : [{ wch: 5 }, { wch: 6 }, { wch: 18 }, { wch: 14 }, { wch: 14 }, { wch: 14 }, { wch: 40 }, { wch: 18 }, { wch: 11 }, { wch: 12 }, { wch: 28 }, { wch: 80 }]
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
