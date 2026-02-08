<script setup lang="ts">
import { computed } from 'vue';
import { useReportStore } from '../stores/reportStore';
import { VueDatePicker } from '@vuepic/vue-datepicker';
import { formatCurrency, formatNumber } from '../utils/formatters';
import { useBreakpoints } from '@vueuse/core';
import '@vuepic/vue-datepicker/dist/main.css';

// Import Chart Components
import BusinessHealthTrendChart from './charts/BusinessHealthTrendChart.vue';
import RevenueComparisonChart from './charts/RevenueComparisonChart.vue';
import MRRMovementChart from './charts/MRRMovementChart.vue';
import AcquisitionMixChart from './charts/AcquisitionMixChart.vue';
import TargetAchievementChart from './charts/TargetAchievementChart.vue';
import SalesEfficiencyChart from './charts/SalesEfficiencyChart.vue';
import PipelineHealthChart from './charts/PipelineHealthChart.vue';
import HotelStatusPieChart from './charts/HotelStatusPieChart.vue';
import CMPayDashboard from './CMPayDashboard.vue';
import HotelGruDashboard from './HotelGruDashboard.vue';
import BreakdownPieChart from './charts/BreakdownPieChart.vue';
import OnlineUsersBadge from './OnlineUsersBadge.vue';
import ClientGrowthVsChurnChart from './charts/ClientGrowthVsChurnChart.vue';
import ThailandMapChart from './charts/ThailandMapChart.vue';

const store = useReportStore();

// Setup Breakpoints
const breakpoints = useBreakpoints({
  xl: 1920,
});
const isCompactView = breakpoints.smaller('xl'); // true if screen is < 1280px

const yearRange = computed((): [number, number] => {
  if (store.allAvailableYears.length === 0) return [2024, 2026];
  const firstYear = parseInt(store.allAvailableYears[0]!);
  const lastYear = parseInt(store.allAvailableYears[store.allAvailableYears.length - 1]!);
  if (isNaN(firstYear) || isNaN(lastYear)) return [2024, 2026];
  return [firstYear, lastYear];
});

const selectedYearMonthForPicker = computed({
  get: () => {
    if (store.selectedYearMonth) {
      return {
        year: parseInt(store.selectedYearMonth.year),
        month: parseInt(store.selectedYearMonth.month) - 1,
      };
    }
    return null;
  },
  set: (val: { year: number; month: number } | null) => {
    if (val && typeof val === 'object' && val.year && val.month !== undefined) {
      store.selectedYearMonth = {
        year: val.year.toString(),
        month: (val.month + 1).toString().padStart(2, '0'),
      };
    } else {
      store.selectedYearMonth = null;
    }
  },
});

// Function to format month picker display
const formatMonthPicker = (date: { month: number; year: number }) => {
  const monthName = new Date(date.year, date.month).toLocaleString('default', { month: 'long' });
  return `${monthName} ${date.year}`;
};

// --- Data for Charts and KPIs ---
const annualChartData = computed(() => store.annualChartData);
const annualComparison = computed(() => store.annualComparison);
const monthlyDeepDiveData = computed(() => store.monthlyDeepDiveData);
const monthlyDeepDiveKpis = computed(() => store.monthlyDeepDiveKpis);
const breakdownData = computed(() => store.reportBreakdownData);

// Helper to check if a metric key is a count (not currency)
const isCountMetric = (key: string | number) => {
  return ['newClients', 'clientChurnCount', 'hotelActual', 'cmpayActiveUserCount'].includes(String(key));
};
</script>

<template>
  <div class="min-h-screen bg-slate-100 font-sans min-w-screen">
    <div class="space-y-4">
      
      <!-- Global Header & Filter -->
      <div class="sticky top-0 z-50 shadow bg-white p-6 border border-slate-200 flex flex-col md:flex-row justify-between items-center gap-4">
        <div class="flex items-center gap-4">
          <h4 class="text-3xl font-black text-slate-800 tracking-tight uppercase">Sale Performance Dashboard</h4>
          <OnlineUsersBadge />
        </div>
        
        <div class="flex items-center gap-4">
          <span class="text-sm font-bold text-slate-500 uppercase tracking-wider">Select Period:</span>
          <div class="w-48">
            <VueDatePicker
              v-if="store.allAvailableYears.length > 0"
              v-model="selectedYearMonthForPicker"
              month-picker
              auto-apply
              placeholder="Select Month"
              :clearable="false"
              :format="formatMonthPicker"
              :year-range="yearRange"
            />
            <div v-else class="h-9 w-full bg-slate-200 rounded-lg animate-pulse"></div>
          </div>
        </div>
      </div>
      
      <!-- Loading State -->
      <div v-if="!store.reportMetricsData" class="text-center p-12 text-slate-500 text-lg">
        Loading SaaS Metrics Data...
      </div>
      <div v-else-if="store.allAvailableYears.length === 0" class="text-center p-12 text-slate-500 text-lg">
        No data available. Please sync from source.
      </div>
      
      <div v-else class="space-y-12">
        <!-- Sale Performance Section -->
        <section class="bg-white p-6 shadow-md border border-slate-200">
          <!-- Monthly Deep Dive Section -->
          <div v-if="monthlyDeepDiveData && monthlyDeepDiveKpis">
            <!-- Monthly Deep Dive Header Section -->
            <div class="mb-8 border-b border-slate-100 pb-4">
              <h2 class="text-1xl font-bold text-slate-800 text-left">Monthly Deep Dive</h2>
              <p class="text-sm text-slate-500 mt-1 text-left">
                Detailed analysis for <span class="font-bold text-blue-600">{{ formatMonthPicker({ month: parseInt(store.selectedYearMonth!.month) - 1, year: parseInt(store.selectedYearMonth!.year) }) }}</span>
              </p>
            </div>
            
            <!-- Monthly Deep Dive Cards -->
            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-6 mb-10">
              <div class="bg-white p-6 rounded-2xl shadow-xs border border-slate-100">
                <p class="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Live Hotels</p>
                <h4 class="text-2xl font-black text-emerald-600 mt-2">{{ formatNumber(monthlyDeepDiveKpis.hotelActual) }}</h4>
                <p class="text-[10px] text-slate-400 mt-1">Active in system</p>
              </div>
              <div class="bg-white p-6 rounded-2xl shadow-xs border border-slate-100">
                <p class="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">New Clients</p>
                <h4 class="text-2xl font-black text-violet-600 mt-2">
                  +{{ monthlyDeepDiveKpis.totalNewClients }}
                </h4>
                <p class="text-[10px] text-slate-400 mt-1">
                  {{ monthlyDeepDiveKpis.clientNewOrganicCount }} Organic & {{ monthlyDeepDiveKpis.clientNewPartnerCount }} Partner
                </p>
              </div>
              <div class="bg-white p-6 rounded-2xl shadow-xs border border-slate-100">
                <p class="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Drop Out</p>
                <h4 class="text-2xl font-black text-red-600 mt-2">
                  -{{ monthlyDeepDiveKpis.clientChurnCount }}
                </h4>
                <p class="text-[10px] text-slate-400 mt-1">Churn Rate {{ monthlyDeepDiveKpis.churnRatePercent }}%</p>
              </div>
              <div class="bg-white p-6 rounded-2xl shadow-xs border border-slate-100">
                <p class="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Pipeline Hotels</p>
                <h4 class="text-2xl font-black text-orange-500 mt-2">
                  {{ monthlyDeepDiveKpis.clientFreeTrialCount + monthlyDeepDiveKpis.clientPendingSetupCount }}
                </h4>
                <p class="text-[10px] text-slate-400 mt-1">
                  {{ monthlyDeepDiveKpis.clientFreeTrialCount }} Trial & {{ monthlyDeepDiveKpis.clientPendingSetupCount }} Pending
                </p>
              </div>
              <div class="bg-white p-6 rounded-2xl shadow-xs border border-slate-100">
                <p class="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Target Achievement</p>
                <h4 class="text-2xl font-black mt-2" :class="monthlyDeepDiveKpis.hotelActual >= monthlyDeepDiveKpis.hotelTarget ? 'text-emerald-600' : 'text-rose-500'">
                  {{ ((monthlyDeepDiveKpis.hotelActual / (monthlyDeepDiveKpis.hotelTarget || 1)) * 100).toFixed(1) }}%
                </h4>
                <p class="text-[10px] text-slate-400 mt-1">
                  {{ monthlyDeepDiveKpis.hotelActual }} / {{ monthlyDeepDiveKpis.hotelTarget }} Hotels
                </p>
              </div>
              <div class="bg-white p-6 rounded-2xl shadow-xs border border-slate-100">
                <p class="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Sales Force</p>
                <h4 class="text-2xl font-black text-indigo-600 mt-2">
                  {{ monthlyDeepDiveKpis.salesRepCount }} Reps
                </h4>
                <p class="text-[10px] text-slate-400 mt-1">
                  Avg. {{ (monthlyDeepDiveKpis.totalNewClients / (monthlyDeepDiveKpis.salesRepCount || 1)).toFixed(1) }} Sales/Rep
                </p>
              </div>
              <div class="bg-white p-6 rounded-2xl shadow-xs border border-slate-100">
                <p class="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Hotel Gru Active Hotels</p>
                <h4 class="text-2xl font-black text-sky-600 mt-2">{{ monthlyDeepDiveKpis.hotelgruHotelCount }}</h4>
                <p class="text-[10px] text-slate-400 mt-1">Active in system</p>
              </div>
              <div class="bg-white p-6 rounded-2xl shadow-xs border border-slate-100">
                <p class="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">CM Pay Active Users</p>
                <h4 class="text-2xl font-black text-blue-600 mt-2">{{ monthlyDeepDiveKpis.cmpayActiveUserCount }}</h4>
                <p class="text-[10px] text-slate-400 mt-1">Active in system</p>
              </div>
              <div class="bg-white p-6 rounded-2xl shadow-xs border border-slate-100">
                <p class="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Cm Pay Charge</p>
                <h4 class="text-2xl font-black text-violet-600 mt-2">{{ formatCurrency(monthlyDeepDiveKpis.cmpayChargeActual, isCompactView) }}</h4>
                <p class="text-[10px] text-slate-400 mt-1"></p>
              </div>
            </div>
            
            <!-- Monthly Deep Dive Charts -->
            <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-10">
              <!-- Monthly MRR Breakdown -->
              <section class="bg-white p-6 rounded-2xl shadow-xs border border-slate-100">
                <h3 class="text-lg font-bold text-slate-700 mb-6">Monthly Revenue Breakdown</h3>
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 text-center">
                  <div class="p-4 bg-slate-50 rounded-xl border border-slate-100 md:col-span-2">
                    <p class="text-xs text-slate-500 font-bold uppercase tracking-tighter">Revenue</p>
                    <p class="text-lg font-black text-emerald-600">{{ formatCurrency(monthlyDeepDiveKpis.revenueActual) }}</p>
                  </div>
                  <div class="p-4 bg-slate-50 rounded-xl border border-slate-100">
                    <p class="text-xs text-slate-500 font-bold uppercase tracking-tighter">MRR</p>
                    <p class="text-lg font-black text-blue-600">{{ formatCurrency(monthlyDeepDiveKpis.mrr) }}</p>
                  </div>
                  <div class="p-4 bg-slate-50 rounded-xl border border-slate-100">
                    <p class="text-xs text-slate-500 font-bold uppercase tracking-tighter">Expansion</p>
                    <p class="text-lg font-black text-emerald-600">{{ formatCurrency(monthlyDeepDiveKpis.expansionAmount) }}</p>
                  </div>
                  <div class="p-4 bg-slate-50 rounded-xl border border-slate-100">
                    <p class="text-xs text-slate-500 font-bold uppercase tracking-tighter">Contraction</p>
                    <p class="text-lg font-black text-orange-600">{{ formatCurrency(monthlyDeepDiveKpis.contractionAmount) }}</p>
                  </div>
                  <div class="p-4 bg-slate-50 rounded-xl border border-slate-100">
                    <p class="text-xs text-slate-500 font-bold uppercase tracking-tighter">Churn</p>
                    <p class="text-lg font-black text-rose-600">{{ formatCurrency(monthlyDeepDiveKpis.churnAmount) }}</p>
                  </div>
                </div>
              </section>
              
              <!-- Monthly Commission -->
              <section class="bg-white p-6 rounded-2xl shadow-xs border border-slate-100">
                <h3 class="text-lg font-bold text-slate-700 mb-6">Monthly Commission</h3>
                <div class="grid grid-cols-1 gap-4 text-center">
                  <div class="p-4 bg-slate-50 rounded-xl border border-blue-100">
                    <p class="text-xs text-slate-500 font-bold uppercase tracking-tighter">HotelGru Commission</p>
                    <p class="text-lg font-black text-blue-700">{{ formatCurrency(monthlyDeepDiveKpis.hotelgruCommissionActual) }}</p>
                  </div>
                  <div class="p-4 bg-slate-50 rounded-xl border border-sky-100">
                    <p class="text-xs text-slate-500 font-bold uppercase tracking-tighter">Cm Pay Profit</p>
                    <p class="text-lg font-black text-sky-600">{{ formatCurrency(monthlyDeepDiveKpis.cmpayProfitActual) }}</p>
                  </div>
                  <!--<div class="p-4 bg-slate-50 rounded-xl border border-slate-100">-->
                  <!--  <p class="text-xs text-slate-500 font-bold uppercase tracking-tighter">Cm Pay Charge</p>-->
                  <!--  <p class="text-lg font-black text-violet-600">{{ formatCurrency(monthlyDeepDiveKpis.cmpayChargeActual) }}</p>-->
                  <!--</div>-->
                </div>
              </section>
              
              <!-- Hotel Status Pie Chart -->
              <section class="bg-white p-6 rounded-2xl shadow-xs border border-slate-100">
                <h3 class="text-lg font-bold text-slate-700 mb-6">Hotel Portfolio Status</h3>
                <div class="h-[300px]">
                  <HotelStatusPieChart
                    :actual="monthlyDeepDiveKpis.hotelActual"
                    :pending="monthlyDeepDiveKpis.clientPendingSetupCount"
                    :free-trial="monthlyDeepDiveKpis.clientFreeTrialCount"
                    :drop-out="monthlyDeepDiveKpis.clientChurnCount"
                  />
                </div>
              </section>
            </div>
          </div>
          
          <!-- Annual Performance Analysis -->
          <div v-if="annualChartData.length === 0" class="text-center p-8 text-slate-500">
            No annual data available for the selected year.
          </div>
          <div v-else>
            <!-- Annual Header Section -->
            <div class="mb-8 border-b border-slate-100 pb-4">
              <h2 class="text-1xl font-bold text-slate-800 text-left">Annual Performance Analysis</h2>
              <p v-if="store.selectedYearMonth" class="text-sm text-slate-500 text-left">
                Overview for <span class="font-bold text-blue-600">{{ store.selectedYearMonth?.year }}</span>
              </p>
              <p v-else-if="yearRange.length > 0" class="text-sm text-slate-500 text-left">
                Overview for <span class="font-bold text-blue-600">{{ yearRange[0] }} - {{ yearRange[yearRange.length - 1] }}</span>
              </p>
            </div>
            
            <!-- Annual YoY Comparison Cards -->
            <div v-if="annualComparison">
              <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
                <div v-for="(data, key) in annualComparison.metrics" :key="key" class="bg-white p-6 rounded-2xl shadow-xs border border-slate-100">
                  <p class="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">{{ data.label }} (Annual)</p>
                  <h3 class="text-2xl font-black text-slate-800">
                    {{ isCountMetric(key) ? Math.round(data.current).toLocaleString() : formatCurrency(data.current) }}
                  </h3>
                  <div v-if="data.growth !== null" class="mt-2 flex items-center gap-2">
                  <span :class="data.growth >= 0 ? 'text-emerald-600 bg-emerald-50' : 'text-rose-600 bg-rose-50'" class="text-[10px] font-black px-2 py-0.5 rounded-full flex items-center gap-1">
                    {{ data.growth >= 0 ? '▲' : '▼' }} {{ Math.abs(data.growth).toFixed(1) }}%
                  </span>
                    <span class="text-[10px] text-slate-400 font-medium">vs {{ annualComparison.prevYear }} have ({{ isCountMetric(key) ? Math.round(data.prev || 0).toLocaleString() : formatCurrency(data.prev || 0) }})</span>
                  </div>
                  <div v-else class="mt-2 text-[10px] text-slate-300 italic">No data for {{ annualComparison.prevYear }}</div>
                </div>
              </div>
            </div>
            
            <!-- Annual Performance Analysis Charts -->
            <div class="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-8">
              <section class="bg-white p-6 rounded-2xl shadow-xs border border-slate-100">
                <h3 class="text-lg font-bold text-slate-700 mb-4">Revenue Trend: Actual vs. Target</h3>
                <div class="h-[300px]">
                  <RevenueComparisonChart :chart-data="annualChartData" />
                </div>
              </section>
              
              <section class="bg-white p-6 rounded-2xl shadow-xs border border-slate-100">
                <h3 class="text-lg font-bold text-slate-700 mb-4">Business Health Trend (NRR, GRR, Churn)</h3>
                <div class="h-[300px]">
                  <BusinessHealthTrendChart :chart-data="annualChartData" />
                </div>
              </section>
              
              <section class="bg-white p-6 rounded-2xl shadow-xs border border-slate-100">
                <h3 class="text-lg font-bold text-slate-700 mb-4">MRR Movement Analysis</h3>
                <div class="h-[400px]">
                  <MRRMovementChart :chart-data="annualChartData" />
                </div>
              </section>
              
              <section class="bg-white p-6 rounded-2xl shadow-xs border border-slate-100">
                <h3 class="text-lg font-bold text-slate-700 mb-4">Sales Target Achievement</h3>
                <div class="h-[300px]">
                  <TargetAchievementChart :chart-data="annualChartData" />
                </div>
              </section>
              
              <section class="bg-white p-6 rounded-2xl shadow-xs border border-slate-100">
                <h3 class="text-lg font-bold text-slate-700 mb-4">Sales Efficiency (Avg. Sales / Rep)</h3>
                <div class="h-[300px]">
                  <SalesEfficiencyChart :chart-data="annualChartData" />
                </div>
              </section>
              
              <section class="bg-white p-6 rounded-2xl shadow-xs border border-slate-100">
                <h3 class="text-lg font-bold text-slate-700 mb-4">Client Growth vs. Churn</h3>
                <div class="h-[300px]">
                  <ClientGrowthVsChurnChart :chart-data="annualChartData" />
                </div>
              </section>
              
              <section class="bg-white p-6 rounded-2xl shadow-xs border border-slate-100">
                <h3 class="text-lg font-bold text-slate-700 mb-4">Pipeline Health (Trial & Pending)</h3>
                <div class="h-[300px]">
                  <PipelineHealthChart :chart-data="annualChartData" />
                </div>
              </section>
              
              <section class="bg-white p-6 rounded-2xl shadow-xs border border-slate-100">
                <h3 class="text-lg font-bold text-slate-700 mb-4">New Client Acquisition Mix</h3>
                <div class="h-[300px]">
                  <AcquisitionMixChart :chart-data="annualChartData" />
                </div>
              </section>
              
              <section class="bg-white p-6 rounded-2xl shadow-xs border border-slate-100 lg:col-span-2">
                <h3 class="text-lg font-bold text-slate-700 mb-4">CM Pay Performance</h3>
                <CMPayDashboard :chart-data="annualChartData" />
              </section>
              
              <section class="bg-white p-6 rounded-2xl shadow-xs border border-slate-100 lg:col-span-2">
                <h3 class="text-lg font-bold text-slate-700 mb-4">Hotel Gru Performance</h3>
                <HotelGruDashboard :chart-data="annualChartData" />
              </section>
            </div>
          </div>
          
          <!-- Breakdown Charts Section -->
          <div v-if="breakdownData">
            <!-- Breakdown Charts Header Section -->
            <div class="border-b border-slate-100 pb-4 mt-8 mb-8">
              <h2 class="text-1xl font-bold text-slate-800 text-left">Market Share & Distribution</h2>
              <p class="text-sm text-slate-500 mt-1 text-left">
                Overview current
              </p>
            </div>
            
            <div class="grid grid-cols-1 md:grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-5 gap-6 mb-10">
              <div class="bg-slate-50 p-4 rounded-2xl border border-slate-100 h-[300px]">
                <BreakdownPieChart title="Package" :distribution-data="breakdownData.packageDistribution" />
              </div>
              <div class="bg-slate-50 p-4 rounded-2xl border border-slate-100 h-[300px]">
                <BreakdownPieChart title="Payment" :distribution-data="breakdownData.paymentConditionDistribution" />
              </div>
              <div class="bg-slate-50 p-4 rounded-2xl border border-slate-100 h-[300px]">
                <BreakdownPieChart title="Revenue Model" :distribution-data="breakdownData.revenueModelDistribution" />
              </div>
              <div class="bg-slate-50 p-4 rounded-2xl border border-slate-100 h-[300px]">
                <BreakdownPieChart title="Sales Channel" :distribution-data="breakdownData.salesChannelDistribution" />
              </div>
              <div class="bg-slate-50 p-4 rounded-2xl border border-slate-100 h-[300px]">
                <BreakdownPieChart title="Closed By" :distribution-data="breakdownData.closedDealDistribution" />
              </div>
            </div>
          </div>
          
          <!-- Hotel Distribution Charts Section -->
          <div class="grid grid-cols-2">
            <!-- Thailand Charts Section -->
            <div>
              <!-- Thailand Charts Header Section -->
              <div class="border-b border-slate-100 pb-4 mt-8 mb-8">
                <h2 class="text-1xl font-bold text-slate-800 text-left">Hotel Share & Distribution</h2>
                <p class="text-sm text-slate-500 mt-1 text-left">
                  Overview on domestic
                </p>
              </div>
              <div class="flex flex-col bg-white h-auto lg:h-[750px]">
                <!-- :distribution-data="breakdownData.provinceDistribution -->
                <ThailandMapChart :distribution-data="breakdownData.provinceDistribution" />
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  </div>
</template>

<style lang="css" scoped>
@import "tailwindcss";

@theme {
  /*
  xs	480px (30rem)	สมาร์ทโฟนหน้าจอเล็ก
  sm	640px (40rem)	สมาร์ทโฟนขนาดใหญ่ / แท็บเล็ตแนวตั้ง
  md	768px (48rem)	แท็บเล็ต / หน้าจอคอมขนาดเล็ก
  lg	1024px (64rem)	แล็ปท็อป / หน้าจอคอมพิวเตอร์ทั่วไป
  xl	1280px (80rem)	หน้าจอเดสก์ท็อปขนาดใหญ่
  2xl	1536px (96rem)	หน้าจอความละเอียดสูง (Ultra-wide)
  3xl	1920px (120rem)	หน้าจอใหญ่พิเศษ
  */
  --breakpoint-xs: 30rem;    /* 480px */
  --breakpoint-3xl: 120rem;  /* 1920px */
}
</style>
