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
  metricType: 'charge' | 'profit';
}>();

const chartData = computed(() => {
  const labels = props.chartData.map((d) => d.label);
  
  const isCharge = props.metricType === 'charge';
  
  const actualData = isCharge
    ? props.chartData.map((d) => d.cmpayChargeActual)
    : props.chartData.map((d) => d.cmpayProfitActual);
  
  const targetData = isCharge
    ? props.chartData.map((d) => d.cmpayChargeTarget)
    : props.chartData.map((d) => d.cmpayProfitTarget);
  
  return {
    labels,
    datasets: [
      {
        type: 'bar' as const,
        label: `Actual ${isCharge ? 'Charge' : 'Profit'}`,
        data: actualData,
        backgroundColor: isCharge ? 'rgba(139, 92, 246, 0.7)' : 'rgba(14, 165, 233, 0.7)', // Violet for Charge, Sky for Profit
        borderRadius: 4,
        order: 2,
      },
      {
        type: 'line' as const,
        label: `Target ${isCharge ? 'Charge' : 'Profit'}`,
        data: targetData,
        borderColor: '#f97316', // Orange for Target
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
        text: 'Amount (THB)',
      },
      ticks: {
        callback: (value) => formatCurrency(value as number, true),
      },
    },
  },
};
</script>

<template>
  <Bar :data="chartData" :options="chartOptions" />
</template>
