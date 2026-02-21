import { defineStore } from 'pinia';
import { ref, computed, markRaw } from 'vue';
import { toast } from 'vue-sonner';
import apiClient from '../services/api';
import { socket } from '../services/socket';
import type { ReportMetricsData, DashboardData, DistributionItem } from '../types/report';
import ToastNotification from '../components/ToastNotification.vue';

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
    socket.on('notification:sheet-update', (payload: any) => {
      console.log('[Socket] Sheet Update Received:', payload);
      const generateToastId = (prefix: string) => `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2)}`;
      const cleanText = (val: any) => String(val || '').replace(/[\u0000-\u001F]/g, '').trim();

      if (payload.event === 'auto_edit') {
        const { userEmail, sheetName, changes } = payload;
        if (!changes) return;

        const toastId = generateToastId('edit');
        const details = [
          { label: 'Range', value: cleanText(changes.range), highlight: false },
        ];

        if (!changes.isMultiCell && changes.newValue !== undefined) {
          details.push({
            label: 'Value',
            value: `${cleanText(changes.oldValue) || '-'} ➝ ${cleanText(changes.newValue)}`,
            highlight: true, // ให้ไฮไลท์สีฟ้า
          });
        } else {
          details.push({ label: 'Action', value: 'Multiple cells updated', highlight: false });
        }

        toast.custom(markRaw(ToastNotification), {
          id: toastId,
          componentProps: {
            toastId: toastId,
            type: 'info',
            title: 'Data Updated',
            user: cleanText(userEmail),
            sheet: cleanText(sheetName),
            details: details,
          },
          duration: 5000,
        });
      } else if (payload.event === 'structure_change') {
        const { userEmail, sheetName, changeType } = payload;
        const toastId = generateToastId('struct');

        toast.custom(markRaw(ToastNotification), {
          id: toastId,
          componentProps: {
            toastId: toastId,
            type: 'warning',
            title: 'Structure Changed',
            user: cleanText(userEmail),
            sheet: cleanText(sheetName),
            details: [
              { label: 'Action', value: cleanText(changeType), highlight: true },
            ],
          },
          duration: 5000,
        });
      } else if (payload.event === 'manual_full_sync') {
        const toastId = generateToastId('sync');

        toast.custom(markRaw(ToastNotification), {
          id: toastId,
          componentProps: {
            toastId: toastId,
            type: 'success',
            title: 'Sync Started',
            user: cleanText(payload.triggeredBy),
            sheet: 'All Sheets',
            details: [
              { label: 'Status', value: 'Full Sync Request', highlight: true },
            ],
          },
          duration: 5000,
        });
      }
    });

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
  const hasBreakdownData = computed(() => {
    const data = reportBreakdownData.value;

    // null/undefined
    if (!data) return false;

    // empty Object ({})
    if (Object.keys(data).length === 0) return false;

    // valid redis key packageDistribution (Optional)
    const requiredKeys = ['packageDistribution', 'paymentConditionDistribution', 'revenueModelDistribution', 'salesChannelDistribution', 'closedDealDistribution'];
    const hasContent = requiredKeys.some(key => {
      const subData = (data as any)[key];
      return subData && Object.keys(subData).length > 0;
    });

    return hasContent;
  });

  const hasMapData = computed(() => {
    const data = reportBreakdownData.value;
    if (!data) return false;

    const hasThai = data.thailandProvinceDistribution && Object.keys(data.thailandProvinceDistribution).length > 0;
    const hasInter = data.internationalCountryDistribution && Object.keys(data.internationalCountryDistribution).length > 0;

    return hasThai || hasInter;
  });

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

    const selectedYear = selectedYearMonth.value.year;
    const prevYear = (parseInt(selectedYear) - 1).toString();

    // Noe --> Month Range
    const now = new Date();
    const currentActualYear = now.getFullYear().toString();

    // Determine the last month to include in the calculation
    let limitMonthForSelectedYear = 12; // Default คือทั้งปี

    if (selectedYear === currentActualYear) {
      // ถ้าเป็นปีปัจจุบัน (2026) และวันนี้คือ Feb (2)
      // limitMonth จะกลายเป็น 1 (Jan)
      limitMonthForSelectedYear = now.getMonth();

      // Safety check: หากเป็นเดือน Jan ให้คิด Jan ไปก่อนเพื่อไม่ให้ยอดเป็น 0
      if (limitMonthForSelectedYear === 0) limitMonthForSelectedYear = 1;
    }

    const calculateYearlyTotals = (year: string, limitMonth: number) => {
      const monthsData = reportMetricsData.value![year];
      if (!monthsData) return null;

      const totals = {
        revenueActual: 0,
        revenueTarget: 0,
        cmpayProfitActual: 0,
        cmpayProfitTarget: 0,
        cmpayChargeActual: 0,
        cmpayChargeTarget: 0,
        hotelgruCommissionActual: 0,
        hotelgruCommissionTarget: 0,
        newClients: 0,
        clientChurnCount: 0,
        hotelActual: 0,
        mrrTotal: 0,
        churnAmount: 0,
        cmpayActiveUserCount: 0,
        monthCount: 0,
      };

      for (let m = 1; m <= limitMonth; m++) {
        const monthKey = m.toString().padStart(2, '0');
        const data = monthsData[monthKey];
        if (data) {
          totals.revenueActual += data.revenueActual;
          totals.revenueTarget += data.revenueTarget;
          totals.cmpayProfitActual += data.cmpayProfitActual;
          totals.cmpayProfitTarget += data.cmpayProfitTarget;
          totals.cmpayChargeActual += data.cmpayChargeActual;
          totals.cmpayChargeTarget += data.cmpayChargeTarget;
          totals.hotelgruCommissionActual += data.hotelgruCommissionActual;
          totals.hotelgruCommissionTarget += data.hotelgruCommissionTarget;
          totals.newClients += data.clientNewOrganicCount + data.clientNewPartnerCount;
          totals.clientChurnCount += data.clientChurnCount;
          totals.hotelActual += data.hotelActual;
          totals.mrrTotal += data.mrr;
          totals.churnAmount += data.churnAmount;
          totals.cmpayActiveUserCount += data.cmpayActiveUserCount;
          totals.monthCount++;
        }
      }

      if (totals.monthCount === 0) return null;

      // คำนวณค่าเฉลี่ยตามจำนวนเดือนที่มีข้อมูลจริง
      return {
        ...totals,
        avgMrr: totals.mrrTotal / totals.monthCount,
        avgHotelActual: totals.hotelActual / totals.monthCount,
        avgCmpayActiveUserCount: totals.cmpayActiveUserCount / totals.monthCount,
      };
    };

    const currentTotals = calculateYearlyTotals(selectedYear, limitMonthForSelectedYear);
    const prevTotals = calculateYearlyTotals(prevYear, 12);

    if (!currentTotals) return null;

    const calculateGrowth = (current: number, prev: number | undefined) => {
      if (!prev || prev === 0) return null;
      return ((current - prev) / prev) * 100;
    };

    return {
      currentYear: selectedYear,
      prevYear,
      isPartialYear: limitMonthForSelectedYear < 12,
      lastCalculatedMonth: limitMonthForSelectedYear,
      metrics: {
        revenue: {
          label: 'Total Revenue',
          current: currentTotals.revenueActual,
          prev: prevTotals?.revenueActual,
          growth: calculateGrowth(currentTotals.revenueActual, prevTotals?.revenueActual),
        },
        revenueTarget: {
          label: 'Total Revenue Target',
          current: currentTotals.revenueTarget,
          prev: prevTotals?.revenueTarget,
          growth: calculateGrowth(currentTotals.revenueTarget, prevTotals?.revenueTarget),
        },
        mrr: {
          label: 'Avg. MRR',
          current: currentTotals.avgMrr,
          prev: prevTotals?.avgMrr,
          growth: calculateGrowth(currentTotals.avgMrr, prevTotals?.avgMrr),
        },
        churnAmount: {
          label: 'Churn Revenue',
          current: currentTotals.churnAmount,
          prev: prevTotals?.churnAmount,
          growth: calculateGrowth(currentTotals.churnAmount, prevTotals?.churnAmount),
        },
        cmpayChargeActual: {
          label: 'CM Pay Charge',
          current: currentTotals.cmpayChargeActual,
          prev: prevTotals?.cmpayChargeActual,
          growth: calculateGrowth(currentTotals.cmpayChargeActual, prevTotals?.cmpayChargeActual),
        },
        cmpayChargeTarget: {
          label: 'CM Pay Charge Target',
          current: currentTotals.cmpayChargeTarget,
          prev: prevTotals?.cmpayChargeTarget,
          growth: calculateGrowth(currentTotals.cmpayChargeTarget, prevTotals?.cmpayChargeTarget),
        },
        cmpayProfitActual: {
          label: 'CM Pay Profit',
          current: currentTotals.cmpayProfitActual,
          prev: prevTotals?.cmpayProfitActual,
          growth: calculateGrowth(currentTotals.cmpayProfitActual, prevTotals?.cmpayProfitActual),
        },
        cmpayProfitTarget: {
          label: 'CM Pay Profit Target',
          current: currentTotals.cmpayProfitTarget,
          prev: prevTotals?.cmpayProfitTarget,
          growth: calculateGrowth(currentTotals.cmpayProfitTarget, prevTotals?.cmpayProfitTarget),
        },
        hotelgruCommissionActual: {
          label: 'HotelGru Commission',
          current: currentTotals.hotelgruCommissionActual,
          prev: prevTotals?.hotelgruCommissionActual,
          growth: calculateGrowth(currentTotals.hotelgruCommissionActual, prevTotals?.hotelgruCommissionActual),
        },
        hotelgruCommissionTarget: {
          label: 'HotelGru Commission Target',
          current: currentTotals.hotelgruCommissionTarget,
          prev: prevTotals?.hotelgruCommissionTarget,
          growth: calculateGrowth(currentTotals.hotelgruCommissionTarget, prevTotals?.hotelgruCommissionTarget),
        },
        newClients: {
          label: 'Total New Customers',
          current: currentTotals.newClients,
          prev: prevTotals?.newClients,
          growth: calculateGrowth(currentTotals.newClients, prevTotals?.newClients),
        },
        clientChurnCount: {
          label: 'Total Drop Out',
          current: currentTotals.clientChurnCount,
          prev: prevTotals?.clientChurnCount,
          growth: calculateGrowth(currentTotals.clientChurnCount, prevTotals?.clientChurnCount),
        },
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
      cmpayAllUserCount: data.cmpayAllUserCount,
      cmpayActiveUserCount: data.cmpayActiveUserCount,
      hotelgruCommissionTarget: data.hotelgruCommissionTarget,
      hotelgruCommissionActual: data.hotelgruCommissionActual,
      hotelgruHotelActual: data.hotelgruHotelActual,
      hotelgruHotelChurnCount: data.hotelgruHotelChurnCount,
      partnerHotelTarget: data.partnerHotelTarget,
      partnerHotelActual: data.partnerHotelActual,
      partnerRevenueTarget: data.partnerRevenueTarget,
      partnerRevenueActual: data.partnerRevenueActual,
    };
  });

  const monthlyMoMComparison = computed(() => {
    if (!reportMetricsData.value || !selectedYearMonth.value) return null;

    const { year, month } = selectedYearMonth.value;
    const currentData = reportMetricsData.value[year]?.[month];
    if (!currentData) return null;

    // Helper Month formatter
    const formatMonthYear = (m: string, y: string) => {
      const date = new Date(parseInt(y), parseInt(m) - 1);
      const monthStr = date.toLocaleString('default', { month: 'short' });
      return `${monthStr} ${y}`;
    };

    // Previous Month/Year
    let prevYearNum = parseInt(year);
    let prevMonthNum = parseInt(month) - 1;
    if (prevMonthNum === 0) {
      prevMonthNum = 12;
      prevYearNum -= 1;
    }
    const prevYearStr = prevYearNum.toString();
    const prevMonthStr = prevMonthNum.toString().padStart(2, '0');
    const prevData = reportMetricsData.value[prevYearStr]?.[prevMonthStr];

    // Helper % Growth
    const calculateGrowth = (current: number, prev: number | undefined) => {
      if (prev === undefined || prev === 0) return null;
      return ((current - prev) / prev) * 100;
    };

    // Context
    const monthYearContext = {
      current: formatMonthYear(month, year),
      prev: prevData ? formatMonthYear(prevMonthStr, prevYearStr) : null,
    };

    return {
      monthYear: monthYearContext,
      metrics: {
        hotelActual: {
          current: currentData.hotelActual,
          prev: prevData?.hotelActual ?? null,
          growth: calculateGrowth(currentData.hotelActual, prevData?.hotelActual),
        },
        totalNewClients: {
          current: currentData.clientNewOrganicCount + currentData.clientNewPartnerCount,
          prev: prevData ? (prevData.clientNewOrganicCount + prevData.clientNewPartnerCount) : null,
          growth: calculateGrowth(
            currentData.clientNewOrganicCount + currentData.clientNewPartnerCount,
            prevData ? (prevData.clientNewOrganicCount + prevData.clientNewPartnerCount) : undefined,
          ),
        },
        clientChurnCount: {
          current: currentData.clientChurnCount,
          prev: prevData?.clientChurnCount ?? null,
          growth: calculateGrowth(currentData.clientChurnCount, prevData?.clientChurnCount),
        },
        hotelgruHotelActual: {
          current: currentData.hotelgruHotelActual,
          prev: prevData?.hotelgruHotelActual ?? null,
          growth: calculateGrowth(currentData.hotelgruHotelActual, prevData?.hotelgruHotelActual),
        },
        hotelgruCommissionActual: {
          current: currentData.hotelgruCommissionActual,
          prev: prevData?.hotelgruCommissionActual ?? null,
          growth: calculateGrowth(currentData.hotelgruCommissionActual, prevData?.hotelgruCommissionActual),
        },
        cmpayActiveUserCount: {
          current: currentData.cmpayActiveUserCount,
          prev: prevData?.cmpayActiveUserCount ?? null,
          growth: calculateGrowth(currentData.cmpayActiveUserCount, prevData?.cmpayActiveUserCount),
        },
        cmpayChargeActual: {
          current: currentData.cmpayChargeActual,
          prev: prevData?.cmpayChargeActual ?? null,
          growth: calculateGrowth(currentData.cmpayChargeActual, prevData?.cmpayChargeActual),
        },
        cmpayProfitActual: {
          current: currentData.cmpayProfitActual,
          prev: prevData?.cmpayProfitActual ?? null,
          growth: calculateGrowth(currentData.cmpayProfitActual, prevData?.cmpayProfitActual),
        },
        partnerHotelActual: {
          current: currentData.partnerHotelActual,
          prev: prevData?.partnerHotelActual ?? null,
          growth: calculateGrowth(currentData.partnerHotelActual, prevData?.partnerHotelActual),
        },
        partnerRevenueActual: {
          current: currentData.partnerRevenueActual,
          prev: prevData?.partnerRevenueActual ?? null,
          growth: calculateGrowth(currentData.partnerRevenueActual, prevData?.partnerRevenueActual),
        },
      },
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
    hasBreakdownData,
    hasMapData,
    allAvailableYears,
    annualChartData,
    annualComparison,
    monthlyDeepDiveData,
    monthlyDeepDiveKpis,
    monthlyMoMComparison,
  };
});
