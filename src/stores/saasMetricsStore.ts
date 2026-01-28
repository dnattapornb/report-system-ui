import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import apiClient from '../services/api';
import { socket } from '../services/socket';
import type { SaaSMetricsData } from '../types/report';

export const useSaasMetricsStore = defineStore('saasMetrics', () => {
  const saasMetricsData = ref<SaaSMetricsData | null>(null);

  const annualSelectedYear = ref<string | null>(null);
  const monthlySelectedMonth = ref<{ year: string; month: string } | null>(null);

  // --- Actions ---
  async function fetchAndConnect() {
    if (saasMetricsData.value) {
      console.log('SaaS Metrics data already loaded.');
      return; // Avoid refetching if already loaded
    }

    try {
      // Fetch initial data
      const response = await apiClient.get('/reports'); // Your endpoint for SaaS Metrics
      saasMetricsData.value = response.data;
      console.log('SaaS Metrics data loaded successfully:', saasMetricsData.value);

      // Set initial selected year for both sections to the latest available year
      if (saasMetricsData.value) {
        const years = Object.keys(saasMetricsData.value).sort((a, b) => parseInt(b) - parseInt(a));

        if (years.length > 0) {
          annualSelectedYear.value = years[0] || 2026;
          monthlySelectedMonth.value = {
            year: years[0] || 2026,
            month: 2,
          };
        }
        console.log('init annualSelectedYear =>', annualSelectedYear.value);
      }
    } catch (err) {
      console.error('Failed to load initial SaaS metrics data', err);
    }

    // Connect to WebSocket for real-time updates
    socket.on('update:saas-metrics', (newData: SaaSMetricsData) => {
      console.log('[Synced] Real-time SaaS Metrics updated via WebSocket');
      saasMetricsData.value = newData;
      // Re-apply filter if data updates and selected year/month no longer exist
      if (annualSelectedYear.value && !saasMetricsData.value[annualSelectedYear.value]) {
        annualSelectedYear.value = null;
      }
    });
  }

  // --- Getters ---

  // All available years from the data (used by both pickers)
  const allAvailableYears = computed(() => {
    if (!saasMetricsData.value) return [];
    const years = Object.keys(saasMetricsData.value).sort((a, b) => parseInt(a) - parseInt(b));
    console.log('Pinia Store: Computed allAvailableYears:', years);
    return years;
  });

  const annualChartData = computed(() => {
    if (!saasMetricsData.value) return [];

    let dataToProcess: SaaSMetricsData = saasMetricsData.value;

    // Apply annual year filter
    if (annualSelectedYear.value && dataToProcess[annualSelectedYear.value]) {
      dataToProcess = { [annualSelectedYear.value]: dataToProcess[annualSelectedYear.value] };
    } else if (annualSelectedYear.value === null) {
      // If no year is selected, show all years (or a default set like latest 3 years)
      // For now, let's show all available years if no specific year is selected
      // You might want to implement a limit here, e.g., show only latest 3 years
    }

    return Object.entries(dataToProcess)
      .flatMap(([year, months]) =>
        Object.entries(months).map(([month, data]) => ({
          ...data,
          year,
          month,
          label: `${new Date(Date.parse(month + ' 1, 2012')).toLocaleString('default', { month: 'short' })}-${year.slice(2)}`,
        })),
      )
      .sort((a, b) => new Date(`${a.year}-${a.month}-01`).getTime() - new Date(`${b.year}-${b.month}-01`).getTime());
  });

  const monthlyDeepDiveData = computed(() => {
    if (!saasMetricsData.value) return [];

    let dataToProcess: SaaSMetricsData = saasMetricsData.value;

    // Apply monthly month filter (if both year and month are selected)
    if (monthlySelectedMonth.value && dataToProcess[monthlySelectedMonth.value.year]?.[monthlySelectedMonth.value.month]) {
      dataToProcess = {
        [monthlySelectedMonth.value.year]: {
          [monthlySelectedMonth.value.month]: dataToProcess[monthlySelectedMonth.value.year][monthlySelectedMonth.value.month],
        },
      };
    } else {
      // If no year or month is selected for monthly, return empty
      return [];
    }

    return Object.entries(dataToProcess)
      .flatMap(([year, months]) =>
        Object.entries(months).map(([month, data]) => ({
          ...data,
          year,
          month,
          label: `${new Date(Date.parse(month + ' 1, 2012')).toLocaleString('default', { month: 'short' })}-${year.slice(2)}`,
        })),
      )
      .sort((a, b) => new Date(`${a.year}-${a.month}-01`).getTime() - new Date(`${b.year}-${b.month}-01`).getTime());
  });

  const monthlyDeepDiveKpis = computed(() => {
    if (!monthlyDeepDiveData.value || monthlyDeepDiveData.value.length === 0) return null;
    const data = monthlyDeepDiveData.value[0];
    return {
      label: data.label,
      mrr: data.mrr,
      expansion: data.expansion,
      churnAmount: data.churnAmount,
      contraction: data.contraction,
      nrrPercent: data.nrrPercent,
      grrPercent: data.grrPercent,
      churnRatePercent: data.churnRatePercent,
      actualProfit: data.actualProfit,
      targetProfit: data.targetProfit,
      totalRevenue: data.totalRevenue,
      newClientsOrganic: data.newClientsOrganic,
      newClientsBusinessPartner: data.newClientsBusinessPartner,
      newClientsTotal: data.newClientsOrganic + data.newClientsBusinessPartner,
      clientsDropOut: data.clientsDropOut,
      clientsFreeTrial: data.clientsFreeTrial,
      clientsPendingSetup: data.clientsPendingSetup,
      actualHotels: data.actualHotels,
      targetHotels: data.targetHotels,
      totalSalesRep: data.totalSalesRep,
    };
  });

  return {
    saasMetricsData,
    annualSelectedYear,
    monthlySelectedMonth,
    fetchAndConnect,
    allAvailableYears,
    annualChartData,
    monthlyDeepDiveData,
    monthlyDeepDiveKpis,
  };
});
