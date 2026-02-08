<script setup lang="ts">
import { computed } from 'vue';
import { Pie } from 'vue-chartjs';
import {
  Chart as ChartJS,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  type ChartOptions,
} from 'chart.js';
import ChartDataLabels from 'chartjs-plugin-datalabels';
import type { DistributionItem } from '../../types/report';
import { formatNumber } from '../../utils/formatters.ts';

ChartJS.register(Title, Tooltip, Legend, ArcElement, ChartDataLabels);

const props = defineProps<{
  title: string;
  distributionData: DistributionItem;
}>();

const chartColors = [
  '#3b82f6', '#10b981', '#f97316', '#8b5cf6', '#ef4444',
  '#facc15', '#22d3ee', '#a855f7', '#ec4899', '#64748b',
  '#94a3b8', '#cbd5e1', '#e2e8f0',
];

const legendItems = computed(() => {
  return Object.entries(props.distributionData).map(([label, value], index) => ({
    label,
    value,
    color: chartColors[index % chartColors.length],
  }));
});

const chartData = computed(() => {
  const labels = Object.keys(props.distributionData);
  const data = Object.values(props.distributionData);
  
  return {
    labels,
    datasets: [
      {
        data,
        backgroundColor: chartColors,
        borderWidth: 0,
        hoverOffset: 8,
      },
    ],
  };
});

const chartOptions: ChartOptions<'pie'> = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      display: false,
      position: 'right',
      labels: {
        boxWidth: 12,
        padding: 15,
        font: { size: 10 },
      },
    },
    title: {
      display: false,
      text: props.title,
      position: 'top',
      align: 'start',
      font: {
        size: 16,
        weight: 'bold',
      },
      padding: {
        bottom: 16,
      },
    },
    datalabels: {
      color: '#fff',
      font: { weight: 'bold', size: 12 },
      formatter: (value, ctx) => {
        const datasets = ctx.chart.data.datasets;
        // Safety check
        if (datasets.indexOf(ctx.dataset) === -1) return '';
        
        const dataArr = datasets[0].data;
        const sum = dataArr.reduce((a, b) => Number(a) + Number(b), 0);
        const percentageValue = (value * 100) / sum;
        
        if (percentageValue < 5) {
          return '';
        }
        
        return percentageValue.toFixed(1) + '%';
      },
    },
  },
  layout: {
    padding: 20,
  },
};
</script>

<template>
  <div class="flex flex-col h-full">
    <h3 class="text-left text-md font-bold text-slate-500 uppercase tracking-widest mb-4">{{ title }}</h3>
    
    <div class="flex-1 flex flex-row items-center gap-4 min-h-0">
      <div class="flex-1 h-full relative min-w-0">
        <Pie :data="chartData" :options="chartOptions" />
      </div>
      
      <div class="w-1/3 h-full overflow-y-auto custom-scrollbar pr-2">
        <ul class="space-y-2">
          <li v-for="item in legendItems" :key="item.label" class="flex items-center justify-between text-xs">
            <div class="flex items-center gap-2 overflow-hidden">
              <span class="w-3 h-3 rounded-full flex-shrink-0" :style="{ backgroundColor: item.color }"></span>
              <span class="truncate text-slate-600 font-medium">{{ item.label }}</span>
            </div>
            <p class="font-bold text-slate-700 bg-slate-100 px-1.5 py-0.5 rounded text-[10px]">
              {{ formatNumber(item.value || 0) }}
            </p>
          </li>
        </ul>
      </div>
    </div>
  </div>
</template>

<style scoped lang="css">
.custom-scrollbar::-webkit-scrollbar {
  width: 4px;
}

.custom-scrollbar::-webkit-scrollbar-thumb {
  background-color: #cbd5e1;
  border-radius: 4px;
}
</style>
