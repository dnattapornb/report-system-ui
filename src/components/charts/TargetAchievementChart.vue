<script setup lang="ts">
import { computed } from 'vue';
import { Bar } from 'vue-chartjs';
import {
  Chart as ChartJS,
  Title,
  Tooltip,
  Legend,
  BarElement,
  LineElement,
  PointElement,
  CategoryScale,
  LinearScale,
  type ChartOptions,
} from 'chart.js';
import ChartDataLabels from 'chartjs-plugin-datalabels';
import type { SaaSMetricItem } from '../../types/report';

ChartJS.register(
  Title,
  Tooltip,
  Legend,
  BarElement,
  LineElement,
  PointElement,
  CategoryScale,
  LinearScale,
  ChartDataLabels,
);

const props = defineProps<{
  chartData: SaaSMetricItem[];
}>();

const chartData = computed(() => {
  const labels = props.chartData.map((d) => d.label);
  const actualData = props.chartData.map((d) => d.actualHotels);
  const targetData = props.chartData.map((d) => d.targetHotels);
  
  return {
    labels,
    datasets: [
      {
        type: 'bar' as const,
        label: 'Actual Hotels',
        data: actualData,
        backgroundColor: 'rgba(59, 130, 246, 0.8)', // Blue
        borderRadius: 4,
        order: 2,
      },
      {
        type: 'line' as const,
        label: 'Target Hotels',
        data: targetData,
        borderColor: '#f97316', // Orange
        backgroundColor: '#f97316',
        borderWidth: 2,
        pointRadius: 3,
        tension: 0.1,
        order: 1,
      },
    ],
  };
});

const chartOptions: ChartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    datalabels: {
      display: false,
    },
    tooltip: {
      mode: 'index',
      intersect: false,
    },
  },
  scales: {
    y: {
      beginAtZero: true,
      title: {
        display: true,
        text: 'Number of Hotels',
      },
    },
  },
};
</script>

<template>
  <Bar :data="chartData" :options="chartOptions" />
</template>
