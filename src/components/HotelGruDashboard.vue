<script setup lang="ts">
import { computed } from 'vue';
import type { SaaSMetricItem } from '../types/report';
import { formatCurrency } from '../utils/formatters';
import GaugeChart from './charts/GaugeChart.vue';
import HotelGruComboChart from './charts/HotelGruComboChart.vue';

const props = defineProps<{
  chartData: SaaSMetricItem[];
}>();

// Calculate totals for the selected period
const periodTotals = computed(() => {
  if (!props.chartData || props.chartData.length === 0) {
    return {
      totalCommission: 0,
      totalCommissionTarget: 0,
      totalHotels: 0,
    };
  }
  
  const lastMonthWithHotels = [...props.chartData].reverse().find(m => m.hotelgruHotelCount > 0);
  
  const totals = props.chartData.reduce((acc, month) => {
    acc.totalCommission += month.hotelgruCommissionActual;
    acc.totalCommissionTarget += month.hotelgruCommissionTarget;
    return acc;
  }, {
    totalCommission: 0,
    totalCommissionTarget: 0,
  });
  
  return {
    ...totals,
    totalHotels: lastMonthWithHotels ? lastMonthWithHotels.hotelgruHotelCount : 0,
  };
});
</script>

<template>
  <div class="flex flex-col space-y-6">
    <!-- Top Section: KPIs & Gauges -->
    <div class="flex flex-col space-y-6">
      <!-- KPIs -->
      <div class="grid grid-cols-2 gap-4">
        <div class="bg-slate-50 p-4 rounded-xl border border-slate-100 text-center">
          <p class="text-sm font-bold text-slate-500 uppercase">Total Commission</p>
          <p class="text-2xl font-black text-blue-600">{{ formatCurrency(periodTotals.totalCommission) }}</p>
        </div>
        <div class="bg-slate-50 p-4 rounded-xl border border-slate-100 text-center">
          <p class="text-sm font-bold text-slate-500 uppercase">Hotels</p>
          <p class="text-2xl font-black text-emerald-600">{{ periodTotals.totalHotels }}</p>
        </div>
      </div>
      
      <!-- Gauge -->
      <div class="grid grid-cols-2">
        <div class="bg-white p-4 rounded-xl shadow-sm border border-slate-100 text-center">
          <h4 class="text-xs font-bold mb-2">Commission vs Target</h4>
          <GaugeChart
            :value="periodTotals.totalCommission"
            :max="periodTotals.totalCommissionTarget"
            label="Commission"
            :show-min-max-labels="true"
          />
        </div>
      </div>
    </div>
    
    <!-- Bottom Section: Combo Chart -->
    <div class="flex-grow bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
      <h3 class="text-lg font-bold text-slate-700 mb-4">Hotel Gru Monthly Trend</h3>
      <div class="h-[300px]">
        <HotelGruComboChart :chart-data="chartData" />
      </div>
    </div>
  </div>
</template>
