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

// Computed property for year picker v-model
const selectedYearForPicker = computed({
  get: () => store.selectedYear ? { year: parseInt(store.selectedYear), month: 0 } : null,
  set: (val: { year: number; month: number } | number | null) => {
    let yearString: string | null = null;
    if (typeof val === 'number') { // If returns a number directly e.g., 2024
      yearString = val.toString();
    } else if (val && typeof val === 'object' && 'year' in val) { // If it returns e.g., { year: 2024, month: 0 }
      yearString = val.year.toString();
    }
    store.selectedYear = yearString;
    store.selectedMonth = null;
  },
});

// Computed property for month picker v-model
const selectedMonthForPicker = computed({
  get: () => store.selectedMonth ? { year: parseInt(store.selectedMonth.year), month: parseInt(store.selectedMonth.month) - 1 } : null,
  set: (val) => {
    if (val && typeof val === 'object' && 'year' in val && 'month' in val && val.month !== undefined) {
      store.selectedMonth = {
        year: val.year.toString(),
        month: (val.month + 1).toString().padStart(2, '0'),
      };
      store.selectedYear = val.year.toString(); // Ensure year is also selected
    } else {
      store.selectedMonth = null;
    }
  },
});

// Filtered data from store
const filteredData = computed(() => store.sortedMonthlyData);
const isSingleMonthView = computed(() => store.isSingleMonthView);
const singleMonthKpis = computed(() => store.singleMonthKpis);

// Function to format month picker display
const formatMonthPicker = (date: { month: number; year: number }) => {
  const monthName = new Date(date.year, date.month).toLocaleString('default', { month: 'long' });
  return `${monthName} ${date.year}`;
};

const yearPickerKey = computed(() => store.availableYears.join('-'));

const yearRange = computed((): [number, number] => {
  if (store.availableYears.length === 0) {
    return [2000, 2100]; // Fallback if no years are available yet
  }
  const firstYear = parseInt(store.availableYears[0]);
  const lastYear = parseInt(store.availableYears[store.availableYears.length - 1]);
  
  if (isNaN(firstYear) || isNaN(lastYear)) {
    console.warn('Invalid year value detected in availableYears, falling back to default range.');
    return [2000, 2100];
  }
  
  return [firstYear, lastYear];
});

</script>

<template>
  <div class="min-h-screen bg-slate-100 p-4 md:p-8 font-sans">
    <div class="max-w-7xl mx-auto space-y-12">
      
      <!-- Header and Filters -->
      <header class="bg-white p-6 rounded-2xl shadow-md border border-slate-200 flex flex-col md:flex-row justify-between items-center gap-4">
        <h1 class="text-2xl font-bold text-slate-800">Sale Performance Dashboard</h1>
        
        <div class="flex flex-col md:flex-row items-center gap-4">
          <!-- Year Filter -->
          <div class="w-40">
            <VueDatePicker
              v-if="store.availableYears.length > 0"
              :key="yearPickerKey"
              v-model="selectedYearForPicker"
              year-picker
              auto-apply
              placeholder="Select Year"
              :clearable="true"
              :year-range="yearRange"
            />
            <div v-else class="h-9 w-full bg-slate-200 rounded-lg animate-pulse"></div>
          </div>
          
          <!-- Month Filter -->
          <div class="w-48">
            <VueDatePicker
              v-model="selectedMonthForPicker"
              month-picker
              auto-apply
              placeholder="Select Month"
              :clearable="true"
              :format="formatMonthPicker"
              :min-date="store.selectedYear ? { year: parseInt(store.selectedYear), month: parseInt(store.availableMonths[0] || '1') - 1 } : undefined"
              :max-date="store.selectedYear ? { year: parseInt(store.selectedYear), month: parseInt(store.availableMonths[store.availableMonths.length - 1] || '12') - 1 } : undefined"
            />
          </div>
          
          <button
            v-if="store.selectedYear || store.selectedMonth"
            @click="store.selectedYear = null; store.selectedMonth = null;"
            class="text-sm text-blue-600 hover:text-blue-800 font-semibold"
          >
            Clear All Filters
          </button>
        </div>
      </header>
      
      <div v-if="!store.saasMetricsData" class="text-center p-12 text-slate-500 text-lg">
        Loading SaaS Metrics Data...
      </div>
      <div v-else-if="filteredData.length === 0" class="text-center p-12 text-slate-500 text-lg">
        No data available for the selected period.
      </div>
      <div v-else>
        <!-- Monthly Deep Dive Section (KPI Cards) -->
        <section v-if="isSingleMonthView && singleMonthKpis" class="mb-12">
          <h2 class="text-3xl font-black text-slate-800 mb-6">
            Monthly Deep Dive: {{ singleMonthKpis.label }}
          </h2>
          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <!-- KPI Card: MRR -->
            <div class="bg-white p-6 rounded-2xl shadow-md border">
              <p class="text-sm font-bold text-slate-500">MRR</p>
              <h3 class="text-3xl font-extrabold text-blue-600 mt-2">
                {{ formatCurrency(singleMonthKpis.mrr) }}
              </h3>
            </div>
            <!-- KPI Card: NRR -->
            <div class="bg-white p-6 rounded-2xl shadow-md border">
              <p class="text-sm font-bold text-slate-500">NRR</p>
              <h3 class="text-3xl font-extrabold" :class="singleMonthKpis.nrrPercent >= 100 ? 'text-green-600' : 'text-red-500'">
                {{ formatPercentage(singleMonthKpis.nrrPercent) }}
              </h3>
            </div>
            <!-- KPI Card: Profit -->
            <div class="bg-white p-6 rounded-2xl shadow-md border">
              <p class="text-sm font-bold text-slate-500">Actual Profit</p>
              <h3 class="text-3xl font-extrabold text-sky-600 mt-2">
                {{ formatCurrency(singleMonthKpis.actualProfit) }}
              </h3>
            </div>
            <!-- KPI Card: New Clients -->
            <div class="bg-white p-6 rounded-2xl shadow-md border">
              <p class="text-sm font-bold text-slate-500">New Clients</p>
              <h3 class="text-3xl font-extrabold text-violet-600 mt-2">
                +{{ singleMonthKpis.newClientsTotal }}
              </h3>
            </div>
          </div>
          
          <!-- Additional Monthly Deep Dive Charts (if needed) -->
          <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
            <section class="bg-white p-6 rounded-2xl shadow-md border border-slate-200">
              <h3 class="text-xl font-bold text-slate-800 mb-4">Monthly MRR Breakdown</h3>
              <div class="grid grid-cols-2 gap-4 text-center">
                <div class="p-4 bg-blue-50 rounded-lg">
                  <p class="text-sm text-slate-600">Expansion</p>
                  <p class="text-lg font-bold text-green-600">{{ formatCurrency(singleMonthKpis.expansion) }}</p>
                </div>
                <div class="p-4 bg-blue-50 rounded-lg">
                  <p class="text-sm text-slate-600">Churn</p>
                  <p class="text-lg font-bold text-red-600">{{ formatCurrency(singleMonthKpis.churnAmount) }}</p>
                </div>
                <div class="p-4 bg-blue-50 rounded-lg col-span-2">
                  <p class="text-sm text-slate-600">Contraction</p>
                  <p class="text-lg font-bold text-orange-600">{{ formatCurrency(singleMonthKpis.contraction) }}</p>
                </div>
              </div>
            </section>
            <section class="bg-white p-6 rounded-2xl shadow-md border border-slate-200">
              <h3 class="text-xl font-bold text-slate-800 mb-4">Monthly Client Acquisition</h3>
              <div class="grid grid-cols-2 gap-4 text-center">
                <div class="p-4 bg-blue-50 rounded-lg">
                  <p class="text-sm text-slate-600">Organic</p>
                  <p class="text-lg font-bold text-blue-600">{{ singleMonthKpis.newClientsOrganic }}</p>
                </div>
                <div class="p-4 bg-blue-50 rounded-lg">
                  <p class="text-sm text-slate-600">Partner</p>
                  <p class="text-lg font-bold text-violet-600">{{ singleMonthKpis.newClientsBusinessPartner }}</p>
                </div>
              </div>
            </section>
          </div>
        </section>
        
        <!-- Annual Performance Section (Charts) -->
        <div v-else class="space-y-12">
          <section class="bg-white p-6 rounded-2xl shadow-md border border-slate-200">
            <h2 class="text-xl font-bold text-slate-800 mb-4">Business Health Trend (NRR, GRR, Churn Rate)</h2>
            <div class="h-[350px]">
              <BusinessHealthTrendChart :chart-data="filteredData" />
            </div>
          </section>
          
          <section class="bg-white p-6 rounded-2xl shadow-md border border-slate-200">
            <h2 class="text-xl font-bold text-slate-800 mb-4">Profitability: Actual vs. Target</h2>
            <div class="h-[350px]">
              <ProfitabilityChart :chart-data="filteredData" />
            </div>
          </section>
          
          <section class="bg-white p-6 rounded-2xl shadow-md border border-slate-200">
            <h2 class="text-xl font-bold text-slate-800 mb-4">MRR Movement Analysis</h2>
            <div class="h-[450px]">
              <MRRMovementChart :chart-data="filteredData" />
            </div>
          </section>
          
          <section class="bg-white p-6 rounded-2xl shadow-md border border-slate-200">
            <h2 class="text-xl font-bold text-slate-800 mb-4">New Client Acquisition Mix</h2>
            <div class="h-[350px]">
              <AcquisitionMixChart :chart-data="filteredData" />
            </div>
          </section>
        </div>
      </div>
    </div>
  </div>
</template>
