<script setup lang="ts">
import { computed } from 'vue';
import type { ReportMetricItem } from '../types/report';
import { formatCurrency } from '../utils/formatters';
import GaugeChart from './charts/GaugeChart.vue';
import GaugeChartECharts from './charts/GaugeChartECharts.vue';
import CMPayComboChart from './charts/CMPayComboChart.vue';
import CMPayComparisonChart from './charts/CMPayComparisonChart.vue';

const props = defineProps<{
  chartData: ReportMetricItem[];
}>();

const periodTotals = computed(() => {
  if (!props.chartData || props.chartData.length === 0) {
    return {
      totalChargeTarget: 0,
      totalProfitActual: 0,
      totalProfitTarget: 0,
      totalChargeActual: 0,
      allUserCount: 0,
      activeUserCount: 0,
    };
  }
  
  const now = new Date();
  const currentActualYear = now.getFullYear().toString();
  const currentMonth = now.getMonth();
  
  const calculateYearlyTotals = (year: string, month: number) => {
    const monthsData = props.chartData;
    if (!monthsData) return null;
    
    const totals = {
      cmpayProfitTarget: 0,
      cmpayProfitActual: 0,
      cmpayChargeTarget: 0,
      cmpayChargeActual: 0,
      cmpayAllUserCount: 0,
      cmpayActiveUserCount: 0,
    };
    
    props.chartData.forEach((data) => {
      const itemYear = parseInt(data.year);
      const itemMonth = parseInt(data.month);
      const isWithinYear = itemYear < parseInt(year);
      const isSameYearAndValidMonth = (itemYear === parseInt(year)) && (itemMonth <= month);
      
      if (isWithinYear || isSameYearAndValidMonth) {
        totals.cmpayProfitTarget += data.cmpayProfitTarget;
        totals.cmpayProfitActual += data.cmpayProfitActual;
        totals.cmpayChargeTarget += data.cmpayChargeTarget;
        totals.cmpayChargeActual += data.cmpayChargeActual;
      }
      
      if ((itemYear === parseInt(year)) && (itemMonth === month)) {
        totals.cmpayAllUserCount = data.cmpayAllUserCount;
        totals.cmpayActiveUserCount = data.cmpayActiveUserCount;
      }
    });
    
    return {
      ...totals,
    };
  };
  
  const actualData = calculateYearlyTotals(currentActualYear, currentMonth);
  const fullYearData = calculateYearlyTotals(currentActualYear, 12);
  
  return {
    totalProfitTarget: fullYearData.cmpayProfitTarget,
    totalProfitActual: actualData.cmpayProfitActual,
    totalChargeTarget: fullYearData.cmpayChargeTarget,
    totalChargeActual: actualData.cmpayChargeActual,
    allUserCount: actualData.cmpayAllUserCount,
    activeUserCount: actualData.cmpayActiveUserCount,
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
          <p class="text-sm font-bold text-slate-500 uppercase mb-1">Total Profit</p>
          <h4 class="text-2xl font-black text-blue-600 mb-2">{{ formatCurrency(periodTotals.totalProfitActual) }}</h4>
          <p class="text-[10px] text-slate-400 mt-1">Total Charge {{ formatCurrency(periodTotals.totalChargeActual) }}</p>
        </div>
        <div class="bg-slate-50 p-4 rounded-xl border border-slate-100 text-center">
          <p class="text-sm font-bold text-slate-500 uppercase mb-1">Active Users</p>
          <p class="text-2xl font-black text-emerald-600 mb-2">{{ periodTotals.activeUserCount }}</p>
          <p class="text-[10px] text-slate-400 mt-1">{{ periodTotals.activeUserCount }} / {{ periodTotals.allUserCount }} Users</p>
        </div>
      </div>
      
      <!-- Gauges -->
      <div class="grid grid-cols-2 gap-4">
        <div class="bg-white p-4 border border-slate-100 text-center">
          <h4 class="text-xs font-bold mb-2">Profit vs Target</h4>
          <GaugeChartECharts
            :value="periodTotals.totalProfitActual"
            :max="periodTotals.totalProfitTarget"
            :show-min-max-labels="true"
            label="Profit"
          />
        </div>
        <div class="bg-white p-4 border border-slate-100 text-center">
          <h4 class="text-xs font-bold mb-2">Charge vs Target</h4>
          <GaugeChartECharts
            :value="periodTotals.totalChargeActual"
            :max="periodTotals.totalChargeTarget"
            :show-min-max-labels="true"
            label="Charge"
            color="#7f22fe"
          />
        </div>
      </div>
    </div>
    
    <!-- Bottom Section: Combo Chart -->
    <div class="flex-grow bg-white p-6 border border-slate-100 overflow-hidden">
      <h3 class="text-lg font-bold text-slate-700 mb-4">CM Pay Trend</h3>
      <div class="grid grid-cols-2 gap-2">
        <div class="h-[300px]">
          <CMPayComboChart :chart-data="chartData" />
        </div>
        <div class="h-[300px]">
          <CMPayComparisonChart :chart-data="chartData" :metric-type="'profit'" />
        </div>
      </div>
    </div>
  </div>
</template>
