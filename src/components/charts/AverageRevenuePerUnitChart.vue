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
  Filler, // สำคัญ! สำหรับระบายสีใต้กราฟ (Area Chart)
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
        // ใช้สี Indigo (คราม/ม่วง) สื่อถึงความพรีเมียม/มูลค่า
        borderColor: '#6366f1', // Indigo-500
        pointBackgroundColor: '#fff',
        pointBorderColor: '#6366f1',
        pointBorderWidth: 2,
        pointRadius: 4,
        pointHoverRadius: 6,
        borderWidth: 2,
        tension: 0.4, // เส้นโค้ง Smooth
        fill: true,   // เปิดการระบายสีใต้กราฟ
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
    legend: {
      display: false, // ซ่อน Legend เพราะมีเส้นเดียว (ใส่ชื่อใน Title Card แทน)
    },
    datalabels: {
      align: 'top',
      anchor: 'end',
      formatter: (value: number) => formatCurrency(value, true), // ย่อตัวเลข (e.g. 1.5k)
      font: { weight: 'bold', size: 10 },
      color: '#6366f1', // สีเดียวกับเส้น
      offset: 4,
      display: 'auto', // ซ่อนอัตโนมัติถ้าเบียดกัน
      clip: false,
      clamp: true,
    },
    tooltip: {
      borderWidth: 1,
      padding: 10,
      displayColors: false, // ไม่ต้องโชว์กล่องสีใน Tooltip
      callbacks: {
        label: (context) => {
          let label = context.dataset.label || '';
          if (label) label += ': ';
          // แสดงค่าเต็มใน Tooltip
          label += formatCurrency(context.parsed.y);
          return label;
        },
        footer: () => 'Avg. revenue per active hotel',
      },
    },
  },
  scales: {
    y: {
      beginAtZero: true, // เริ่มที่ 0 เพื่อให้เห็น Scale จริง
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
