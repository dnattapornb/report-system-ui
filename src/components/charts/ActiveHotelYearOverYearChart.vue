<script setup lang="ts">
import { computed } from 'vue';
import { Bar } from 'vue-chartjs';
import {
  Chart as ChartJS,
  Title,
  Tooltip,
  Legend,
  BarElement,
  CategoryScale,
  LinearScale,
  type ChartOptions,
} from 'chart.js';
import ChartDataLabels from 'chartjs-plugin-datalabels';
import type { ReportMetricItem } from '../../types/report';

ChartJS.register(
  Title,
  Tooltip,
  Legend,
  BarElement,
  CategoryScale,
  LinearScale,
  ChartDataLabels,
);

const props = defineProps<{
  chartData: ReportMetricItem[];
}>();

const chartData = computed(() => {
  const uniqueYears = [...new Set(props.chartData.map((d) => d.year))].sort();
  
  const months = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
  ];
  
  const colorPalette = [
    { bg: '#fcd34d', border: '#fbbf24' }, // Amber-300 (เหลืองนวล)
    { bg: '#fb923c', border: '#f97316' }, // Orange-400 (ส้มละมุน)
    { bg: '#f43f5e', border: '#e11d48' }, // Rose-500 (แดงอมชมพู ไม่แสบตา)
    { bg: '#cbd5e1', border: '#94a3b8' }, // Slate (เผื่อปีที่ 4)
  ];
  
  const datasets = uniqueYears.map((year, index) => {
    const data = months.map((_, monthIndex) => {
      const monthStr = String(monthIndex + 1).padStart(2, '0');
      const item = props.chartData.find((d) => d.year === year && d.month === monthStr);
      return item ? item.hotelActual : 0;
    });
    
    const color = colorPalette[index % colorPalette.length];
    
    return {
      label: year,
      data: data,
      backgroundColor: color.bg,
      borderColor: color.border,
      borderWidth: 1,
      borderRadius: 4,
      barPercentage: 0.7,
      categoryPercentage: 0.8,
    };
  });
  
  return {
    labels: months,
    datasets,
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
    legend: {
      position: 'top',
      align: 'end',
      labels: {
        usePointStyle: true,
        boxWidth: 8,
      },
    },
    datalabels: {
      color: '#ffffff',
      rotation: -90,
      anchor: 'end',
      align: 'start',
      offset: 4,
      
      display: (context) => {
        return (context.dataset.data[context.dataIndex] as number) > 0;
      },
      formatter: (value: number) => {
        return value.toLocaleString();
      },
      font: { weight: 'bold', size: 10 },
      clip: false,
      clamp: true,
    },
    tooltip: {
      borderWidth: 1,
      padding: 10,
      callbacks: {
        label: (context) => {
          let label = context.dataset.label || '';
          if (label) label += ': ';
          if (context.parsed.y !== null) {
            label += context.parsed.y.toLocaleString() + ' Hotels';
          }
          return label;
        },
      },
    },
  },
  scales: {
    y: {
      beginAtZero: true,
      title: { display: true, text: 'Active Hotels' },
      ticks: {
        precision: 0,
      },
      grid: {
        color: '#f1f5f9',
        borderDash: [4, 4],
      },
    },
    x: {
      grid: {
        display: false,
      },
    },
  },
};
</script>

<template>
  <Bar :data="chartData" :options="chartOptions" />
</template>
