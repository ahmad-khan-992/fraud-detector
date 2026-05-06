import { REASON_KEYS } from './fraudTests'

export function generateInsights(summary, t = k => k) {
  if (!summary || summary.flagged === 0) return []

  const { total, flagged, riskPercent, reasonCounts, riskCounts } = summary
  const tReason = r => t(`reasons.${REASON_KEYS[r] || r}`)
  const insights = []

  const sorted = Object.entries(reasonCounts).sort((a, b) => b[1] - a[1])
  const [topReason, topCount] = sorted[0] || []
  if (topReason) {
    insights.push({
      type: 'warning',
      title: t('insights.topRiskTitle'),
      text: t('insights.topRiskText', {
        reason: tReason(topReason),
        count: topCount,
        pct: ((topCount / flagged) * 100).toFixed(0),
      }),
    })
  }

  if (riskCounts.High > 0) {
    insights.push({
      type: 'critical',
      title: t('insights.immediateTitle'),
      text: t('insights.immediateText', {
        count: riskCounts.High,
        pct: ((riskCounts.High / total) * 100).toFixed(1),
      }),
    })
  }

  const wkd = (reasonCounts['Weekend Entry (Saturday)'] || 0) + (reasonCounts['Weekend Entry (Sunday)'] || 0)
  if (wkd > 0) {
    insights.push({
      type: 'info',
      title: t('insights.offHoursTitle'),
      text: t('insights.offHoursText', { count: wkd }),
    })
  }

  const dateAnomaly =
    (reasonCounts['Backdated Entry'] || 0) +
    (reasonCounts['Postdated Entry'] || 0) +
    (reasonCounts['Entry After Year-End'] || 0)
  if (dateAnomaly > 0) {
    insights.push({
      type: 'warning',
      title: t('insights.dateManiTitle'),
      text: t('insights.dateManiText', { count: dateAnomaly }),
    })
  }

  if (reasonCounts['Rare User'] > 0) {
    insights.push({
      type: 'info',
      title: t('insights.unusualUserTitle'),
      text: t('insights.unusualUserText', { count: reasonCounts['Rare User'] }),
    })
  }

  if (reasonCounts['Seldom Used Account'] > 0) {
    insights.push({
      type: 'info',
      title: t('insights.lowFreqTitle'),
      text: t('insights.lowFreqText', { count: reasonCounts['Seldom Used Account'] }),
    })
  }

  if (reasonCounts['Repeating Digit Amount'] > 0) {
    insights.push({
      type: 'warning',
      title: t('insights.suspAmountTitle'),
      text: t('insights.suspAmountText', { count: reasonCounts['Repeating Digit Amount'] }),
    })
  }

  const flagPct = parseFloat(riskPercent)
  if (flagPct < 5 && flagged > 0) {
    insights.push({
      type: 'success',
      title: t('insights.lowRiskTitle'),
      text: t('insights.lowRiskText', { pct: riskPercent, highCount: riskCounts.High || 0 }),
    })
  } else if (flagPct >= 20) {
    insights.push({
      type: 'critical',
      title: t('insights.elevatedTitle'),
      text: t('insights.elevatedText', { pct: riskPercent }),
    })
  }

  return insights
}
