import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import apiClient from '../services/api';
import { socket } from '../services/socket';
import type { SaaSMetricsData } from '../types/report';

export interface OnlineUser {
  id: string;
  ip: string;
  browser: string;
  os: string;
  device: string;
  connectedAt: string;
}

export const useSaasMetricsStore = defineStore('saasMetrics', () => {
  const saasMetricsData = ref<SaaSMetricsData | null>(null);

  const onlineUsers = ref<OnlineUser[]>([]);
  const onlineUsersCount = ref<number>(0);

  const selectedYearMonth = ref<{ year: string; month: string } | null>(null);

  // --- Actions ---
  async function fetchAndConnect() {
    socket.on('update:saas-metrics', (newData: SaaSMetricsData) => {
      console.log('[Synced] Real-time SaaS Metrics updated via WebSocket');
      saasMetricsData.value = newData;
    });

    socket.on('update:online-users', (data: { count: number; users: OnlineUser[] }) => {
      console.log('[Synced] Online Users updated:', data);
      onlineUsersCount.value = data.count;
      onlineUsers.value = data.users;
    });

    if (saasMetricsData.value) return;

    try {
      const response = await apiClient.get('/reports');
      saasMetricsData.value = response.data;

      if (saasMetricsData.value) {
        const now = new Date();
        const currentYearStr = now.getFullYear().toString();
        const currentMonthStr = (now.getMonth() + 1).toString().padStart(2, '0');

        // Initialize selectedYearMonth
        if (saasMetricsData.value[currentYearStr]?.[currentMonthStr]) {
          selectedYearMonth.value = { year: currentYearStr, month: currentMonthStr };
        } else {
          // Fallback to latest available data
          const years = Object.keys(saasMetricsData.value).sort((a, b) => parseInt(b) - parseInt(a));
          const latestYear = years[0];
          if (latestYear) {
            const months = Object.keys(saasMetricsData.value[latestYear]).sort((a, b) => parseInt(b) - parseInt(a));
            const latestMonth = months[0] || '01';
            selectedYearMonth.value = { year: latestYear, month: latestMonth };
          }
        }
      }
    } catch (err) {
      console.error('Failed to load initial SaaS metrics data', err);
    }
  }

  // --- Getters ---
  const allAvailableYears = computed(() => {
    if (!saasMetricsData.value) return [];
    return Object.keys(saasMetricsData.value).sort((a, b) => parseInt(a) - parseInt(b));
  });

  const annualChartData = computed(() => {
    if (!saasMetricsData.value) return [];

    let dataToProcess: SaaSMetricsData = saasMetricsData.value;
    // Use the year from selectedYearMonth
    let year = null;
    if (selectedYearMonth.value) {
      year = selectedYearMonth.value.year;
      if (year && dataToProcess[year]) {
        dataToProcess = { [year]: dataToProcess[year] };
      }
    }

    return Object.entries(dataToProcess)
      .flatMap(([y, months]) =>
        Object.entries(months).map(([m, data]) => ({
          ...data,
          year: y,
          month: m,
          label: `${new Date(Date.parse(m + ' 1, 2012')).toLocaleString('default', { month: 'short' })}-${y.slice(2)}`,
        })),
      )
      .sort((a, b) => new Date(`${a.year}-${a.month}-01`).getTime() - new Date(`${b.year}-${b.month}-01`).getTime());
  });

  const hotelWaterfallData = computed(() => {
    if (!saasMetricsData.value || !selectedYearMonth.value) return null;

    const currentYear = selectedYearMonth.value.year;
    const prevYear = (parseInt(currentYear) - 1).toString();

    let startingBalance = 0;
    if (saasMetricsData.value[prevYear] && saasMetricsData.value[prevYear]['12']) {
      startingBalance = saasMetricsData.value[prevYear]['12'].hotelActual;
    }

    const months = saasMetricsData.value[currentYear];
    if (!months) return null;

    const sortedMonths = Object.keys(months).sort((a, b) => parseInt(a) - parseInt(b));

    const labels = [`Start (${prevYear})`];
    const newData = [0];
    const dropData = [0];
    const balanceData = [startingBalance];

    let currentBalance = startingBalance;

    for (const month of sortedMonths) {
      const data = months[month];
      const newClients = data.clientNewOrganicCount + data.clientNewPartnerCount;
      const dropOut = data.clientChurnCount;

      labels.push(`${new Date(Date.parse(month + ' 1, 2012')).toLocaleString('default', { month: 'short' })}`);
      newData.push(newClients);
      dropData.push(-dropOut);

      currentBalance += newClients - dropOut;
      balanceData.push(currentBalance);
    }

    labels.push(`End (${currentYear})`);
    newData.push(0);
    dropData.push(0);
    balanceData.push(currentBalance);

    return {
      labels,
      newData,
      dropData,
      balanceData,
      startingBalance,
    };
  });

  const annualComparison = computed(() => {
    if (!saasMetricsData.value || !selectedYearMonth.value) return null;

    const currentYear = selectedYearMonth.value.year;
    const prevYear = (parseInt(currentYear) - 1).toString();

    const calculateYearlyTotals = (year: string) => {
      const months = saasMetricsData.value![year];
      if (!months) return null;

      const totals = {
        revenueActual: 0,
        totalProfit: 0,
        newClients: 0,
        avgMrr: 0,
        monthCount: 0,
      };

      Object.values(months).forEach((m) => {
        totals.revenueActual += m.revenueActual;
        totals.totalProfit += m.cmpayProfitActual;
        totals.newClients += m.clientNewOrganicCount + m.clientNewPartnerCount;
        totals.avgMrr += m.mrr;
        totals.monthCount++;
      });

      if (totals.monthCount > 0) totals.avgMrr /= totals.monthCount;
      return totals;
    };

    const currentTotals = calculateYearlyTotals(currentYear);
    const prevTotals = calculateYearlyTotals(prevYear);

    if (!currentTotals) return null;

    const calculateGrowth = (current: number, prev: number | undefined) => {
      if (!prev || prev === 0) return null;
      return ((current - prev) / prev) * 100;
    };

    return {
      currentYear,
      prevYear,
      metrics: {
        revenue: {
          current: currentTotals.revenueActual,
          prev: prevTotals?.revenueActual,
          growth: calculateGrowth(currentTotals.revenueActual, prevTotals?.revenueActual),
        },
        profit: {
          current: currentTotals.totalProfit,
          prev: prevTotals?.totalProfit,
          growth: calculateGrowth(currentTotals.totalProfit, prevTotals?.totalProfit),
        },
        newClients: {
          current: currentTotals.newClients,
          prev: prevTotals?.newClients,
          growth: calculateGrowth(currentTotals.newClients, prevTotals?.newClients),
        },
        mrr: {
          current: currentTotals.avgMrr,
          prev: prevTotals?.avgMrr,
          growth: calculateGrowth(currentTotals.avgMrr, prevTotals?.avgMrr),
        },
      },
    };
  });

  const monthlyDeepDiveData = computed(() => {
    if (!saasMetricsData.value || !selectedYearMonth.value) return [];

    const { year, month } = selectedYearMonth.value;
    const dataToProcess = saasMetricsData.value;

    if (dataToProcess[year]?.[month]) {
      return Object.entries({
        [year]: {
          [month]: dataToProcess[year][month],
        },
      })
        .flatMap(([y, months]) =>
          Object.entries(months).map(([m, data]) => ({
            ...data,
            year: y,
            month: m,
            label: `${new Date(Date.parse(m + ' 1, 2012')).toLocaleString('default', { month: 'short' })}-${y.slice(2)}`,
          })),
        );
    }
    return [];
  });

  const monthlyDeepDiveKpis = computed(() => {
    if (!monthlyDeepDiveData.value || monthlyDeepDiveData.value.length === 0) return null;
    const data = monthlyDeepDiveData.value[0];
    return {
      label: data.label,
      mrr: data.mrr,
      expansionAmount: data.expansionAmount,
      churnAmount: data.churnAmount,
      contractionAmount: data.contractionAmount,
      nrrPercent: data.nrrPercent,
      grrPercent: data.grrPercent,
      churnRatePercent: data.churnRatePercent,
      clientNewOrganicCount: data.clientNewOrganicCount,
      clientNewPartnerCount: data.clientNewPartnerCount,
      totalNewClients: data.clientNewOrganicCount + data.clientNewPartnerCount,
      clientChurnCount: data.clientChurnCount,
      clientFreeTrialCount: data.clientFreeTrialCount,
      clientPendingSetupCount: data.clientPendingSetupCount,
      hotelActual: data.hotelActual,
      hotelTarget: data.hotelTarget,
      salesRepCount: data.salesRepCount,
      revenueTarget: data.revenueTarget,
      revenueActual: data.revenueActual,
      cmpayChargeTarget: data.cmpayChargeTarget,
      cmpayChargeActual: data.cmpayChargeActual,
      cmpayProfitTarget: data.cmpayProfitTarget,
      cmpayProfitActual: data.cmpayProfitActual,
      cmpayActiveUserCount: data.cmpayActiveUserCount,
    };
  });

  const monthlyAvailableMonths = computed(() => {
    if (!saasMetricsData.value || !selectedYearMonth.value?.year) return [];
    const months = saasMetricsData.value[selectedYearMonth.value.year];
    if (!months) return [];
    return Object.keys(months).sort((a, b) => parseInt(a) - parseInt(b));
  });

  return {
    saasMetricsData,
    onlineUsers,
    onlineUsersCount,
    selectedYearMonth,
    fetchAndConnect,
    allAvailableYears,
    annualChartData,
    annualComparison,
    hotelWaterfallData,
    monthlyDeepDiveData,
    monthlyDeepDiveKpis,
    monthlyAvailableMonths,
  };
});
