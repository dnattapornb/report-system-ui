import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import apiClient from '../services/api'; // Path to your API client
import { socket } from '../services/socket'; // Path to your Socket.io client
import type { SaaSMetricsData, SaaSMetricItem } from '../types/report';

export const useSaasMetricsStore = defineStore('saasMetrics', () => {
  // --- State ---
  const saasMetricsData = ref<SaaSMetricsData | null>(null);
  const selectedYear = ref<string | null>(null); // '2024', '2025', or null for all years
  const selectedMonth = ref<{ year: string; month: string } | null>(null); // { year: '2024', month: '01' } or null for all months

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

      // Set initial selected year to the latest available year
      if (saasMetricsData.value) {
        const years = Object.keys(saasMetricsData.value).sort((a, b) => parseInt(b) - parseInt(a));
        if (years.length > 0) {
          selectedYear.value = years[0]; // Select the latest year by default
        }
      }

    } catch (err) {
      console.error('Failed to load initial SaaS metrics data', err);
    }

    // Connect to WebSocket for real-time updates
    socket.on('update:saas-metrics', (newData: SaaSMetricsData) => {
      console.log('[Synced] Real-time SaaS Metrics updated via WebSocket');
      saasMetricsData.value = newData;
      // Re-apply filter if data updates
      if (selectedYear.value && !saasMetricsData.value[selectedYear.value]) {
        selectedYear.value = null; // Clear year filter if selected year no longer exists
      }
      if (selectedMonth.value && !saasMetricsData.value[selectedMonth.value.year]?.[selectedMonth.value.month]) {
        selectedMonth.value = null; // Clear month filter if selected month no longer exists
      }
    });
  }

  // --- Getters ---

  // All available years from the data
  const availableYears = computed(() => {
    if (!saasMetricsData.value) return [];
    const years = Object.keys(saasMetricsData.value).sort((a, b) => parseInt(a) - parseInt(b));
    console.log('Computed availableYears:', years);
    return years;
  });

  // All available months for a given year
  const availableMonths = computed(() => {
    if (!saasMetricsData.value || !selectedYear.value) return [];
    const months = saasMetricsData.value[selectedYear.value];
    if (!months) return [];
    return Object.keys(months).sort((a, b) => parseInt(a) - parseInt(b));
  });

  // Flattened and sorted data for easier processing in charts
  const sortedMonthlyData = computed(() => {
    if (!saasMetricsData.value) return [];

    let dataToProcess: SaaSMetricsData = saasMetricsData.value;

    // Apply year filter
    if (selectedYear.value && dataToProcess[selectedYear.value]) {
      dataToProcess = { [selectedYear.value]: dataToProcess[selectedYear.value] };
    }

    // Apply month filter (if both year and month are selected)
    if (selectedMonth.value && dataToProcess[selectedMonth.value.year]?.[selectedMonth.value.month]) {
      dataToProcess = {
        [selectedMonth.value.year]: {
          [selectedMonth.value.month]: dataToProcess[selectedMonth.value.year][selectedMonth.value.month],
        },
      };
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

  // Check if the current view is for a single month (for KPI cards)
  const isSingleMonthView = computed(() => sortedMonthlyData.value.length === 1);

  // Data for single month KPI cards
  const singleMonthKpis = computed(() => {
    if (!isSingleMonthView.value) return null;
    const data = sortedMonthlyData.value[0];
    return {
      label: data.label,
      mrr: data.mrr,
      nrrPercent: data.nrrPercent,
      grrPercent: data.grrPercent,
      churnRatePercent: data.churnRatePercent,
      actualProfit: data.actualProfit,
      targetProfit: data.targetProfit,
      newClientsTotal: data.newClientsOrganic + data.newClientsBusinessPartner,
      expansion: data.expansion,
      churnAmount: data.churnAmount,
      contraction: data.contraction,
      newClientsOrganic: data.newClientsOrganic,
      newClientsBusinessPartner: data.newClientsBusinessPartner,
    };
  });

  return {
    saasMetricsData,
    selectedYear,
    selectedMonth,
    fetchAndConnect,
    availableYears,
    availableMonths,
    sortedMonthlyData,
    isSingleMonthView,
    singleMonthKpis,
  };
});
