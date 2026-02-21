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

const periodTotals = computed(() => {
  if (!props.chartData || props.chartData.length === 0) {
    return {
      totalCommissionActual: 0,
      totalCommissionTarget: 0,
      hotelTarget: 0,
      hotelActual: 0,
    };
  }
  
  const now = new Date();
  const currentActualYear = now.getFullYear().toString();
  const currentMonth = now.getMonth();
  
  const calculateYearlyTotals = (year: string, month: number) => {
    const monthsData = props.chartData;
    if (!monthsData) return null;
    
    const totals = {
      hotelgruCommissionTarget: 0,
      hotelgruCommissionActual: 0,
      hotelgruHotelTarget: 0,
      hotelgruHotelActual: 0,
    };
    
    props.chartData.forEach((data) => {
      const itemYear = parseInt(data.year);
      const itemMonth = parseInt(data.month);
      const isWithinYear = itemYear < parseInt(year);
      const isSameYearAndValidMonth = (itemYear === parseInt(year)) && (itemMonth <= month);
      
      if (isWithinYear || isSameYearAndValidMonth) {
        totals.hotelgruCommissionTarget += data.hotelgruCommissionTarget;
        totals.hotelgruCommissionActual += data.hotelgruCommissionActual;
      }
      
      if ((itemYear === parseInt(year)) && (itemMonth === month)) {
        totals.hotelgruHotelTarget = data.hotelgruHotelTarget;
        totals.hotelgruHotelActual = data.hotelgruHotelActual;
      }
    });
    
    return {
      ...totals,
    };
  };
  
  const actualData = calculateYearlyTotals(currentActualYear, currentMonth);
  const fullYearData = calculateYearlyTotals(currentActualYear, 12);
  
  return {
    totalCommissionTarget: fullYearData.hotelgruCommissionTarget,
    totalCommissionActual: actualData.hotelgruCommissionActual,
    hotelTargetCount: fullYearData.hotelgruHotelTarget,
    hotelActualCount: actualData.hotelgruHotelActual,
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
          <h4 class="text-2xl font-black text-blue-600 mb-2">{{ formatCurrency(periodTotals.totalCommissionActual) }}</h4>
          <p class="text-[10px] text-slate-400 mt-1">Target Commission {{ formatCurrency(periodTotals.totalCommissionTarget) }}</p>
        </div>
        <div class="bg-slate-50 p-4 rounded-xl border border-slate-100 text-center">
          <p class="text-sm font-bold text-slate-500 uppercase mb-1">Active Hotels</p>
          <h4 class="text-2xl font-black text-emerald-600 mb-2">{{ periodTotals.hotelActualCount }}</h4>
          <p class="text-[10px] text-slate-400 mt-1">{{ periodTotals.hotelActualCount }} / {{ periodTotals.hotelTargetCount }} Hotels</p>
        </div>
      </div>
      
      <!-- Gauge -->
      <div class="grid grid-cols-2">
        <div class="bg-white p-4 border border-slate-100 text-center">
          <h4 class="text-xs font-bold mb-2">Commission vs Target</h4>
          <GaugeChartECharts
            :value="periodTotals.totalCommissionActual"
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
