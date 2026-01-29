<script setup lang="ts">
import { computed } from 'vue';
import { Pie } from 'vue-chartjs';
import {
  Chart as ChartJS,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  CategoryScale,
  ChartOptions,
} from 'chart.js';
import ChartDataLabels from 'chartjs-plugin-datalabels';

ChartJS.register(Title, Tooltip, Legend, ArcElement, CategoryScale, ChartDataLabels);

const props = defineProps<{
  actual: number;
  pending: number;
  dropOut: number;
}>();

const chartData = computed(() => {
  return {
    labels: ['Live Hotels', 'Pending Setup', 'Drop Out'],
    datasets: [
      {
        data: [props.actual, props.pending, props.dropOut],
        backgroundColor: [
          '#10b981', // Live (Emerald)
          '#f59e0b', // Pending (Amber)
          '#ef4444', // Drop Out (Red)
        ],
        borderWidth: 0,
        hoverOffset: 10,
      },
    ],
  };
});

const chartOptions: ChartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: 'bottom',
      labels: { usePointStyle: true, padding: 20 },
    },
    datalabels: {
      color: '#fff',
      font: { weight: 'bold', size: 12 },
      formatter: (value, ctx) => {
        const sum = ctx.chart.data.datasets[0].data.reduce((a: any, b: any) => a + b, 0);
        const percentage = ((value * 100) / sum).toFixed(1) + '%';
        return value > 0 ? percentage : '';
      },
    },
  },
};
</script>

<template>
  <Pie :data="chartData" :options="chartOptions" />
</template>
