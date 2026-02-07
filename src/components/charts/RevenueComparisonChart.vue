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
        label: 'Actual Revenue',
        data: props.chartData.map((d) => d.revenueActual),
        backgroundColor: 'rgba(14, 165, 233, 0.7)', // Sky Blue
        borderRadius: 6,
        order: 2,
      },
      {
        type: 'line' as const,
        label: 'Target Revenue',
        data: props.chartData.map((d) => d.revenueTarget),
        borderColor: '#f97316', // Orange
        backgroundColor: '#f97316',
        pointRadius: 4,
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
      enabled: true,
      mode: 'index',
      intersect: false,
      callbacks: {
        label: (context) => {
          let label = context.dataset.label || '';
          if (label) {
            label += ': ';
          }
          label += formatCurrency(context.parsed.y);
          return label;
        },
      },
    },
  },
  scales: {
    y: {
      beginAtZero: true,
      title: {
        display: true,
        text: 'Revenue (THB)',
      },
      ticks: {
        callback: function(value) {
          return formatCurrency(value as number, true);
        },
      },
    },
  },
};
</script>

<template>
  <Bar :data="chartData" :options="chartOptions" />
</template>
