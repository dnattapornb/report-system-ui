<script setup lang="ts">
import { computed } from 'vue';
import { Bar } from 'vue-chartjs';
import { Chart as ChartJS, Title, Tooltip, Legend, BarElement, CategoryScale, LinearScale, type ChartOptions, LineElement, PointElement } from 'chart.js';
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
    currency: 'THB',
    maximumFractionDigits: 0,
  }).format(val);
};

const profitChartData = computed(() => {
  const labels = props.chartData.map(d => d.label);
  const revenueActual = props.chartData.map(d => d.revenueActual);
  const revenueTarget = props.chartData.map(d => d.revenueTarget);
  
  return {
    labels,
    datasets: [
      {
        type: 'bar' as const,
        label: 'Actual Revenue',
        data: revenueActual,
        backgroundColor: 'rgba(14, 165, 233, 0.7)', // Sky Blue
        borderRadius: 6,
        order: 2,
      },
      {
        type: 'line' as const,
        label: 'Target Revenue',
        data: revenueTarget,
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
      formatter: (value: number) => formatCurrency(value, true),
      color: '#64748b',
      anchor: 'end',
      align: 'top',
    },
  },
  scales: {
    y: {
      beginAtZero: true,
      title: {
        display: true,
        text: 'Profit',
      },
      ticks: {
        callback: function(value) {
          return formatCurrency(value as number, true);
        }
      }
    },
  },
};
</script>

<template>
  <Bar :data="profitChartData" :options="chartOptions" />
</template>
