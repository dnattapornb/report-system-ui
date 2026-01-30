<script setup lang="ts">
import { computed } from 'vue';
import { Bar } from 'vue-chartjs';
import { Chart as ChartJS, Title, Tooltip, Legend, BarElement, CategoryScale, LinearScale, type ChartOptions, LineElement, PointElement } from 'chart.js'; // ✨ เพิ่ม type
import ChartDataLabels from 'chartjs-plugin-datalabels';
import type { SaaSMetricItem } from '../../types/report'; // Adjust path

ChartJS.register(Title, Tooltip, Legend, BarElement, CategoryScale, LinearScale, LineElement, PointElement, ChartDataLabels);

const props = defineProps<{
  chartData: SaaSMetricItem[];
}>();

const formatCurrency = (val: number, compact = false) => {
  if (compact) {
    return new Intl.NumberFormat('en-US', {
      notation: 'compact',
      compactDisplay: 'short',
      maximumFractionDigits: 1,
    }).format(val);
  }
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(val);
};

const mrrMovementChartData = computed(() => {
  const labels = props.chartData.map(d => d.label);
  
  return {
    labels,
    datasets: [
      {
        type: 'line' as const,
        label: 'Total MRR',
        data: props.chartData.map(d => d.mrr),
        borderColor: '#4f46e5', // Indigo
        yAxisID: 'y',
        order: 0,
      },
      {
        type: 'bar' as const,
        label: 'Expansion',
        data: props.chartData.map(d => d.expansion),
        backgroundColor: '#22c55e', // Green
        yAxisID: 'y1',
        stack: 'stack0',
      },
      {
        type: 'bar' as const,
        label: 'Churn',
        data: props.chartData.map(d => -d.churnAmount), // Negative for visual stacking
        backgroundColor: '#ef4444', // Red
        yAxisID: 'y1',
        stack: 'stack0',
      },
      {
        type: 'bar' as const,
        label: 'Contraction',
        data: props.chartData.map(d => -d.contraction), // Negative for visual stacking
        backgroundColor: '#f97316', // Orange
        yAxisID: 'y1',
        stack: 'stack0',
      },
    ],
  };
});

const chartOptions: ChartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  interaction: { mode: 'index', intersect: false },
  plugins: {
    datalabels: {
      display: false, // Hide datalabels for this complex chart by default
    },
  },
  scales: {
    y: {
      type: 'linear',
      display: true,
      position: 'left',
      title: { display: true, text: 'Total MRR' },
      ticks: { callback: (value) => formatCurrency(value as number, true) }
    },
    y1: {
      type: 'linear',
      display: true,
      position: 'right',
      title: { display: true, text: 'MRR Change' },
      grid: { drawOnChartArea: false },
      ticks: { callback: (value) => formatCurrency(value as number, true) }
    },
  },
};
</script>

<template>
  <Bar :data="mrrMovementChartData" :options="chartOptions" />
</template>
