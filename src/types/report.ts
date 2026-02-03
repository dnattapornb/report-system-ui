export type MonthlyReport = Record<string, number>;

export interface SaaSMetricItem {
  year: string;
  month: string;
  mrr: number;
  expansion: number;
  churnAmount: number;
  contraction: number;
  nrrPercent: number;
  grrPercent: number;
  churnRatePercent: number;
  newClientsOrganic: number;
  newClientsBusinessPartner: number;
  clientsDropOut: number;
  clientsFreeTrial: number;
  clientsPendingSetup: number;
  targetHotels: number;
  actualHotels: number;
  totalSalesRep: number;
  revenueTarget: number;
  revenueActual: number;
  targetProfit: number;
  actualProfit: number;
  label?: string;
}

/**
 * @example
 * {
 *   "2024": {
 *     "01": { mrr: 1000, nrrPercent: 105, ... },
 *     "02": { mrr: 1200, nrrPercent: 106, ... }
 *   }
 * }
 */
export type SaaSMetricsData = Record<string, Record<string, SaaSMetricItem>>;
