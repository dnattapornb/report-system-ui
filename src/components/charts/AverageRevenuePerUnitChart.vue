<script setup lang="ts">
import { computed } from 'vue';
import { Line } from 'vue-chartjs';
import {
  Chart as ChartJS,
  Title,
  Tooltip,
  Legend,
  LineElement,
  PointElement,
  CategoryScale,
  LinearScale,
  Filler, //(Area Chart)
  type ChartOptions,
  type ScriptableContext,
} from 'chart.js';
import ChartDataLabels from 'chartjs-plugin-datalabels';
import type { ReportMetricItem } from '../../types/report';
import { formatCurrency } from '../../utils/formatters';

ChartJS.register(
  Title,
  Tooltip,
  Legend,
  LineElement,
  PointElement,
  CategoryScale,
  LinearScale,
  Filler,
  ChartDataLabels,
);

const props = defineProps<{
  chartData: ReportMetricItem[];
}>();

const chartData = computed(() => {
  const labels = props.chartData.map((d) => d.label);
  
  // คำนวณ ARPU = Revenue / Active Hotels
  const data = props.chartData.map((d) => {
    // ป้องกันการหารด้วย 0
    if (!d.hotelActual || d.hotelActual === 0) return 0;
    return d.revenueActual / d.hotelActual;
  });
  
  return {
    labels,
    datasets: [
      {
        label: 'ARPU (Revenue per Hotel)',
        data: data,
        borderColor: '#6366f1', // Indigo-500
        pointBackgroundColor: '#fff',
        pointBorderColor: '#6366f1',
        pointBorderWidth: 2,
        pointRadius: 4,
        pointHoverRadius: 6,
        borderWidth: 2,
        tension: 0.4,
        fill: true,
        backgroundColor: (context: ScriptableContext<'line'>) => {
          const ctx = context.chart.ctx;
          const gradient = ctx.createLinearGradient(0, 0, 0, 300);
          gradient.addColorStop(0, 'rgba(99, 102, 241, 0.5)'); // Indigo จางๆ ด้านบน
          gradient.addColorStop(1, 'rgba(99, 102, 241, 0.0)'); // จางหายไปด้านล่าง
          return gradient;
        },
      },
    ],
  };
});

const chartOptions: ChartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    datalabels: {
      align: 'top',
      anchor: 'end',
      formatter: (value: number) => formatCurrency(value, true),
      font: { weight: 'bold', size: 10 },
      color: '#6366f1',
      offset: 4,
      display: 'auto',
      clip: false,
      clamp: true,
    },
    tooltip: {
      enabled: true,
      mode: 'index',
      intersect: false,
      borderWidth: 1,
      padding: 10,
      displayColors: false,
      callbacks: {
        label: (context) => {
          const index = context.dataIndex;
          const rawItem = props.chartData[index];
          
          if (!rawItem) return '';
          return [
            `Hotels: ${Math.round(rawItem.hotelActual).toLocaleString()}`,
            `Revenue: ${formatCurrency(rawItem.revenueActual)}`,
            `ARPU: ${formatCurrency(context.parsed.y)}`
          ];
        },
        title: (tooltipItems) => {
          return tooltipItems[0].label;
        }
      },
    },
  },
  scales: {
    y: {
      beginAtZero: true,
      title: { display: true, text: 'Revenue per Hotel (THB)' },
      ticks: {
        callback: function(value) {
          return formatCurrency(value as number, true);
        },
      },
      grid: {
        color: '#f1f5f9',
        borderDash: [4, 4],
      },
    },
  },
};
</script>

<template>
  <Line :data="chartData" :options="chartOptions" />
</template>
