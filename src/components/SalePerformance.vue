<script setup lang="ts">
import { computed } from 'vue';
import { useSaasMetricsStore } from '../stores/saasMetricsStore';
import { VueDatePicker } from '@vuepic/vue-datepicker';
import { formatCurrency, formatPercentage } from '../utils/formatters';
import '@vuepic/vue-datepicker/dist/main.css';

// Import Chart Components
import BusinessHealthTrendChart from './charts/BusinessHealthTrendChart.vue';
import ProfitabilityChart from './charts/ProfitabilityChart.vue';
import MRRMovementChart from './charts/MRRMovementChart.vue';
import AcquisitionMixChart from './charts/AcquisitionMixChart.vue';
import TargetAchievementChart from './charts/TargetAchievementChart.vue';
import SalesEfficiencyChart from './charts/SalesEfficiencyChart.vue';
import PipelineHealthChart from './charts/PipelineHealthChart.vue';
import TotalRevenueChart from './charts/TotalRevenueChart.vue';

const store = useSaasMetricsStore();

const yearRange = computed((): [number, number] => {
  if (store.allAvailableYears.length === 0) return [2024, 2026];
  const firstYear = parseInt(store.allAvailableYears[0]!);
  const lastYear = parseInt(store.allAvailableYears[store.allAvailableYears.length - 1]!);
  if (isNaN(firstYear) || isNaN(lastYear)) return [2024, 2026];
  return [firstYear, lastYear];
});

// --- Computed properties for Annual Performance Filters ---
const annualSelectedYearForPicker = computed({
  get: () => store.annualSelectedYear ? store.annualSelectedYear : null,
  set: (val: { year: number; month: number } | number | null) => {
    let yearString: string | null = null;
    if (typeof val === 'number') {
      yearString = val.toString();
    } else if (val && typeof val === 'object' && 'year' in val) {
      yearString = val.year.toString();
    }
    store.annualSelectedYear = yearString;
  },
});

// --- Computed properties for Monthly Deep Dive Filters ---
const monthlySelectedMonthForPicker = computed({
  get: () => store.monthlySelectedMonth ? { year: parseInt(store.monthlySelectedMonth.year), month: parseInt(store.monthlySelectedMonth.month) - 1 } : null,
  set: (val) => {
    if (val && typeof val === 'object' && 'year' in val && 'month' in val && val.month !== undefined) {
      store.monthlySelectedMonth = {
        year: val.year.toString(),
        month: (val.month + 1).toString().padStart(2, '0'),
      };
    } else {
      store.monthlySelectedMonth = null;
    }
  },
});

// --- Data for Charts and KPIs ---
const annualChartData = computed(() => store.annualChartData);
const annualComparison = computed(() => store.annualComparison);
const monthlyDeepDiveData = computed(() => store.monthlyDeepDiveData);
const monthlyDeepDiveKpis = computed(() => store.monthlyDeepDiveKpis);

const yearPickerKey = computed(() => store.allAvailableYears.join('-'));
</script>

<template>
  <div class="min-h-screen bg-slate-100 p-4 md:p-8 font-sans w-full">
    <div class="space-y-12">
      
      <!-- Loading State -->
      <div v-if="!store.saasMetricsData" class="text-center p-12 text-slate-500 text-lg">
        Loading SaaS Metrics Data...
      </div>
      <div v-else-if="store.allAvailableYears.length === 0" class="text-center p-12 text-slate-500 text-lg">
        No data available. Please sync from source.
      </div>
      
      <div v-else>
        <!-- Annual Performance Section -->
        <section class="bg-white p-6 rounded-2xl shadow-md border border-slate-200 mb-12">
          <div class="flex flex-col md:flex-row justify-between items-center gap-4 mb-8">
            <div>
              <h2 class="text-2xl font-bold text-slate-800">Annual Performance Analysis</h2>
              <p class="text-sm text-slate-500 mt-1">Yearly trends and YoY growth comparison</p>
            </div>
            <div class="flex items-center gap-4">
              <div class="w-40">
                <VueDatePicker
                  v-if="store.allAvailableYears.length > 0"
                  :key="yearPickerKey"
                  v-model="annualSelectedYearForPicker"
                  year-picker
                  auto-apply
                  placeholder="Select Year"
                  :clearable="true"
                  :year-range="yearRange"
                />
                <div v-else class="h-9 w-full bg-slate-200 rounded-lg animate-pulse"></div>
              </div>
            </div>
          </div>

          <!-- ✨ Annual YoY Comparison Cards -->
          <div v-if="annualComparison" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
            <div v-for="(data, key) in annualComparison.metrics" :key="key" class="bg-slate-50 p-5 rounded-2xl border border-slate-100 relative overflow-hidden">
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
          
          <div v-if="annualChartData.length === 0" class="text-center p-8 text-slate-500">
            No annual data available for the selected year.
          </div>
          <div v-else class="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <section class="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
              <h3 class="text-lg font-bold text-slate-700 mb-4">Total Revenue Trend</h3>
              <div class="h-[300px]">
                <TotalRevenueChart :chart-data="annualChartData" />
              </div>
            </section>

            <section class="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
              <h3 class="text-lg font-bold text-slate-700 mb-4">Business Health Trend (NRR, GRR, Churn)</h3>
              <div class="h-[300px]">
                <BusinessHealthTrendChart :chart-data="annualChartData" />
              </div>
            </section>
            
            <section class="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
              <h3 class="text-lg font-bold text-slate-700 mb-4">Profitability: Actual vs. Target</h3>
              <div class="h-[300px]">
                <ProfitabilityChart :chart-data="annualChartData" />
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
          </div>
        </section>
        
        <!-- Monthly Deep Dive Section -->
        <section class="bg-white p-6 rounded-2xl shadow-md border border-slate-200">
          <div class="flex flex-col md:flex-row justify-between items-center gap-4 mb-8">
            <div>
              <h2 class="text-2xl font-bold text-slate-800">Monthly Deep Dive</h2>
              <p class="text-sm text-slate-500 mt-1">Detailed analysis for a specific month</p>
            </div>
            <div class="flex items-center gap-4">
              <div class="w-48">
                <VueDatePicker
                  v-if="store.allAvailableYears.length > 0"
                  v-model="monthlySelectedMonthForPicker"
                  month-picker
                  auto-apply
                  placeholder="Select Month"
                  :clearable="true"
                  :year-range="yearRange"
                />
                <div v-else class="h-9 w-full bg-slate-200 rounded-lg animate-pulse"></div>
              </div>
            </div>
          </div>
          
          <div v-if="monthlyDeepDiveData.length === 0" class="text-center p-8 text-slate-500">
            No monthly data available for the selected period.
          </div>
          <div v-else-if="monthlyDeepDiveKpis" class="mb-12">
            <h3 class="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
              <span class="p-2 bg-blue-50 text-blue-600 rounded-lg text-sm">📊</span>
              KPIs for {{ monthlyDeepDiveKpis.label }}
            </h3>
            
            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
              <div class="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                <p class="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">MRR</p>
                <h4 class="text-2xl font-black text-blue-600 mt-2">
                  {{ formatCurrency(monthlyDeepDiveKpis.mrr) }}
                </h4>
              </div>
              <div class="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                <p class="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">NRR</p>
                <h4 class="text-2xl font-black mt-2" :class="monthlyDeepDiveKpis.nrrPercent >= 100 ? 'text-emerald-600' : 'text-rose-500'">
                  {{ formatPercentage(monthlyDeepDiveKpis.nrrPercent) }}
                </h4>
              </div>
              <div class="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                <p class="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Actual Profit</p>
                <h4 class="text-2xl font-black text-sky-600 mt-2">
                  {{ formatCurrency(monthlyDeepDiveKpis.actualProfit) }}
                </h4>
              </div>
              <div class="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                <p class="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">New Clients</p>
                <h4 class="text-2xl font-black text-violet-600 mt-2">
                  +{{ monthlyDeepDiveKpis.totalNewClients }}
                </h4>
              </div>
            </div>
            
            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              <div class="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                <p class="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Pipeline</p>
                <h4 class="text-2xl font-black text-orange-500 mt-2">
                  {{ monthlyDeepDiveKpis.clientsFreeTrial + monthlyDeepDiveKpis.clientsPendingSetup }}
                </h4>
                <p class="text-[10px] text-slate-400 mt-1">
                  {{ monthlyDeepDiveKpis.clientsFreeTrial }} Trial & {{ monthlyDeepDiveKpis.clientsPendingSetup }} Pending
                </p>
              </div>
              <div class="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                <p class="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Sales Force</p>
                <h4 class="text-2xl font-black text-indigo-600 mt-2">
                  {{ monthlyDeepDiveKpis.totalSalesRep }} Reps
                </h4>
                <p class="text-[10px] text-slate-400 mt-1">
                  Avg. {{ (monthlyDeepDiveKpis.totalNewClients / (monthlyDeepDiveKpis.totalSalesRep || 1)).toFixed(1) }} Sales/Rep
                </p>
              </div>
              <div class="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                <p class="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Target Achievement</p>
                <h4 class="text-2xl font-black mt-2" :class="monthlyDeepDiveKpis.actualHotels >= monthlyDeepDiveKpis.targetHotels ? 'text-emerald-600' : 'text-rose-500'">
                  {{ ((monthlyDeepDiveKpis.actualHotels / (monthlyDeepDiveKpis.targetHotels || 1)) * 100).toFixed(1) }}%
                </h4>
                <p class="text-[10px] text-slate-400 mt-1">
                  {{ monthlyDeepDiveKpis.actualHotels }} / {{ monthlyDeepDiveKpis.targetHotels }} Hotels
                </p>
              </div>
              <div class="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                <p class="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Churn Volume</p>
                <h4 class="text-2xl font-black text-red-600 mt-2">
                  -{{ monthlyDeepDiveKpis.clientsDropOut }}
                </h4>
                <p class="text-[10px] text-slate-400 mt-1">Clients Lost</p>
              </div>
            </div>
            
            <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
              <section class="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                <h3 class="text-lg font-bold text-slate-700 mb-4">Monthly MRR Breakdown</h3>
                <div class="grid grid-cols-2 gap-4 text-center">
                  <div class="p-4 bg-slate-50 rounded-xl border border-slate-100">
                    <p class="text-xs text-slate-500 font-bold uppercase tracking-tighter">Expansion</p>
                    <p class="text-lg font-black text-emerald-600">{{ formatCurrency(monthlyDeepDiveKpis.expansion) }}</p>
                  </div>
                  <div class="p-4 bg-slate-50 rounded-xl border border-slate-100">
                    <p class="text-xs text-slate-500 font-bold uppercase tracking-tighter">Churn</p>
                    <p class="text-lg font-black text-rose-600">{{ formatCurrency(monthlyDeepDiveKpis.churnAmount) }}</p>
                  </div>
                  <div class="p-4 bg-slate-50 rounded-xl border border-slate-100 col-span-2">
                    <p class="text-xs text-slate-500 font-bold uppercase tracking-tighter">Contraction</p>
                    <p class="text-lg font-black text-orange-600">{{ formatCurrency(monthlyDeepDiveKpis.contraction) }}</p>
                  </div>
                </div>
              </section>
              <section class="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                <h3 class="text-lg font-bold text-slate-700 mb-4">Monthly Client Acquisition</h3>
                <div class="grid grid-cols-2 gap-4 text-center">
                  <div class="p-4 bg-slate-50 rounded-xl border border-slate-100">
                    <p class="text-xs text-slate-500 font-bold uppercase tracking-tighter">Organic</p>
                    <p class="text-lg font-black text-blue-600">{{ monthlyDeepDiveKpis.newClientsOrganic }}</p>
                  </div>
                  <div class="p-4 bg-slate-50 rounded-xl border border-slate-100">
                    <p class="text-xs text-slate-500 font-bold uppercase tracking-tighter">Partner</p>
                    <p class="text-lg font-black text-violet-600">{{ monthlyDeepDiveKpis.newClientsBusinessPartner }}</p>
                  </div>
                </div>
              </section>
            </div>
          </div>
          <div v-else class="text-center p-8 text-slate-500">
            Select a specific month to view deep dive KPIs.
          </div>
        </section>
      </div>
    </div>
  </div>
</template>
