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

const store = useSaasMetricsStore();

const yearRange = computed((): [number, number] => {
  if (store.allAvailableYears.length === 0) return [2024, 2026];
  const firstYear = parseInt(store.allAvailableYears[0]);
  const lastYear = parseInt(store.allAvailableYears[store.allAvailableYears.length - 1]);
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
const monthlyDeepDiveData = computed(() => store.monthlyDeepDiveData);
const monthlyDeepDiveKpis = computed(() => store.monthlyDeepDiveKpis);
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
          <div class="flex flex-col md:flex-row justify-between items-center gap-4 mb-6">
            <h2 class="text-2xl font-bold text-slate-800">Annual Performance</h2>
            <div class="flex items-center gap-4">
              <!-- Annual Year Filter -->
              <div class="w-40">
                <VueDatePicker
                  v-if="store.allAvailableYears.length > 0"
                  v-model="annualSelectedYearForPicker"
                  year-picker
                  auto-apply
                  placeholder="2026"
                  :clearable="true"
                  :year-range="yearRange"
                />
                <div v-else class="h-9 w-full bg-slate-200 rounded-lg animate-pulse"></div>
              </div>
            </div>
          </div>
          
          <div v-if="annualChartData.length === 0" class="text-center p-8 text-slate-500">
            No annual data available for the selected year.
          </div>
          <div v-else class="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <section class="bg-white p-6 rounded-2xl shadow-md border border-slate-200">
              <h3 class="text-xl font-bold text-slate-800 mb-4">Business Health Trend (NRR, GRR, Churn Rate)</h3>
              <div class="h-[350px]">
                <BusinessHealthTrendChart :chart-data="annualChartData" />
              </div>
            </section>
            
            <section class="bg-white p-6 rounded-2xl shadow-md border border-slate-200">
              <h3 class="text-xl font-bold text-slate-800 mb-4">Profitability: Actual vs. Target</h3>
              <div class="h-[350px]">
                <ProfitabilityChart :chart-data="annualChartData" />
              </div>
            </section>
            
            <section class="bg-white p-6 rounded-2xl shadow-md border border-slate-200">
              <h3 class="text-xl font-bold text-slate-800 mb-4">MRR Movement Analysis</h3>
              <div class="h-[450px]">
                <MRRMovementChart :chart-data="annualChartData" />
              </div>
            </section>
            
            <section class="bg-white p-6 rounded-2xl shadow-md border border-slate-200">
              <h3 class="text-xl font-bold text-slate-800 mb-4">New Client Acquisition Mix</h3>
              <div class="h-[350px]">
                <AcquisitionMixChart :chart-data="annualChartData" />
              </div>
            </section>
          </div>
        </section>
        
        <!-- Monthly Deep Dive Section -->
        <section class="bg-white p-6 rounded-2xl shadow-md border border-slate-200">
          <div class="flex flex-col md:flex-row justify-between items-center gap-4 mb-6">
            <h2 class="text-2xl font-bold text-slate-800">Monthly Deep Dive</h2>
            <div class="flex items-center gap-4">
              <!-- Monthly Month Filter -->
              <div class="w-48">
                <VueDatePicker
                  v-if="store.allAvailableYears.length > 0"
                  v-model="monthlySelectedMonthForPicker"
                  month-picker
                  auto-apply
                  placeholder="01/2026"
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
            <h3 class="text-xl font-bold text-slate-800 mb-6">KPIs for {{ monthlyDeepDiveKpis.label }}</h3>
            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              <!-- KPI Card: MRR -->
              <div class="bg-white p-6 rounded-2xl shadow-md border">
                <p class="text-sm font-bold text-slate-500">MRR</p>
                <h4 class="text-3xl font-extrabold text-blue-600 mt-2">
                  {{ formatCurrency(monthlyDeepDiveKpis.mrr) }}
                </h4>
              </div>
              <!-- KPI Card: NRR -->
              <div class="bg-white p-6 rounded-2xl shadow-md border">
                <p class="text-sm font-bold text-slate-500">NRR</p>
                <h4 class="text-3xl font-extrabold" :class="monthlyDeepDiveKpis.nrrPercent >= 100 ? 'text-green-600' : 'text-red-500'">
                  {{ formatPercentage(monthlyDeepDiveKpis.nrrPercent) }}
                </h4>
              </div>
              <!-- KPI Card: Profit -->
              <div class="bg-white p-6 rounded-2xl shadow-md border">
                <p class="text-sm font-bold text-slate-500">Actual Profit</p>
                <h4 class="text-3xl font-extrabold text-sky-600 mt-2">
                  {{ formatCurrency(monthlyDeepDiveKpis.actualProfit) }}
                </h4>
              </div>
              <!-- KPI Card: New Clients -->
              <div class="bg-white p-6 rounded-2xl shadow-md border">
                <p class="text-sm font-bold text-slate-500">New Clients</p>
                <h4 class="text-3xl font-extrabold text-violet-600 mt-2">
                  +{{ monthlyDeepDiveKpis.newClientsTotal }}
                </h4>
              </div>
            </div>
            
            <!-- Additional Monthly Deep Dive Charts (if needed) -->
            <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
              <section class="bg-white p-6 rounded-2xl shadow-md border border-slate-200">
                <h3 class="text-xl font-bold text-slate-800 mb-4">Monthly MRR Breakdown</h3>
                <div class="grid grid-cols-2 gap-4 text-center">
                  <div class="p-4 bg-blue-50 rounded-lg">
                    <p class="text-sm text-slate-600">Expansion</p>
                    <p class="text-lg font-bold text-green-600">{{ formatCurrency(monthlyDeepDiveKpis.expansion) }}</p>
                  </div>
                  <div class="p-4 bg-blue-50 rounded-lg">
                    <p class="text-sm text-slate-600">Churn</p>
                    <p class="text-lg font-bold text-red-600">{{ formatCurrency(monthlyDeepDiveKpis.churnAmount) }}</p>
                  </div>
                  <div class="p-4 bg-blue-50 rounded-lg col-span-2">
                    <p class="text-sm text-slate-600">Contraction</p>
                    <p class="text-lg font-bold text-orange-600">{{ formatCurrency(monthlyDeepDiveKpis.contraction) }}</p>
                  </div>
                </div>
              </section>
              <section class="bg-white p-6 rounded-2xl shadow-md border border-slate-200">
                <h3 class="text-xl font-bold text-slate-800 mb-4">Monthly Client Acquisition</h3>
                <div class="grid grid-cols-2 gap-4 text-center">
                  <div class="p-4 bg-blue-50 rounded-lg">
                    <p class="text-sm text-slate-600">Organic</p>
                    <p class="text-lg font-bold text-blue-600">{{ monthlyDeepDiveKpis.newClientsOrganic }}</p>
                  </div>
                  <div class="p-4 bg-blue-50 rounded-lg">
                    <p class="text-sm text-slate-600">Partner</p>
                    <p class="text-lg font-bold text-violet-600">{{ monthlyDeepDiveKpis.newClientsBusinessPartner }}</p>
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
