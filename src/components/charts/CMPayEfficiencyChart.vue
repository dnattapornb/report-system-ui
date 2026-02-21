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
  
  const chargeData = props.chartData.map((d) => d.cmpayChargeActual);
  
  const takeRateData = props.chartData.map((d) => {
    if (!d.cmpayChargeActual || d.cmpayChargeActual === 0) return 0;
    return (d.cmpayProfitActual / d.cmpayChargeActual) * 100;
  });
  
  return {
    labels,
    datasets: [
      {
        type: 'bar' as const,
        label: 'Total Charge Volume',
        data: chargeData,
        backgroundColor: 'rgba(147, 197, 253, 0.9)', // Blue-300
        hoverBackgroundColor: 'rgba(147, 197, 253, 1)',
        borderRadius: 4,
        barPercentage: 0.6,
        order: 2,
        yAxisID: 'y',
        datalabels: {
          display: false,
        },
      },
      {
        type: 'line' as const,
        label: 'Take Rate (%)',
        data: takeRateData,
        borderColor: '#059669', // Emerald-600 (สีเขียวเข้ม สื่อถึงกำไร/ประสิทธิภาพ)
        backgroundColor: '#059669',
        borderWidth: 2,
        pointRadius: 4,
        pointBackgroundColor: '#fff',
        pointBorderColor: '#059669',
        pointBorderWidth: 2,
        tension: 0.4, // เส้นโค้ง Smooth
        order: 1,
        yAxisID: 'y1', // แกนขวา
        datalabels: {
          display: true,
          align: 'top',
          anchor: 'end',
          formatter: (value: number) => value.toFixed(2) + '%', // โชว์ทศนิยม 2 ตำแหน่ง
          color: '#059669',
          font: { weight: 'bold', size: 10 },
          offset: 4,
          clip: false,
        },
      },
    ],
  };
});

const chartOptions: ChartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    tooltip: {
      enabled: true,
      mode: 'index',
      intersect: false,
      borderWidth: 1,
      padding: 10,
      callbacks: {
        label: (context) => {
          let label = context.dataset.label || '';
          if (label) label += ': ';
          
          if (context.dataset.yAxisID === 'y') {
            label += formatCurrency(context.parsed.y);
          } else {
            // Format แกนขวา (%) เป็นเปอร์เซ็นต์
            label += context.parsed.y.toFixed(2) + '%';
          }
          return label;
        },
      },
    },
  },
  scales: {
    // แกนซ้าย: Charge Volume (THB)
    y: {
      type: 'linear',
      display: true,
      position: 'left',
      beginAtZero: true,
      title: { display: true, text: 'Charge Volume (THB)' },
      grid: {
        color: '#f1f5f9',
        borderDash: [4, 4],
      },
      ticks: {
        callback: function(value) {
          return formatCurrency(value as number, true); // ย่อตัวเลข (e.g. 10M)
        },
      },
    },
    // แกนขวา: Take Rate (%)
    y1: {
      type: 'linear',
      display: true,
      position: 'right',
      beginAtZero: true,
      title: { display: true, text: 'Take Rate (%)' },
      grid: {
        display: false, // ซ่อน Grid แกนขวาเพื่อไม่ให้รก
      },
      ticks: {
        callback: function(value) {
          return value + '%';
        },
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
