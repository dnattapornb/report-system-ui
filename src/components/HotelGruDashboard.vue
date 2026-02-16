<script setup lang="ts">
import { computed } from 'vue';
import type { ReportMetricItem } from '../types/report';
import { formatCurrency } from '../utils/formatters';
import GaugeChart from './charts/GaugeChart.vue';
import GaugeChartECharts from './charts/GaugeChartECharts.vue';
import HotelGruComboChart from './charts/HotelGruComboChart.vue';
import HotelGruComparisonChart from './charts/HotelGruComparisonChart.vue';
import HotelGruActiveHotelVsChurnChart from './charts/HotelGruActiveHotelVsChurnChart.vue';

const props = defineProps<{
  chartData: ReportMetricItem[];
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
  
  const lastMonthWithHotels = [...props.chartData].reverse().find(m => m.hotelgruHotelActual > 0);
  
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
    totalHotels: lastMonthWithHotels ? lastMonthWithHotels.hotelgruHotelActual : 0,
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
          <p class="text-sm font-bold text-slate-500 uppercase mb-1">Total Commission</p>
          <h4 class="text-2xl font-black text-blue-600 mb-2">{{ formatCurrency(periodTotals.totalCommission) }}</h4>
          <p class="text-[10px] text-slate-400 mt-1"></p>
        </div>
        <div class="bg-slate-50 p-4 rounded-xl border border-slate-100 text-center">
          <p class="text-sm font-bold text-slate-500 uppercase mb-1">Active Hotels</p>
          <h4 class="text-2xl font-black text-emerald-600 mb-2">{{ periodTotals.totalHotels }}</h4>
          <p class="text-[10px] text-slate-400 mt-1">Overview</p>
        </div>
      </div>
      
      <!-- Gauge -->
      <div class="grid grid-cols-2">
        <div class="bg-white p-4 border border-slate-100 text-center">
          <h4 class="text-xs font-bold mb-2">Commission vs Target</h4>
          <GaugeChartECharts
            :value="periodTotals.totalCommission"
            :max="periodTotals.totalCommissionTarget"
            :show-min-max-labels="true"
            label="Commission"
            color="#ef4444"
          />
        </div>
      </div>
    </div>
    
    <!-- Bottom Section: Combo Chart -->
    <div class="flex-grow bg-white p-6 border border-slate-100">
      <h3 class="text-lg font-bold text-slate-700 mb-4">Hotel Gru Trend</h3>
      <div class="grid grid-cols-2 gap-2">
        <div class="h-[300px]">
          <!--<HotelGruComboChart :chart-data="chartData" />-->
          <HotelGruActiveHotelVsChurnChart :chart-data="chartData" />
        </div>
        <div class="h-[300px]">
          <HotelGruComparisonChart :chart-data="chartData" />
        </div>
      </div>
    </div>
  </div>
</template>
