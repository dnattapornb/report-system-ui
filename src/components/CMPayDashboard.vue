<script setup lang="ts">
import { computed } from 'vue';
import type { ReportMetricItem } from '../types/report';
import { formatCurrency } from '../utils/formatters';
import GaugeChart from './charts/GaugeChart.vue';
import CMPayComboChart from './charts/CMPayComboChart.vue';

const props = defineProps<{
  chartData: ReportMetricItem[];
}>();

// Calculate totals for the selected period
const periodTotals = computed(() => {
  if (!props.chartData || props.chartData.length === 0) {
    return {
      totalCharge: 0,
      totalChargeTarget: 0,
      totalProfit: 0,
      totalProfitTarget: 0,
      totalActiveUsers: 0,
    };
  }
  
  const lastMonthWithUsers = [...props.chartData].reverse().find(m => m.cmpayActiveUserCount > 0);
  
  const totals = props.chartData.reduce((acc, month) => {
    acc.totalCharge += month.cmpayChargeActual;
    acc.totalChargeTarget += month.cmpayChargeTarget;
    acc.totalProfit += month.cmpayProfitActual;
    acc.totalProfitTarget += month.cmpayProfitTarget;
    return acc;
  }, {
    totalCharge: 0,
    totalChargeTarget: 0,
    totalProfit: 0,
    totalProfitTarget: 0,
  });
  
  return {
    ...totals,
    totalActiveUsers: lastMonthWithUsers ? lastMonthWithUsers.cmpayActiveUserCount : 0,
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
          <p class="text-sm font-bold text-slate-500 uppercase">Total Charge</p>
          <p class="text-2xl font-black text-orange-500">{{ formatCurrency(periodTotals.totalCharge) }}</p>
        </div>
        <div class="bg-slate-50 p-4 rounded-xl border border-slate-100 text-center">
          <p class="text-sm font-bold text-slate-500 uppercase">Active Users</p>
          <p class="text-2xl font-black text-emerald-600">{{ periodTotals.totalActiveUsers }}</p>
        </div>
      </div>
      
      <!-- Gauges -->
      <div class="grid grid-cols-2 gap-4">
        <div class="bg-white p-4 rounded-xl shadow-sm border border-slate-100 text-center">
          <h4 class="text-xs font-bold mb-2">Charge vs Target</h4>
          <GaugeChart
            :value="periodTotals.totalCharge"
            :max="periodTotals.totalChargeTarget"
            label="Charge"
            :show-min-max-labels="true"
          />
        </div>
        <div class="bg-white p-4 rounded-xl shadow-sm border border-slate-100 text-center">
          <h4 class="text-xs font-bold mb-2">Profit vs Target</h4>
          <GaugeChart
            :value="periodTotals.totalProfit"
            :max="periodTotals.totalProfitTarget"
            label="Profit"
            :show-min-max-labels="true"
          />
        </div>
      </div>
    </div>
    
    <!-- Bottom Section: Combo Chart -->
    <div class="flex-grow bg-white p-6 rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
      <h3 class="text-lg font-bold text-slate-700 mb-4">CM Pay Monthly Trend</h3>
      <div class="h-[300px]">
        <CMPayComboChart :chart-data="chartData" />
      </div>
    </div>
  </div>
</template>
