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
  ChartOptions,
} from 'chart.js';
import { formatCurrency } from '../../utils/formatters';

ChartJS.register(Title, Tooltip, Legend, BarElement, CategoryScale, LinearScale);

const props = defineProps<{
  mrr: number;
  expansion: number;
  churn: number;
  contraction: number;
}>();

const chartData = computed(() => {
  // คำนวณค่าเริ่มต้น (Starting MRR) โดยประมาณจากสูตร: End = Start + Exp - Churn - Contraction
  // ดังนั้น Start = End - Exp + Churn + Contraction
  const startingMrr = props.mrr - props.expansion + props.churn + props.contraction;

  return {
    labels: ['Starting MRR', 'Expansion', 'Churn', 'Contraction', 'Ending MRR'],
    datasets: [
      {
        label: 'MRR Bridge',
        data: [
          [0, startingMrr], // Starting
          [startingMrr, startingMrr + props.expansion], // Expansion (Up)
          [startingMrr + props.expansion - props.churn, startingMrr + props.expansion], // Churn (Down)
          [startingMrr + props.expansion - props.churn - props.contraction, startingMrr + props.expansion - props.churn], // Contraction (Down)
          [0, props.mrr], // Ending
        ],
        backgroundColor: [
          '#94a3b8', // Starting (Slate)
          '#10b981', // Expansion (Emerald)
          '#ef4444', // Churn (Red)
          '#f59e0b', // Contraction (Amber)
          '#3b82f6', // Ending (Blue)
        ],
        borderRadius: 4,
      },
    ],
  };
});

const chartOptions: ChartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { display: false },
    tooltip: {
      callbacks: {
        label: (context: any) => {
          const val = context.raw;
          const diff = Math.abs(val[1] - val[0]);
          return `Amount: ${formatCurrency(diff)}`;
        },
      },
    },
  },
  scales: {
    y: {
      beginAtZero: true,
      ticks: { callback: (value) => formatCurrency(value as number, true) },
    },
  },
};
</script>

<template>
  <Bar :data="chartData" :options="chartOptions" />
</template>
