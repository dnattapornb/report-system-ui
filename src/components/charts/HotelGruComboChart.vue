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
import type { ReportMetricItem } from '../../types/report';
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
  chartData: ReportMetricItem[];
}>();

const chartData = computed(() => {
  const labels = props.chartData.map((d) => d.label);

  return {
    labels,
    datasets: [
      {
        type: 'bar' as const,
        label: 'Active Hotels',
        data: props.chartData.map((d) => d.hotelgruHotelActual),
        backgroundColor: 'rgba(16, 185, 129, 0.5)', // Light Emerald
        yAxisID: 'y1',
        borderRadius: 4,
        order: 1,
      },
      {
        type: 'line' as const,
        label: 'Actual Commission',
        data: props.chartData.map((d) => d.hotelgruCommissionActual),
        borderColor: '#3b82f6', // Blue
        backgroundColor: '#3b82f6',
        yAxisID: 'y',
        tension: 0.4,
        order: 0,
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
    datalabels: { display: false },
    tooltip: {
      callbacks: {
        label: (context) => {
          let label = context.dataset.label || '';
          if (label) label += ': ';
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
      title: { display: true, text: 'Amount (THB)' },
      ticks: { callback: (value) => formatCurrency(value as number, true) },
    },
    y1: { // Right axis for hotel count
      type: 'linear',
      display: true,
      position: 'right',
      title: { display: true, text: 'Hotels' },
      grid: { drawOnChartArea: false },
      beginAtZero: true,
    },
  },
};
</script>

<template>
  <Bar :data="chartData" :options="chartOptions" />
</template>
