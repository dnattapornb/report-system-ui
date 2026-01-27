<script setup lang="ts">
import { computed } from 'vue';
import { Bar } from 'vue-chartjs';
import { Chart as ChartJS, Title, Tooltip, Legend, BarElement, CategoryScale, LinearScale, ChartOptions } from 'chart.js';
import ChartDataLabels from 'chartjs-plugin-datalabels';
import type { SaaSMetricItem } from '../../types/report'; // Adjust path

ChartJS.register(Title, Tooltip, Legend, BarElement, CategoryScale, LinearScale, ChartDataLabels);

const props = defineProps<{
  chartData: SaaSMetricItem[];
}>();

const acquisitionChartData = computed(() => {
  const labels = props.chartData.map(d => d.label);
  
  return {
    labels,
    datasets: [
      {
        label: 'Organic Sales',
        data: props.chartData.map(d => d.newClientsOrganic),
        backgroundColor: '#3b82f6', // Blue
      },
      {
        label: 'Business Partner',
        data: props.chartData.map(d => d.newClientsBusinessPartner),
        backgroundColor: '#8b5cf6', // Violet
      },
    ],
  };
});

const chartOptions: ChartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    datalabels: {
      formatter: (value: number) => value.toString(),
      color: '#fff', // White text for stacked bars
      font: { weight: 'bold' },
    },
  },
  scales: {
    x: { stacked: true },
    y: { stacked: true, beginAtZero: true, title: { display: true, text: 'Number of Clients' } },
  },
};
</script>

<template>
  <Bar :data="acquisitionChartData" :options="chartOptions" />
</template>
