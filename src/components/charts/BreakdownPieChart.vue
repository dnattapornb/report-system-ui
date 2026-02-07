<script setup lang="ts">
import { computed } from 'vue';
import { Pie } from 'vue-chartjs';
import {
  Chart as ChartJS,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  type ChartOptions,
} from 'chart.js';
import ChartDataLabels from 'chartjs-plugin-datalabels';
import type { DistributionItem } from '../../types/report';

ChartJS.register(Title, Tooltip, Legend, ArcElement, ChartDataLabels);

const props = defineProps<{
  title: string;
  distributionData: DistributionItem;
}>();

const chartData = computed(() => {
  const labels = Object.keys(props.distributionData);
  const data = Object.values(props.distributionData);

  return {
    labels,
    datasets: [
      {
        data,
        backgroundColor: [
          '#3b82f6', '#10b981', '#f97316', '#8b5cf6', '#ef4444',
          '#facc15', '#22d3ee', '#a855f7', '#ec4899', '#64748b'
        ],
        borderWidth: 0,
        hoverOffset: 8,
      },
    ],
  };
});

const chartOptions: ChartOptions<'pie'> = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: 'right',
      labels: {
        boxWidth: 12,
        padding: 15,
        font: { size: 10 },
      },
    },
    title: {
      display: true,
      text: props.title,
      position: 'top',
      align: 'start',
      font: {
        size: 16,
        weight: 'bold',
      },
      padding: {
        bottom: 16,
      }
    },
    datalabels: {
      color: '#fff',
      font: { weight: 'bold', size: 10 },
      formatter: (value, ctx) => {
        const sum = ctx.chart.data.datasets[0].data.reduce((a, b) => a + b, 0);
        const percentage = ((value * 100) / sum).toFixed(1) + '%';
        return value > 0 ? percentage : '';
      },
    },
  },
};
</script>

<template>
  <Pie :data="chartData" :options="chartOptions" />
</template>
