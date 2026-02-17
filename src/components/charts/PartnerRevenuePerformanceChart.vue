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
        data: props.chartData.map((d) => d.partnerRevenueActual),
        backgroundColor: 'rgba(16, 185, 129, 0.8)', // Emerald-500 (Money Green)
        hoverBackgroundColor: 'rgba(16, 185, 129, 1)',
        borderRadius: 4,
        barPercentage: 0.6,
        order: 2,
      },
      {
        type: 'line' as const,
        label: 'Target Revenue',
        data: props.chartData.map((d) => d.partnerRevenueTarget),
        borderColor: '#ef4444', // Red-500 (Target Line) สีแดงตัดเขียวเพื่อให้เห็น Gap ชัดเจน
        backgroundColor: '#ef4444',
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
      display: false
    },
    tooltip: {
      enabled: true,
      mode: 'index',
      intersect: false,
      callbacks: {
        label: (context) => {
          let label = context.dataset.label || '';
          if (label) label += ': ';
          label += formatCurrency(context.parsed.y); // ใส่ ฿ และลูกน้ำ
          return label;
        },
      },
    },
  },
  scales: {
    y: {
      beginAtZero: true,
      title: {
        display: true, text: 'Revenue (THB)'
      },
      grid: {
        color: '#f1f5f9', borderDash: [4, 4]
      },
      ticks: {
        callback: function(value) {
          return formatCurrency(value as number, true); // ย่อตัวเลข (เช่น 1M)
        },
      },
    },
    x: {
      grid: { display: false },
    },
  },
};
</script>

<template>
  <Bar :data="chartData" :options="chartOptions" />
</template>
