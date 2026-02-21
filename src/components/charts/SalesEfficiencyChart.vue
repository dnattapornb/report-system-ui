<script setup lang="ts">
import { computed } from 'vue';
import { Line } from 'vue-chartjs';
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
  
  // Calculate Avg Sales per Rep: (Organic + Partner) / Total Reps
  const efficiencyData = props.chartData.map((d) => {
    const totalNewClients = d.clientNewOrganicCount + d.clientNewPartnerCount;
    return d.salesRepCount > 0 ? totalNewClients / d.salesRepCount : 0;
  });
  
  return {
    labels,
    datasets: [
      {
        label: 'Avg. Sales / Rep',
        data: efficiencyData,
        borderColor: '#8b5cf6', // Violet
        pointBackgroundColor: '#afa2d1',
        pointRadius: 4,
        pointHoverRadius: 6,
        borderWidth: 2,
        tension: 0.4,
        fill: true,
        backgroundColor: 'rgba(139, 92, 246, 0.1)',
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
          return `Avg. Sales / Rep: ${context.parsed.y.toFixed(2)}`;
        },
      },
    },
  },
  scales: {
    y: {
      beginAtZero: true,
      title: {
        display: true,
        text: 'Clients per Rep',
      },
    },
  },
};
</script>

<template>
  <Line :data="chartData" :options="chartOptions" />
</template>
