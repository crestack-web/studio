import { HOME_METRICS, FORECASTS, MO_ASK_CHIPS } from './mockData';

export async function getDashboardData() {
  // Simulate a network request
  await new Promise(resolve => setTimeout(resolve, 1000));

  const insights = [
    { color: 'var(--green)', text: 'Profit margin', strong: 'healthy at 29%', lastSaleDate: '2023-10-26T10:00:00Z' },
    { color: 'var(--red)', text: '', strong: 'Bottled Water', suffix: ' runs out in ~3 days', lastSaleDate: '2023-10-26T10:00:00Z' },
    { color: 'var(--blue)', text: 'Sabuni is ', strong: '96% of revenue', suffix: ' — diversify', lastSaleDate: '2023-10-26T10:00:00Z' },
    { color: 'var(--purple)', text: 'Cash runway strong at ', strong: '~45 days', lastSaleDate: '2023-10-26T10:00:00Z' },
  ];

  return {
    homeMetrics: HOME_METRICS,
    insights: insights,
    forecasts: FORECASTS,
    moAskChips: MO_ASK_CHIPS,
  };
}
