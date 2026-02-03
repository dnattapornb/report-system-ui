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
import { formatCurrency } from '../../utils/formatters';

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
  
  return {
    labels,
    datasets: [
      {
        type: 'bar' as const,
        label: 'Active Users',
        data: props.chartData.map((d) => d.cmpayActiveUserCount),
        backgroundColor: 'rgba(16, 185, 129, 0.5)', // Light Emerald
        yAxisID: 'y1', // Use the right axis for user count
        order: 2,
      },
      {
        type: 'line' as const,
        label: 'Actual Profit',
        data: props.chartData.map((d) => d.cmpayProfitActual),
        borderColor: '#3b82f6', // Blue
        backgroundColor: '#3b82f6',
        yAxisID: 'y', // Use the left axis for currency
        tension: 0.4,
        order: 0,
      },
      {
        type: 'line' as const,
        label: 'Actual Charge',
        data: props.chartData.map((d) => d.cmpayChargeActual),
        borderColor: '#f97316', // Orange
        backgroundColor: '#f97316',
        yAxisID: 'y', // Use the left axis for currency
        tension: 0.4,
        order: 1,
      },
    ],
  };
});

const chartOptions: ChartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  interaction: {
    mode: 'index',
    intersect: false,
  },
  plugins: {
    datalabels: {
      display: false,
    },
    tooltip: {
      callbacks: {
        label: (context) => {
          let label = context.dataset.label || '';
          if (label) {
            label += ': ';
          }
          if (context.dataset.yAxisID === 'y') {
            label += formatCurrency(context.parsed.y);
          } else {
            label += context.parsed.y;
          }
          return label;
        },
      },
    },
  },
  scales: {
    y: { // Left axis for currency
      type: 'linear',
      display: true,
      position: 'left',
      title: {
        display: true,
        text: 'Amount (THB)',
      },
      ticks: {
        callback: (value) => formatCurrency(value as number, true),
      },
    },
    y1: { // Right axis for user count
      type: 'linear',
      display: true,
      position: 'right',
      title: {
        display: true,
        text: 'Active Users',
      },
      grid: {
        drawOnChartArea: false, // only draw grid lines for the main axis
      },
      beginAtZero: true,
    },
  },
};
</script>

<template>
  <Bar :data="chartData" :options="chartOptions" />
</template>
