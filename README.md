# AnomalyScanner — Journal Entry Fraud Detector

A browser-based audit tool that lets you upload a General Ledger export, validate data quality, and run 11 automated fraud-detection checks against your journal entries — all without any backend server.

---

## Features

### Upload & Analyse
- Drag-and-drop or browse for `.xlsx` / `.xls` GL exports
- **Flexible column matching** — accepts common naming variations (e.g. `Acc_No`, `Account_Number`, `GL_Account` are all recognised as *Account Number*)
- **Column validation** — checks all 6 required columns are present and shows exactly which header in your file was matched
- **Data quality checks** — inspects actual cell values per column (dates must be dates, amounts must be numbers, etc.) with row-level invalid counts and example bad values
- **Paginated data preview** — browse all rows with a configurable rows-per-page selector (10 / 50 / 100)
- Fraud tests run automatically as soon as a valid file is uploaded

### 11 Fraud Detection Checks
| # | Test | Risk Weight |
|---|------|-------------|
| 1 | Zero / Null Amount | High |
| 2 | Short / Missing Narration | Low |
| 3 | Unusually High Amount (top 5%) | Medium |
| 4 | Unusually Low Amount (bottom 5%) | Low |
| 5 | Weekend Entry (Saturday / Sunday) | Low |
| 6 | Seldom Used Account | Medium |
| 7 | Rare User | Medium |
| 8 | Null / Missing Field | Medium |
| 9 | Backdated Entry (effective date > 5 days before posting) | High |
| 10 | Postdated Entry (posting date in the future) | Medium |
| 11 | Entry After Year-End | High |
| 12 | Repeating Digit Amount (e.g. 111, 2222) | Medium |

Each flagged entry receives a **risk score** and is classified as **High / Medium / Low** risk.

### Analytics Page
- Summary stat cards: total entries, flagged count, high-risk count, flag rate
- Risk distribution chart (pie)
- Fraud indicator frequency chart (bar)
- AI-style smart insights derived from the results

### Fraud Report Page
- Printable, export-ready report
- Executive summary with key metrics and a risk-level progress bar
- Top 20 high-risk transactions table
- Full breakdown of every fraud test triggered
- Export to Excel (`.xlsx`) or Print to PDF

### Saved Sessions
- Save any completed analysis to browser storage
- Reload a previous session to revisit results without re-uploading

---

## Required Columns

The tool expects these six columns (exact names or any recognised alias):

| Canonical Name | Accepted Aliases |
|---|---|
| Account Number | `Account_Number`, `Acc_No`, `Acct_No`, `Account_No`, `GL_Account`, `Ledger_Account`, … |
| Amount | `Amt`, `Transaction_Amount`, `Trans_Amt`, `Net_Amount`, `Value`, … |
| Posting Date | `Posting_Date`, `Post_Date`, `Entry_Date`, `Transaction_Date`, `JE_Date`, … |
| Effective Date | `Effective_Date`, `Eff_Date`, `Value_Date`, `Val_Date`, `Effect_Date`, … |
| JE Narration | `Narration`, `Description`, `Narrative`, `Particulars`, `Memo`, `Remarks`, … |
| User | `Username`, `User_Name`, `Posted_By`, `Created_By`, `Entered_By`, `Preparer`, … |

---

## Tech Stack

| Layer | Library |
|---|---|
| UI framework | React 18 |
| Routing | React Router v7 |
| Charts | Recharts |
| Excel parsing | SheetJS (xlsx) |
| Styling | Tailwind CSS v3 |
| Build tool | Vite |

---

## Getting Started

### Prerequisites
- Node.js 18+
- npm

### Install & run locally

```bash
git clone https://github.com/ahmad-khan-992/fraud-detector.git
cd fraud-detector
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

### Build for production

```bash
npm run build
```

Output is written to `dist/`. The app is fully static and can be hosted on any CDN (Vercel, Netlify, GitHub Pages, etc.).

---

## Project Structure

```
src/
├── components/
│   ├── charts/          # Recharts wrappers (risk distribution, indicator frequency)
│   ├── layout/          # AppShell, Sidebar, Topbar
│   ├── ColumnValidation.jsx   # Column presence + data quality display
│   ├── DataPreview.jsx        # Paginated data table
│   ├── FileUpload.jsx         # Drag-and-drop uploader
│   ├── FraudResults.jsx       # Flagged entries table
│   ├── FraudSummary.jsx       # Summary cards + breakdown bars
│   └── SmartInsights.jsx      # Derived insight bullets
├── context/
│   └── AuditContext.jsx       # Global state provider
├── hooks/
│   ├── useFileParser.js       # File parsing + state
│   ├── useFraudTests.js       # Test runner + state
│   └── useReportStorage.js    # localStorage session persistence
├── pages/
│   ├── Dashboard.jsx          # Upload & Analyse page
│   ├── AnalyticsPage.jsx      # Charts & insights
│   ├── ReportPage.jsx         # Printable fraud report
│   └── SavedSessionsPage.jsx  # Saved session manager
└── utils/
    ├── columnConfig.js        # Column aliases & matching
    ├── parseExcel.js          # XLSX parsing + column normalisation
    ├── validateData.js        # Per-column data type validation
    ├── fraudTests.js          # All 11 fraud detection tests
    ├── generateInsights.js    # Smart insight generator
    └── exportReport.js        # Excel export utility
```

---

## License

MIT
