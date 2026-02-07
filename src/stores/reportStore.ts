import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import apiClient from '../services/api';
import { socket } from '../services/socket';
import type { ReportMetricsData, DashboardData } from '../types/report';

export interface OnlineUser {
  id: string;
  ip: string;
  browser: string;
  os: string;
  device: string;
  connectedAt: string;
}

export const useReportStore = defineStore('report', () => {
  const dashboardData = ref<DashboardData | null>(null);
  const reportMetricsData = computed(() => dashboardData.value?.metrics ?? null);
  const reportBreakdownData = computed(() => dashboardData.value?.breakdown ?? null);

  const onlineUsers = ref<OnlineUser[]>([]);
  const onlineUsersCount = ref<number>(0);

  const selectedYearMonth = ref<{ year: string; month: string } | null>(null);

  // --- Actions ---
  async function fetchAndConnect() {
    socket.on('update:saas-metrics', (newData: DashboardData) => {
      console.log('[Synced] Real-time Report updated via WebSocket');
      dashboardData.value = newData;
    });

    socket.on('update:online-users', (data: { count: number; users: OnlineUser[] }) => {
      console.log('[Synced] Online Users updated:', data);
      onlineUsersCount.value = data.count;
      onlineUsers.value = data.users;
    });

    if (reportMetricsData.value) return;

    try {
      const response = await apiClient.get('/reports');
      dashboardData.value = response.data;

      if (reportMetricsData.value) {
        const now = new Date();
        const currentYearStr = now.getFullYear().toString();
        const currentMonthStr = (now.getMonth() + 1).toString().padStart(2, '0');

        // Initialize selectedYearMonth
        if (reportMetricsData.value[currentYearStr]?.[currentMonthStr]) {
          selectedYearMonth.value = { year: currentYearStr, month: currentMonthStr };
        } else {
          // Fallback to latest available data
          const years = Object.keys(reportMetricsData.value).sort((a, b) => parseInt(b) - parseInt(a));
          const latestYear = years[0];
          if (latestYear) {
            const months = Object.keys(reportMetricsData.value[latestYear]).sort((a, b) => parseInt(b) - parseInt(a));
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
    if (!reportMetricsData.value) return [];
    return Object.keys(reportMetricsData.value).sort((a, b) => parseInt(a) - parseInt(b));
  });

  const annualChartData = computed(() => {
    if (!reportMetricsData.value) return [];

    let dataToProcess: ReportMetricsData = reportMetricsData.value;
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

  const annualComparison = computed(() => {
    if (!reportMetricsData.value || !selectedYearMonth.value) return null;

    const currentYear = selectedYearMonth.value.year;
    const prevYear = (parseInt(currentYear) - 1).toString();

    const calculateYearlyTotals = (year: string) => {
      const months = reportMetricsData.value![year];
      if (!months) return null;

      const totals = {
        revenueActual: 0,
        cmpayProfitActual: 0,
        cmpayChargeActual: 0,
        hotelgruCommissionActual: 0,
        newClients: 0,
        clientChurnCount: 0,
        hotelActual: 0,
        avgMrr: 0,
        churnAmount: 0,
        cmpayActiveUserCount: 0,
        monthCount: 0,
      };

      Object.values(months).forEach((m) => {
        totals.revenueActual += m.revenueActual;
        totals.cmpayProfitActual += m.cmpayProfitActual;
        totals.cmpayChargeActual += m.cmpayChargeActual;
        totals.hotelgruCommissionActual += m.hotelgruCommissionActual;
        totals.newClients += m.clientNewOrganicCount + m.clientNewPartnerCount;
        totals.clientChurnCount += m.clientChurnCount;
        totals.hotelActual += m.hotelActual;
        totals.avgMrr += m.mrr;
        totals.churnAmount += m.churnAmount;
        totals.cmpayActiveUserCount += m.cmpayActiveUserCount;
        totals.monthCount++;
      });

      if (totals.monthCount > 0) {
        totals.avgMrr /= totals.monthCount;
        totals.hotelActual /= totals.monthCount; // Average Active Hotels
        totals.cmpayActiveUserCount /= totals.monthCount; // Average Active Users
      }
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
          label: 'revenue',
          current: currentTotals.revenueActual,
          prev: prevTotals?.revenueActual,
          growth: calculateGrowth(currentTotals.revenueActual, prevTotals?.revenueActual),
        },
        mrr: {
          label: 'avg. mrr',
          current: currentTotals.avgMrr,
          prev: prevTotals?.avgMrr,
          growth: calculateGrowth(currentTotals.avgMrr, prevTotals?.avgMrr),
        },
        churnAmount: {
          label: 'churn revenue',
          current: currentTotals.churnAmount,
          prev: prevTotals?.churnAmount,
          growth: calculateGrowth(currentTotals.churnAmount, prevTotals?.churnAmount),
        },
        cmpayChargeActual: {
          label: 'cm pay charge',
          current: currentTotals.cmpayChargeActual,
          prev: prevTotals?.cmpayChargeActual,
          growth: calculateGrowth(currentTotals.cmpayChargeActual, prevTotals?.cmpayChargeActual),
        },
        cmpayProfitActual: {
          label: 'cm pay profit',
          current: currentTotals.cmpayProfitActual,
          prev: prevTotals?.cmpayProfitActual,
          growth: calculateGrowth(currentTotals.cmpayProfitActual, prevTotals?.cmpayProfitActual),
        },
        // cmpayActiveUserCount: {
        //   label: 'avg. cmpay users',
        //   current: currentTotals.cmpayActiveUserCount,
        //   prev: prevTotals?.cmpayActiveUserCount,
        //   growth: calculateGrowth(currentTotals.cmpayActiveUserCount, prevTotals?.cmpayActiveUserCount),
        // },
        hotelgruCommissionActual: {
          label: 'hotel gru commission',
          current: currentTotals.hotelgruCommissionActual,
          prev: prevTotals?.hotelgruCommissionActual,
          growth: calculateGrowth(currentTotals.hotelgruCommissionActual, prevTotals?.hotelgruCommissionActual),
        },
        newClients: {
          label: 'new clients',
          current: currentTotals.newClients,
          prev: prevTotals?.newClients,
          growth: calculateGrowth(currentTotals.newClients, prevTotals?.newClients),
        },
        clientChurnCount: {
          label: 'total drop out',
          current: currentTotals.clientChurnCount,
          prev: prevTotals?.clientChurnCount,
          growth: calculateGrowth(currentTotals.clientChurnCount, prevTotals?.clientChurnCount),
        },
        // hotelActual: {
        //   label: 'avg. active hotels',
        //   current: currentTotals.hotelActual,
        //   prev: prevTotals?.hotelActual,
        //   growth: calculateGrowth(currentTotals.hotelActual, prevTotals?.hotelActual),
        // },
      },
    };
  });

  const monthlyDeepDiveData = computed(() => {
    if (!reportMetricsData.value || !selectedYearMonth.value) return [];

    const { year, month } = selectedYearMonth.value;
    const dataToProcess = reportMetricsData.value;

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
      hotelgruCommissionTarget: data.hotelgruCommissionTarget,
      hotelgruCommissionActual: data.hotelgruCommissionActual,
      hotelgruHotelCount: data.hotelgruHotelCount,
    };
  });

  return {
    dashboardData,
    reportMetricsData,
    reportBreakdownData,
    onlineUsers,
    onlineUsersCount,
    selectedYearMonth,
    fetchAndConnect,
    allAvailableYears,
    annualChartData,
    annualComparison,
    monthlyDeepDiveData,
    monthlyDeepDiveKpis,
  };
});
