<script setup lang="ts">
import { computed } from 'vue';
import { useSaasMetricsStore } from '../stores/saasMetricsStore';
import { VueDatePicker } from '@vuepic/vue-datepicker';
import { formatCurrency, formatPercentage } from '../utils/formatters';
import '@vuepic/vue-datepicker/dist/main.css';

// Import Chart Components
import BusinessHealthTrendChart from './charts/BusinessHealthTrendChart.vue';
import RevenueComparisonChart from './charts/RevenueComparisonChart.vue';
import MRRMovementChart from './charts/MRRMovementChart.vue';
import AcquisitionMixChart from './charts/AcquisitionMixChart.vue';
import TargetAchievementChart from './charts/TargetAchievementChart.vue';
import SalesEfficiencyChart from './charts/SalesEfficiencyChart.vue';
import PipelineHealthChart from './charts/PipelineHealthChart.vue';
import TotalRevenueChart from './charts/TotalRevenueChart.vue';
import HotelStatusPieChart from './charts/HotelStatusPieChart.vue';
import CMPayChart from './charts/CMPayChart.vue';
import CMPayComparisonChart from './charts/CMPayComparisonChart.vue';
// import HotelWaterfallChart from './charts/HotelWaterfallChart.vue';
import OnlineUsersBadge from './OnlineUsersBadge.vue';

const store = useSaasMetricsStore();

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
// const hotelWaterfallData = computed(() => store.hotelWaterfallData);
</script>

<template>
  <div class="min-h-screen bg-slate-100 p-4 md:p-8 font-sans min-w-screen">
    <div class="space-y-4">
      
      <!-- Global Header & Filter -->
      <div class="bg-white p-6 rounded-2xl shadow-md border border-slate-200 flex flex-col md:flex-row justify-between items-center gap-4">
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
      <div v-if="!store.saasMetricsData" class="text-center p-12 text-slate-500 text-lg">
        Loading SaaS Metrics Data...
      </div>
      <div v-else-if="store.allAvailableYears.length === 0" class="text-center p-12 text-slate-500 text-lg">
        No data available. Please sync from source.
      </div>
      
      <div v-else class="space-y-12">
        <!-- Sale Performance Section -->
        <section class="bg-white p-6 rounded-2xl shadow-md border border-slate-200">
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
              <div class="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                <p class="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Live Hotels</p>
                <h4 class="text-2xl font-black text-emerald-600 mt-2">{{ monthlyDeepDiveKpis.hotelActual }}</h4>
                <p class="text-[10px] text-slate-400 mt-1">Active in system</p>
              </div>
              <div class="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                <p class="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">New Clients</p>
                <h4 class="text-2xl font-black text-violet-600 mt-2">
                  +{{ monthlyDeepDiveKpis.totalNewClients }}
                </h4>
                <p class="text-[10px] text-slate-400 mt-1">
                  {{ monthlyDeepDiveKpis.clientNewOrganicCount }} Organic & {{ monthlyDeepDiveKpis.clientNewPartnerCount }} Partner
                </p>
              </div>
              <div class="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                <p class="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Drop Out</p>
                <h4 class="text-2xl font-black text-red-600 mt-2">
                  -{{ monthlyDeepDiveKpis.clientChurnCount }}
                </h4>
                <p class="text-[10px] text-slate-400 mt-1">Churn Rate {{ monthlyDeepDiveKpis.churnRatePercent }}%</p>
              </div>
              <div class="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                <p class="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Pipeline Hotels</p>
                <h4 class="text-2xl font-black text-orange-500 mt-2">
                  {{ monthlyDeepDiveKpis.clientFreeTrialCount + monthlyDeepDiveKpis.clientPendingSetupCount }}
                </h4>
                <p class="text-[10px] text-slate-400 mt-1">
                  {{ monthlyDeepDiveKpis.clientFreeTrialCount }} Trial & {{ monthlyDeepDiveKpis.clientPendingSetupCount }} Pending
                </p>
              </div>
              <div class="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                <p class="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Target Achievement</p>
                <h4 class="text-2xl font-black mt-2" :class="monthlyDeepDiveKpis.hotelActual >= monthlyDeepDiveKpis.hotelTarget ? 'text-emerald-600' : 'text-rose-500'">
                  {{ ((monthlyDeepDiveKpis.hotelActual / (monthlyDeepDiveKpis.hotelTarget || 1)) * 100).toFixed(1) }}%
                </h4>
                <p class="text-[10px] text-slate-400 mt-1">
                  {{ monthlyDeepDiveKpis.hotelActual }} / {{ monthlyDeepDiveKpis.hotelTarget }} Hotels
                </p>
              </div>
              <div class="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                <p class="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Sales Force</p>
                <h4 class="text-2xl font-black text-indigo-600 mt-2">
                  {{ monthlyDeepDiveKpis.salesRepCount }} Reps
                </h4>
                <p class="text-[10px] text-slate-400 mt-1">
                  Avg. {{ (monthlyDeepDiveKpis.totalNewClients / (monthlyDeepDiveKpis.salesRepCount || 1)).toFixed(1) }} Sales/Rep
                </p>
              </div>
            </div>
            
            <!-- Monthly Deep Dive Charts -->
            <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-10">
              <!-- Monthly MRR Breakdown -->
              <section class="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                <h3 class="text-lg font-bold text-slate-700 mb-6">Monthly Revenue Breakdown</h3>
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 text-center">
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
                  <div class="p-4 bg-slate-50 rounded-xl border border-slate-100">
                    <p class="text-xs text-slate-500 font-bold uppercase tracking-tighter">Actual Profit</p>
                    <p class="text-lg font-black text-sky-600">{{ formatCurrency(monthlyDeepDiveKpis.cmpayProfitActual) }}</p>
                  </div>
                  <div class="p-4 bg-slate-50 rounded-xl border border-slate-100">
                    <p class="text-xs text-slate-500 font-bold uppercase tracking-tighter">Revenue</p>
                    <p class="text-lg font-black text-emerald-600">{{ formatCurrency(monthlyDeepDiveKpis.revenueActual) }}</p>
                  </div>
                </div>
              </section>
              
              <!-- Monthly Client Acquisition -->
              <section class="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                <h3 class="text-lg font-bold text-slate-700 mb-6">Monthly Client Acquisition</h3>
                <div class="grid grid-cols-1 gap-4 text-center">
                  <div class="p-4 bg-slate-50 rounded-xl border border-slate-100">
                    <p class="text-xs text-slate-500 font-bold uppercase tracking-tighter">Organic</p>
                    <p class="text-lg font-black text-blue-600">{{ monthlyDeepDiveKpis.clientNewOrganicCount }}</p>
                  </div>
                  <div class="p-4 bg-slate-50 rounded-xl border border-slate-100">
                    <p class="text-xs text-slate-500 font-bold uppercase tracking-tighter">Partner</p>
                    <p class="text-lg font-black text-violet-600">{{ monthlyDeepDiveKpis.clientNewPartnerCount }}</p>
                  </div>
                  <div class="p-4 bg-blue-50 rounded-xl border border-blue-100">
                    <p class="text-xs text-blue-500 font-bold uppercase tracking-tighter">Total New</p>
                    <p class="text-lg font-black text-blue-700">{{ monthlyDeepDiveKpis.totalNewClients }}</p>
                  </div>
                </div>
              </section>
              
              <!-- Hotel Status Pie Chart -->
              <section class="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                <h3 class="text-lg font-bold text-slate-700 mb-6">Hotel Portfolio Status</h3>
                <div class="h-[300px]">
                  <HotelStatusPieChart
                    :actual="monthlyDeepDiveKpis.hotelActual"
                    :pending="monthlyDeepDiveKpis.clientPendingSetupCount"
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
                <div v-for="(data, key) in annualComparison.metrics" :key="key" class="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                  <p class="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">{{ key }} (Annual)</p>
                  <h3 class="text-2xl font-black text-slate-800">
                    {{ key === 'newClients' ? data.current : formatCurrency(data.current) }}
                  </h3>
                  <div v-if="data.growth !== null" class="mt-2 flex items-center gap-2">
                  <span :class="data.growth >= 0 ? 'text-emerald-600 bg-emerald-50' : 'text-rose-600 bg-rose-50'" class="text-[10px] font-black px-2 py-0.5 rounded-full flex items-center gap-1">
                    {{ data.growth >= 0 ? '▲' : '▼' }} {{ Math.abs(data.growth).toFixed(1) }}%
                  </span>
                    <span class="text-[10px] text-slate-400 font-medium">vs {{ annualComparison.prevYear }}</span>
                  </div>
                  <div v-else class="mt-2 text-[10px] text-slate-300 italic">No data for {{ annualComparison.prevYear }}</div>
                </div>
              </div>
            </div>
            
            <!-- Annual Performance Analysis Charts -->
            <div class="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-8">
              <section class="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                <h3 class="text-lg font-bold text-slate-700 mb-4">Total Revenue Trend</h3>
                <div class="h-[300px]">
                  <TotalRevenueChart :chart-data="annualChartData" />
                </div>
              </section>
              
              <section class="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                <h3 class="text-lg font-bold text-slate-700 mb-4">Revenue Comparison: Actual vs. Target</h3>
                <div class="h-[300px]">
                  <RevenueComparisonChart :chart-data="annualChartData" />
                </div>
              </section>
              
              <section class="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                <h3 class="text-lg font-bold text-slate-700 mb-4">Business Health Trend (NRR, GRR, Churn)</h3>
                <div class="h-[300px]">
                  <BusinessHealthTrendChart :chart-data="annualChartData" />
                </div>
              </section>
              
              <section class="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                <h3 class="text-lg font-bold text-slate-700 mb-4">MRR Movement Analysis</h3>
                <div class="h-[400px]">
                  <MRRMovementChart :chart-data="annualChartData" />
                </div>
              </section>
              
              <section class="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                <h3 class="text-lg font-bold text-slate-700 mb-4">Sales Target Achievement</h3>
                <div class="h-[300px]">
                  <TargetAchievementChart :chart-data="annualChartData" />
                </div>
              </section>
              
              <section class="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                <h3 class="text-lg font-bold text-slate-700 mb-4">Sales Efficiency (Avg. Sales / Rep)</h3>
                <div class="h-[300px]">
                  <SalesEfficiencyChart :chart-data="annualChartData" />
                </div>
              </section>
              
              <section class="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                <h3 class="text-lg font-bold text-slate-700 mb-4">Pipeline Health (Trial & Pending)</h3>
                <div class="h-[300px]">
                  <PipelineHealthChart :chart-data="annualChartData" />
                </div>
              </section>
              
              <section class="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                <h3 class="text-lg font-bold text-slate-700 mb-4">New Client Acquisition Mix</h3>
                <div class="h-[300px]">
                  <AcquisitionMixChart :chart-data="annualChartData" />
                </div>
              </section>
              
              <section class="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 col-span-2">
                <h3 class="text-lg font-bold text-slate-700 mb-4">CM Pay Analysis</h3>
                <div class="h-[300px]">
                  <CMPayChart :chart-data="annualChartData" />
                </div>
              </section>
              
              <section class="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                <h3 class="text-lg font-bold text-slate-700 mb-4">CM Pay Charge Comparison</h3>
                <div class="h-[300px]">
                  <CMPayComparisonChart :chart-data="annualChartData" :metric-type="'charge'" />
                </div>
              </section>
              
              <section class="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                <h3 class="text-lg font-bold text-slate-700 mb-4">CM Pay Profit Comparison</h3>
                <div class="h-[300px]">
                  <CMPayComparisonChart :chart-data="annualChartData" :metric-type="'profit'" />
                </div>
              </section>
            </div>
          </div>
          
          <!-- Hotel Waterfall Chart -->
          <!--<section class="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
            <h3 class="text-lg font-bold text-slate-700 mb-4">Hotel Net Growth (Waterfall)</h3>
            <div v-if="hotelWaterfallData" class="h-[300px]">
              <HotelWaterfallChart :chart-data="hotelWaterfallData" />
            </div>
            <div v-else class="h-[300px] flex items-center justify-center text-slate-400 italic">
              Not enough data for waterfall.
            </div>
          </section>-->
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
