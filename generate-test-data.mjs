import * as XLSX from 'xlsx'

// 55-row dataset designed to trigger all 11 fraud tests
const rows = [

  // ── Normal entries (bulk baseline) ──────────────────────────────────────────
  { 'Account Number': 'A-1100', Amount: 12500.00, 'Posting Date': '2024-01-08', 'Effective Date': '2024-01-08', 'JE Narration': 'Monthly payroll processing January cycle',        User: 'Sarah Chen'    },
  { 'Account Number': 'A-2200', Amount:  8750.00, 'Posting Date': '2024-01-15', 'Effective Date': '2024-01-15', 'JE Narration': 'Vendor payment batch - office supplies',           User: 'James Okafor'  },
  { 'Account Number': 'A-3300', Amount: 24000.00, 'Posting Date': '2024-01-22', 'Effective Date': '2024-01-22', 'JE Narration': 'Q4 revenue recognition adjustment entry',          User: 'Priya Patel'   },
  { 'Account Number': 'A-1100', Amount: 15300.00, 'Posting Date': '2024-02-05', 'Effective Date': '2024-02-05', 'JE Narration': 'Monthly payroll processing February cycle',        User: 'Sarah Chen'    },
  { 'Account Number': 'A-4400', Amount: 32000.00, 'Posting Date': '2024-02-12', 'Effective Date': '2024-02-12', 'JE Narration': 'Insurance premium annual payment Q1',              User: 'Marcus Reed'   },
  { 'Account Number': 'A-2200', Amount:  7200.00, 'Posting Date': '2024-02-19', 'Effective Date': '2024-02-19', 'JE Narration': 'Accounts payable clearing February batch',         User: 'Emma Walsh'    },
  { 'Account Number': 'A-5500', Amount: 18500.00, 'Posting Date': '2024-03-04', 'Effective Date': '2024-03-04', 'JE Narration': 'Depreciation charge Q1 property assets',          User: 'James Okafor'  },
  { 'Account Number': 'A-6600', Amount: 44000.00, 'Posting Date': '2024-03-11', 'Effective Date': '2024-03-11', 'JE Narration': 'Intercompany transfer settlement March',           User: 'Priya Patel'   },
  { 'Account Number': 'A-3300', Amount:  9800.00, 'Posting Date': '2024-03-18', 'Effective Date': '2024-03-18', 'JE Narration': 'Credit note adjustment for returned goods',        User: 'Emma Walsh'    },
  { 'Account Number': 'A-7700', Amount: 27500.00, 'Posting Date': '2024-04-01', 'Effective Date': '2024-04-01', 'JE Narration': 'Capital expenditure approval batch April',         User: 'Marcus Reed'   },
  { 'Account Number': 'A-4400', Amount: 11200.00, 'Posting Date': '2024-04-08', 'Effective Date': '2024-04-08', 'JE Narration': 'Staff expense reimbursement Q2 opening',           User: 'Sarah Chen'    },
  { 'Account Number': 'A-1100', Amount: 13800.00, 'Posting Date': '2024-04-15', 'Effective Date': '2024-04-15', 'JE Narration': 'Monthly payroll processing April cycle',           User: 'James Okafor'  },
  { 'Account Number': 'A-5500', Amount: 62000.00, 'Posting Date': '2024-05-06', 'Effective Date': '2024-05-06', 'JE Narration': 'Lease payment renewal long-term asset Q2',        User: 'Priya Patel'   },
  { 'Account Number': 'A-6600', Amount: 16700.00, 'Posting Date': '2024-05-13', 'Effective Date': '2024-05-13', 'JE Narration': 'Legal and compliance fees Q2 allocation',          User: 'Emma Walsh'    },
  { 'Account Number': 'A-2200', Amount:  5500.00, 'Posting Date': '2024-05-20', 'Effective Date': '2024-05-20', 'JE Narration': 'Software license renewal annual subscription',    User: 'Marcus Reed'   },
  { 'Account Number': 'A-7700', Amount: 38000.00, 'Posting Date': '2024-06-03', 'Effective Date': '2024-06-03', 'JE Narration': 'Bond interest payment semi-annual schedule',      User: 'Sarah Chen'    },
  { 'Account Number': 'A-3300', Amount: 21000.00, 'Posting Date': '2024-06-10', 'Effective Date': '2024-06-10', 'JE Narration': 'H1 sales commission payout approved',             User: 'James Okafor'  },
  { 'Account Number': 'A-4400', Amount: 14500.00, 'Posting Date': '2024-06-17', 'Effective Date': '2024-06-17', 'JE Narration': 'Utility expense allocation June period',           User: 'Priya Patel'   },
  { 'Account Number': 'A-1100', Amount: 12900.00, 'Posting Date': '2024-07-01', 'Effective Date': '2024-07-01', 'JE Narration': 'Monthly payroll processing July cycle',            User: 'Emma Walsh'    },
  { 'Account Number': 'A-5500', Amount: 29000.00, 'Posting Date': '2024-07-08', 'Effective Date': '2024-07-08', 'JE Narration': 'Depreciation charge Q3 machinery assets',         User: 'Marcus Reed'   },
  { 'Account Number': 'A-2200', Amount: 19500.00, 'Posting Date': '2024-08-26', 'Effective Date': '2024-08-26', 'JE Narration': 'Marketing expense allocation Q3 budget',          User: 'Emma Walsh'    },
  { 'Account Number': 'A-6600', Amount: 31000.00, 'Posting Date': '2024-09-30', 'Effective Date': '2024-09-30', 'JE Narration': 'Q3 intercompany netting settlement approved',      User: 'Marcus Reed'   },
  { 'Account Number': 'A-7700', Amount: 26500.00, 'Posting Date': '2024-10-28', 'Effective Date': '2024-10-28', 'JE Narration': 'Amortisation charge intangible assets Q4',        User: 'Sarah Chen'    },
  { 'Account Number': 'A-3300', Amount: 41500.00, 'Posting Date': '2024-11-18', 'Effective Date': '2024-11-18', 'JE Narration': 'Revenue deferral adjustment subscription income', User: 'James Okafor'  },

  // ── Test 1: Zero / Null Amount ───────────────────────────────────────────────
  { 'Account Number': 'A-2200', Amount:       0,  'Posting Date': '2024-07-15', 'Effective Date': '2024-07-15', 'JE Narration': 'Contra entry system correction - pending fix', User: 'Sarah Chen'   },
  { 'Account Number': 'A-6600', Amount:      '',  'Posting Date': '2024-08-05', 'Effective Date': '2024-08-05', 'JE Narration': 'Null amount placeholder pending CFO approval', User: 'James Okafor' },

  // ── Test 2: Short / Missing Narration ────────────────────────────────────────
  { 'Account Number': 'A-3300', Amount:  4500.00, 'Posting Date': '2024-07-22', 'Effective Date': '2024-07-22', 'JE Narration': 'adj',  User: 'Priya Patel'  },
  { 'Account Number': 'A-7700', Amount: 18000.00, 'Posting Date': '2024-08-12', 'Effective Date': '2024-08-12', 'JE Narration': 'ok',   User: 'Emma Walsh'   },
  { 'Account Number': 'A-4400', Amount:  7800.00, 'Posting Date': '2024-09-02', 'Effective Date': '2024-09-02', 'JE Narration': '',     User: 'Marcus Reed'  },

  // ── Test 4: Weekend Entries ───────────────────────────────────────────────────
  // Jan 27 2024 = Saturday
  { 'Account Number': 'A-1100', Amount: 23000.00, 'Posting Date': '2024-01-27', 'Effective Date': '2024-01-26', 'JE Narration': 'Urgent end-of-month catch-up posting entry',    User: 'Sarah Chen'   },
  // Feb 25 2024 = Sunday
  { 'Account Number': 'A-2200', Amount:  9100.00, 'Posting Date': '2024-02-25', 'Effective Date': '2024-02-25', 'JE Narration': 'Weekend reconciliation posting for cash items',  User: 'James Okafor' },
  // Mar 23 2024 = Saturday
  { 'Account Number': 'A-5500', Amount: 41000.00, 'Posting Date': '2024-03-23', 'Effective Date': '2024-03-22', 'JE Narration': 'Accrual adjustment Saturday override entry',     User: 'Priya Patel'  },
  // Apr 28 2024 = Sunday
  { 'Account Number': 'A-3300', Amount:  6600.00, 'Posting Date': '2024-04-28', 'Effective Date': '2024-04-28', 'JE Narration': 'Sunday period close emergency batch posting',    User: 'Emma Walsh'   },

  // ── Test 5: Seldom Used Accounts ──────────────────────────────────────────────
  { 'Account Number': 'A-9901', Amount: 17500.00, 'Posting Date': '2024-08-19', 'Effective Date': '2024-08-19', 'JE Narration': 'Reserve fund allocation special project code',  User: 'Marcus Reed'  },
  { 'Account Number': 'A-9902', Amount: 33000.00, 'Posting Date': '2024-09-09', 'Effective Date': '2024-09-09', 'JE Narration': 'Contingency account disbursement approved',     User: 'Sarah Chen'   },
  { 'Account Number': 'A-9903', Amount:  8200.00, 'Posting Date': '2024-10-07', 'Effective Date': '2024-10-07', 'JE Narration': 'One-off suspense account clearing adjustment',  User: 'James Okafor' },

  // ── Test 6: Rare Users ────────────────────────────────────────────────────────
  { 'Account Number': 'A-6600', Amount: 55000.00, 'Posting Date': '2024-09-16', 'Effective Date': '2024-09-16', 'JE Narration': 'System override entry administrative batch',    User: 'SYSADMIN'      },
  { 'Account Number': 'A-7700', Amount: 12400.00, 'Posting Date': '2024-10-14', 'Effective Date': '2024-10-14', 'JE Narration': 'Temporary staff one-time reimbursement entry',  User: 'temp.override' },

  // ── Test 7: Null / Missing Fields ─────────────────────────────────────────────
  { 'Account Number': '',       Amount: 19000.00, 'Posting Date': '2024-09-23', 'Effective Date': '2024-09-23', 'JE Narration': 'Entry with missing account number field',        User: 'Priya Patel'  },
  { 'Account Number': 'A-4400', Amount:  6300.00, 'Posting Date': '2024-10-21', 'Effective Date': '2024-10-21', 'JE Narration': 'Missing user field - auto-generated entry',      User: ''             },

  // ── Test 8: Backdated Entries (posting − effective > 5 days) ─────────────────
  { 'Account Number': 'A-1100', Amount: 28000.00, 'Posting Date': '2024-02-28', 'Effective Date': '2024-02-10', 'JE Narration': 'Delayed processing January closing entries',     User: 'Marcus Reed'  },  // 18 days late
  { 'Account Number': 'A-3300', Amount: 11500.00, 'Posting Date': '2024-07-29', 'Effective Date': '2024-07-08', 'JE Narration': 'Prior period correction H1 accrual reversal',   User: 'Emma Walsh'   },  // 21 days late
  { 'Account Number': 'A-5500', Amount: 47000.00, 'Posting Date': '2024-11-18', 'Effective Date': '2024-10-28', 'JE Narration': 'Late processing Q3 audit adjustment required',  User: 'Sarah Chen'   },  // 21 days late

  // ── Test 9: Postdated Entries (posting > today: 2026-04-29) ──────────────────
  { 'Account Number': 'A-2200', Amount: 35000.00, 'Posting Date': '2026-05-15', 'Effective Date': '2026-05-15', 'JE Narration': 'Pre-booked recurring payment future dated',     User: 'James Okafor' },
  { 'Account Number': 'A-6600', Amount: 16800.00, 'Posting Date': '2026-06-01', 'Effective Date': '2026-06-01', 'JE Narration': 'Forward accrual scheduled entry approval',      User: 'Priya Patel'  },

  // ── Test 10: Entries After Year-End ───────────────────────────────────────────
  // Effective Dec 2024, Posted Jan/Feb 2025 (Q1 of following year)
  { 'Account Number': 'A-7700', Amount: 72000.00, 'Posting Date': '2025-01-15', 'Effective Date': '2024-12-20', 'JE Narration': 'Year-end accrual posted in new year January',   User: 'Marcus Reed'  },
  { 'Account Number': 'A-4400', Amount: 38500.00, 'Posting Date': '2025-02-10', 'Effective Date': '2024-12-31', 'JE Narration': 'December closing entry late posted February',   User: 'Emma Walsh'   },

  // ── Test 11: Repeating Digit Amounts ─────────────────────────────────────────
  { 'Account Number': 'A-1100', Amount:  1111.00, 'Posting Date': '2024-10-28', 'Effective Date': '2024-10-28', 'JE Narration': 'Suspense account test entry system check run',  User: 'Sarah Chen'   },
  { 'Account Number': 'A-2200', Amount:  5555.00, 'Posting Date': '2024-11-04', 'Effective Date': '2024-11-04', 'JE Narration': 'Repeating pattern entry internal audit item',   User: 'James Okafor' },
  { 'Account Number': 'A-3300', Amount: 22222.00, 'Posting Date': '2024-11-25', 'Effective Date': '2024-11-25', 'JE Narration': 'Round figure unusual pattern posting review',   User: 'Priya Patel'  },
  { 'Account Number': 'A-5500', Amount: 33333.00, 'Posting Date': '2024-12-02', 'Effective Date': '2024-12-02', 'JE Narration': 'Suspicious repeating digit amount flagged',      User: 'Emma Walsh'   },

  // ── Test 3: High Amount Outliers (top 5%) ─────────────────────────────────────
  { 'Account Number': 'A-6600', Amount: 850000.00,  'Posting Date': '2024-12-09', 'Effective Date': '2024-12-09', 'JE Narration': 'Major capital restructuring settlement payment', User: 'Marcus Reed'  },
  { 'Account Number': 'A-7700', Amount: 1200000.00, 'Posting Date': '2024-12-16', 'Effective Date': '2024-12-16', 'JE Narration': 'Asset disposal significant one-time transaction', User: 'Sarah Chen'   },

  // ── Test 3: Low Amount Outliers (bottom 5%) ───────────────────────────────────
  { 'Account Number': 'A-4400', Amount:    22.50, 'Posting Date': '2024-11-11', 'Effective Date': '2024-11-11', 'JE Narration': 'Minor rounding adjustment bank reconciliation',  User: 'James Okafor' },
  { 'Account Number': 'A-1100', Amount:    45.00, 'Posting Date': '2024-12-02', 'Effective Date': '2024-12-02', 'JE Narration': 'Small credit note clearing nominal account',      User: 'Priya Patel'  },
]

const ws = XLSX.utils.json_to_sheet(rows)

// Column widths
ws['!cols'] = [
  { wch: 18 }, // Account Number
  { wch: 14 }, // Amount
  { wch: 14 }, // Posting Date
  { wch: 14 }, // Effective Date
  { wch: 45 }, // JE Narration
  { wch: 16 }, // User
]

const wb = XLSX.utils.book_new()
XLSX.utils.book_append_sheet(wb, ws, 'Journal Entries')

const outFile = 'test-journal-entries.xlsx'
XLSX.writeFile(wb, outFile)

console.log(`\n✓ Generated: ${outFile}`)
console.log(`  ${rows.length} rows across 11 fraud test scenarios:\n`)
console.log('  Test 1  – Zero/Null Amount       → 2 rows  (rows 25-26)')
console.log('  Test 2  – Short Narration         → 3 rows  (rows 27-29)')
console.log('  Test 3  – Unusual Amounts         → 4 rows  (rows 52-55, needs ≥20 rows)')
console.log('  Test 4  – Weekend Entries         → 4 rows  (rows 30-33)')
console.log('  Test 5  – Seldom-Used Accounts    → 3 rows  (rows 34-36, A-9901/2/3)')
console.log('  Test 6  – Rare Users              → 2 rows  (rows 37-38, SYSADMIN/temp.override)')
console.log('  Test 7  – Null/Missing Fields     → 2 rows  (rows 39-40)')
console.log('  Test 8  – Backdated Entries       → 3 rows  (rows 41-43)')
console.log('  Test 9  – Postdated Entries       → 2 rows  (rows 44-45, dated May/Jun 2026)')
console.log('  Test 10 – After Year-End          → 2 rows  (rows 46-47, eff Dec-2024 / post Jan/Feb-2025)')
console.log('  Test 11 – Repeating Digit Amounts → 4 rows  (rows 48-51: 1111, 5555, 22222, 33333)\n')
