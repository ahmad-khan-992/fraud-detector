const FIELD_DESCRIPTIONS = {
  'Amount':       'Numeric transaction amount (debit or credit value)',
  'PostingDate':  'Date the journal entry was posted or recorded',
  'UserID':       'User or preparer who created the entry',
  'Account':      'GL account number or account code',
  'Description':  'Narration, memo, or description of the transaction',
  'JournalType':  'Type or source of the journal entry (manual, system, etc.)',
}

export async function suggestColumnMapping(apiKey, rawHeaders, sampleRows, missingColumns) {
  const samples = sampleRows.slice(0, 3).map(row => {
    const out = {}
    rawHeaders.forEach(h => { out[h] = row[h] ?? '' })
    return out
  })

  const prompt = `You are a financial data analyst. A user has uploaded a file with these column headers:
${JSON.stringify(rawHeaders)}

Sample data (first 3 rows):
${JSON.stringify(samples, null, 2)}

The following required canonical fields are missing and need to be mapped:
${missingColumns.map(col => `- "${col}": ${FIELD_DESCRIPTIONS[col] || col}`).join('\n')}

For each missing canonical field, identify the best matching column header from the file, or null if no reasonable match exists.

Respond with ONLY a JSON object like:
{
  "Amount": "Debit Amount",
  "PostingDate": "Entry Date",
  "UserID": null
}

Only include the missing fields listed above. No explanation, no markdown, just the JSON object.`

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    body: JSON.stringify({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 512,
      messages: [{ role: 'user', content: prompt }],
    }),
  })

  if (!response.ok) {
    const err = await response.json().catch(() => ({}))
    throw new Error(err?.error?.message || `API error ${response.status}`)
  }

  const data = await response.json()
  const text = data.content?.[0]?.text?.trim() || ''

  const jsonMatch = text.match(/\{[\s\S]*\}/)
  if (!jsonMatch) throw new Error('Invalid response from AI')

  return JSON.parse(jsonMatch[0])
}
