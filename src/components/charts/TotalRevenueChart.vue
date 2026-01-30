<script setup lang="ts">
import { computed } from 'vue';
import { Bar } from 'vue-chartjs';
import {
  Chart as ChartJS,
  Title,
  Tooltip,
  Legend,
  BarElement,
  CategoryScale,
  LinearScale,
  type ChartOptions,
} from 'chart.js';
import ChartDataLabels from 'chartjs-plugin-datalabels';
import type { SaaSMetricItem } from '../../types/report';
import { formatCurrency } from '../../utils/formatters';

ChartJS.register(
  Title,
  Tooltip,
  Legend,
  BarElement,
  CategoryScale,
  LinearScale,
  ChartDataLabels,
);

const props = defineProps<{
  chartData: SaaSMetricItem[];
}>();

const chartData = computed(() => {
  const labels = props.chartData.map((d) => d.label);
  const revenueData = props.chartData.map((d) => d.totalRevenue);
  
  return {
    labels,
    datasets: [
      {
        label: 'Total Revenue',
        data: revenueData,
        backgroundColor: 'rgba(16, 185, 129, 0.8)', // Emerald Green
        borderRadius: 4,
        barThickness: 'flex',
        maxBarThickness: 50,
      },
    ],
  };
});

const chartOptions: ChartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    datalabels: {
      display: false, // Hide labels to keep it clean, tooltip is enough
    },
    tooltip: {
      callbacks: {
        label: (context) => {
          return `Total Revenue: ${formatCurrency(context.parsed.y)}`;
        },
      },
    },
    legend: {
      display: false, // Hide legend as there's only one dataset
    },
  },
  scales: {
    y: {
      beginAtZero: true,
      title: {
        display: true,
        text: 'Revenue',
      },
      ticks: {
        callback: (value) => formatCurrency(value as number, true), // Compact format (e.g. 1M)
      },
    },
  },
};
</script>

<template>
  <Bar :data="chartData" :options="chartOptions" />
</template>
