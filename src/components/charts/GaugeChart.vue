<script setup lang="ts">
import { computed } from 'vue';
import { Doughnut } from 'vue-chartjs';
import {
  Chart as ChartJS,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  type ChartOptions,
} from 'chart.js';
import ChartDataLabels from 'chartjs-plugin-datalabels';
import { formatCurrency } from '../../utils/formatters';

ChartJS.register(Title, Tooltip, Legend, ArcElement, ChartDataLabels);

const props = withDefaults(defineProps<{
  value: number;
  max: number;
  label: string;
  showMinMaxLabels?: boolean;
  color?: string;
}>(), {
  color: '#3b82f6', // default color to blue
});

const percentage = computed(() => {
  if (!props.value || !props.max || props.max === 0) return 0;
  return (props.value / props.max) * 100;
});

const chartData = computed(() => {
  const value = Math.min(Math.max(percentage.value, 0), 100);
  return {
    datasets: [
      {
        data: [value, 100 - value],
        backgroundColor: [
          props.color,
          '#e5e7eb',
        ],
        borderWidth: 0,
        circumference: 180,
        rotation: 270,
      },
    ],
  };
});

const chartOptions = computed((): ChartOptions<'doughnut'> => ({
  responsive: true,
  maintainAspectRatio: true,
  aspectRatio: 2,
  rotation: -90,
  circumference: 180,
  cutout: '75%',
  plugins: {
    legend: { display: false },
    tooltip: { enabled: false },
    datalabels: {
      formatter: () => '',
    },
  },
}));

</script>

<template>
  <div class="relative w-full h-full">
    <Doughnut :data="chartData" :options="chartOptions" />
    <div class="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
      <span class="text-2xl font-black text-slate-800">
        {{ percentage.toFixed(1) }}%
      </span>
      <span class="text-xs font-bold text-slate-500 uppercase tracking-wider mt-1">
        {{ label }}
      </span>
    </div>
    <div v-if="showMinMaxLabels" class="absolute bottom-0 w-full flex justify-between text-[10px] text-slate-400 px-2 py-2">
      <span class="font-bold text-slate-600">{{ formatCurrency(value, true) }}</span>
      <span>{{ formatCurrency(max, true) }}</span>
    </div>
  </div>
</template>
