<script setup lang="ts">
import { computed } from 'vue';
import { Line } from 'vue-chartjs';
import { Chart as ChartJS, Title, Tooltip, Legend, LineElement, PointElement, CategoryScale, LinearScale, type ChartOptions } from 'chart.js'; // ✨ เพิ่ม type
import ChartDataLabels from 'chartjs-plugin-datalabels';
import type { SaaSMetricItem } from '../../types/report'; // Adjust path

ChartJS.register(Title, Tooltip, Legend, LineElement, PointElement, CategoryScale, LinearScale, ChartDataLabels);

const props = defineProps<{
  chartData: SaaSMetricItem[];
}>();

const healthTrendChartData = computed(() => {
  const labels = props.chartData.map(d => d.label);
  const nrrData = props.chartData.map(d => d.nrrPercent);
  const grrData = props.chartData.map(d => d.grrPercent);
  const churnRateData = props.chartData.map(d => d.churnRatePercent);
  
  return {
    labels,
    datasets: [
      {
        label: 'NRR %',
        data: nrrData,
        borderColor: '#3b82f6', // Blue
        backgroundColor: '#3b82f6',
        tension: 0.4,
        yAxisID: 'y',
      },
      {
        label: 'GRR %',
        data: grrData,
        borderColor: '#16a34a', // Green
        backgroundColor: '#16a34a',
        tension: 0.4,
        yAxisID: 'y',
      },
      {
        label: 'Churn Rate %',
        data: churnRateData,
        borderColor: '#ef4444', // Red
        backgroundColor: '#ef4444',
        tension: 0.4,
        yAxisID: 'y',
      },
    ],
  };
});

const chartOptions: ChartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    datalabels: {
      display: false, // Hide datalabels for line chart by default
    },
  },
  scales: {
    y: {
      beginAtZero: true,
      min: 0,
      max: 160,
      ticks: {
        stepSize: 20,
        callback: function(value) {
          return value + '%';
        },
      },
      title: {
        display: true,
        text: 'Percentage (%)',
      },
    },
  },
};
</script>

<template>
  <Line :data="healthTrendChartData" :options="chartOptions" />
</template>
