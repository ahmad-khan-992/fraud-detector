export function generateInsights(summary) {
  if (!summary || summary.flagged === 0) return []

  const { total, flagged, riskPercent, reasonCounts, riskCounts } = summary
  const insights = []

  const sorted = Object.entries(reasonCounts).sort((a, b) => b[1] - a[1])
  const [topReason, topCount] = sorted[0] || []
  if (topReason) {
    insights.push({
      type: 'warning',
      title: 'Top Risk Indicator',
      text: `"${topReason}" is the leading fraud signal with ${topCount} flag${topCount !== 1 ? 's' : ''}, accounting for ${((topCount / flagged) * 100).toFixed(0)}% of all flagged entries.`,
    })
  }

  if (riskCounts.High > 0) {
    const highPct = ((riskCounts.High / total) * 100).toFixed(1)
    insights.push({
      type: 'critical',
      title: 'Immediate Attention Required',
      text: `${riskCounts.High} transaction${riskCounts.High !== 1 ? 's' : ''} scored High risk (${highPct}% of dataset). These should be escalated for manual review immediately.`,
    })
  }

  const wkd = (reasonCounts['Weekend Entry (Saturday)'] || 0) + (reasonCounts['Weekend Entry (Sunday)'] || 0)
  if (wkd > 0) {
    insights.push({
      type: 'info',
      title: 'Off-Hours Posting Activity',
      text: `${wkd} entries were posted on weekends — unusual for routine GL activity and a common indicator of unauthorised or override entries.`,
    })
  }

  const dateAnomaly =
    (reasonCounts['Backdated Entry'] || 0) +
    (reasonCounts['Postdated Entry'] || 0) +
    (reasonCounts['Entry After Year-End'] || 0)
  if (dateAnomaly > 0) {
    insights.push({
      type: 'warning',
      title: 'Date Manipulation Risk',
      text: `${dateAnomaly} entries show suspicious date patterns (backdated, postdated, or after year-end), which are commonly used to obscure the timing of transactions.`,
    })
  }

  if (reasonCounts['Rare User'] > 0) {
    insights.push({
      type: 'info',
      title: 'Unusual User Activity',
      text: `${reasonCounts['Rare User']} entries were posted by infrequent users — potentially indicating access by unauthorised or override-level accounts.`,
    })
  }

  if (reasonCounts['Seldom Used Account'] > 0) {
    insights.push({
      type: 'info',
      title: 'Low-Frequency Account Usage',
      text: `${reasonCounts['Seldom Used Account']} entries hit accounts that appear only once in the dataset, which can indicate dormant account manipulation.`,
    })
  }

  if (reasonCounts['Repeating Digit Amount'] > 0) {
    insights.push({
      type: 'warning',
      title: 'Suspicious Amount Patterns',
      text: `${reasonCounts['Repeating Digit Amount']} entries contain amounts with repeating digits (e.g. 1,111 or 5,555) — a classic indicator of fictitious transactions or test entries left in production.`,
    })
  }

  const flagPct = parseFloat(riskPercent)
  if (flagPct < 5 && flagged > 0) {
    insights.push({
      type: 'success',
      title: 'Low Overall Risk',
      text: `The flag rate of ${riskPercent}% is within acceptable thresholds. Focus review efforts on the ${riskCounts.High || 0} High-risk entr${riskCounts.High !== 1 ? 'ies' : 'y'}.`,
    })
  } else if (flagPct >= 20) {
    insights.push({
      type: 'critical',
      title: 'Elevated Portfolio Risk',
      text: `A flag rate of ${riskPercent}% significantly exceeds normal thresholds. A comprehensive investigation of this dataset is strongly recommended.`,
    })
  }

  return insights
}
