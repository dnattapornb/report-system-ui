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
        label: 'Actual Hotels',
        data: props.chartData.map((d) => d.partnerHotelActual),
        backgroundColor: 'rgba(99, 102, 241, 0.8)', // Indigo-500
        hoverBackgroundColor: 'rgba(99, 102, 241, 1)',
        borderRadius: 4,
        barPercentage: 0.6,
        order: 2,
      },
      {
        type: 'line' as const,
        label: 'Target Hotels',
        data: props.chartData.map((d) => d.partnerHotelTarget),
        borderColor: '#f59e0b', // Amber-500 (สีส้มทอง ตัดกับสีม่วงได้ดี)
        backgroundColor: '#f59e0b',
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
          if (label) label += ': ';
          label += context.parsed.y.toLocaleString(); // Format number (e.g., 1,200)
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
        text: 'Active Hotels (Partner)',
      },
      grid: {
        color: '#f1f5f9',
        borderDash: [4, 4],
      }, // เส้นประจางๆ
      ticks: { precision: 0 }, // บังคับจำนวนเต็ม (ไม่มี 1.5 โรงแรม)
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
