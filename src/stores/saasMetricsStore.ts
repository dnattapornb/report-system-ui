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
      return;
    }

    try {
      const response = await apiClient.get('/reports');
      saasMetricsData.value = response.data;

      if (saasMetricsData.value) {
        const now = new Date();
        const currentYearStr = now.getFullYear().toString();
        const currentMonthStr = (now.getMonth() + 1).toString().padStart(2, '0');

        if (saasMetricsData.value[currentYearStr]) {
          annualSelectedYear.value = currentYearStr;
        } else {
          // Fallback to latest available year
          const years = Object.keys(saasMetricsData.value).sort((a, b) => parseInt(b) - parseInt(a));
          annualSelectedYear.value = years[0] || null;
        }

        if (saasMetricsData.value[currentYearStr]?.[currentMonthStr]) {
          monthlySelectedMonth.value = {
            year: currentYearStr,
            month: currentMonthStr,
          };
        } else {
          // Fallback to latest available month of the selected annual year
          const yearToUse = annualSelectedYear.value;
          if (yearToUse && saasMetricsData.value[yearToUse]) {
            const months = Object.keys(saasMetricsData.value[yearToUse]).sort((a, b) => parseInt(b) - parseInt(a));
            monthlySelectedMonth.value = {
              year: yearToUse,
              month: months[0] || '01',
            };
          }
        }

        console.log('Initialized Filters:', {
          annual: annualSelectedYear.value,
          monthly: monthlySelectedMonth.value
        });
      }
    } catch (err) {
      console.error('Failed to load initial SaaS metrics data', err);
    }

    socket.on('update:saas-metrics', (newData: SaaSMetricsData) => {
      saasMetricsData.value = newData;
      if (annualSelectedYear.value && !saasMetricsData.value[annualSelectedYear.value]) {
        annualSelectedYear.value = null;
      }
    });
  }

  // --- Getters ---
  const allAvailableYears = computed(() => {
    if (!saasMetricsData.value) return [];
    return Object.keys(saasMetricsData.value).sort((a, b) => parseInt(a) - parseInt(b));
  });

  const annualChartData = computed(() => {
    if (!saasMetricsData.value) return [];
    let dataToProcess: SaaSMetricsData = saasMetricsData.value;
    if (annualSelectedYear.value && dataToProcess[annualSelectedYear.value]) {
      dataToProcess = { [annualSelectedYear.value]: dataToProcess[annualSelectedYear.value] };
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
    if (monthlySelectedMonth.value && dataToProcess[monthlySelectedMonth.value.year]?.[monthlySelectedMonth.value.month]) {
      dataToProcess = {
        [monthlySelectedMonth.value.year]: {
          [monthlySelectedMonth.value.month]: dataToProcess[monthlySelectedMonth.value.year][monthlySelectedMonth.value.month],
        },
      };
    } else {
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

  const monthlyAvailableMonths = computed(() => {
    if (!saasMetricsData.value || !monthlySelectedMonth.value?.year) return [];
    const months = saasMetricsData.value[monthlySelectedMonth.value.year];
    if (!months) return [];
    return Object.keys(months).sort((a, b) => parseInt(a) - parseInt(b));
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
    monthlyAvailableMonths,
  };
});
