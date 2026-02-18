<script setup lang="ts">
import { computed } from 'vue';
import { Bar } from 'vue-chartjs';
import { Chart as ChartJS, Title, Tooltip, Legend, BarElement, CategoryScale, LinearScale, type ChartOptions } from 'chart.js';
import ChartDataLabels from 'chartjs-plugin-datalabels';
import type { ReportMetricItem } from '../../types/report';
import { formatCurrency } from '../../utils/formatters';

ChartJS.register(Title, Tooltip, Legend, BarElement, CategoryScale, LinearScale, ChartDataLabels);

const props = defineProps<{ chartData: ReportMetricItem[] }>();

const chartData = computed(() => {
  const uniqueYears = [...new Set(props.chartData.map((d) => d.year))].sort();
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  
  // Palette: Berry Smooth (Slate -> Purple -> Fuchsia)
  const colorPalette = [
    { bg: '#c084fc', border: '#a855f7' }, // Purple-400 (Middle: สีม่วงอ่อน)
    { bg: '#d946ef', border: '#c026d3' }, // Fuchsia-500 (Newest: สีชมพูบานเย็นสดใส)
    { bg: '#db2777', border: '#be185d' }, // Pink-600 (Future/Extra)
    { bg: '#cbd5e1', border: '#94a3b8' }, // Slate-300 (Oldest: สีพื้นฐาน)
  ];
  
  const datasets = uniqueYears.map((year, index) => {
    const data = months.map((_, monthIndex) => {
      const monthStr = String(monthIndex + 1).padStart(2, '0');
      const item = props.chartData.find((d) => d.year === year && d.month === monthStr);
      return item ? item.hotelgruCommissionActual : 0;
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
      anchor: 'end',
      align: 'top',
      display: (context) => {
        const value = context.dataset.data[context.dataIndex] as number;
        return value > 0;
      },
      formatter: (value: number) => {
        return formatCurrency(value, true);
      },
      font: { weight: 'bold', size: 10 },
      color: '#64748b',
      offset: -2,
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
          if (context.parsed.y !== null) label += formatCurrency(context.parsed.y);
          return label;
        },
      },
    },
  },
  scales: {
    y: {
      beginAtZero: true,
      title: { display: true, text: 'Commission (THB)' },
      ticks: { callback: (value) => formatCurrency(value as number, true) },
      grid: { color: '#f1f5f9', borderDash: [4, 4] },
    },
    x: { grid: { display: false } },
  },
};
</script>

<template>
  <Bar :data="chartData" :options="chartOptions" />
</template>
