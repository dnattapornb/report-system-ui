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
  
  return {
    labels,
    datasets: [
      {
        label: 'Free Trial',
        data: props.chartData.map((d) => d.clientsFreeTrial),
        backgroundColor: '#facc15', // Yellow
        stack: 'stack0',
      },
      {
        label: 'Pending Setup',
        data: props.chartData.map((d) => d.clientsPendingSetup),
        backgroundColor: '#fb923c', // Orange
        stack: 'stack0',
      },
      {
        label: 'Drop Out',
        data: props.chartData.map((d) => -d.clientsDropOut), // Negative for visual distinction
        backgroundColor: '#ef4444', // Red
        stack: 'stack0',
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
    x: {
      stacked: true,
    },
    y: {
      stacked: true,
      beginAtZero: true,
      title: {
        display: true,
        text: 'Number of Clients',
      },
    },
  },
};
</script>

<template>
  <Bar :data="chartData" :options="chartOptions" />
</template>
