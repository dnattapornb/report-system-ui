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

ChartJS.register(Title, Tooltip, Legend, BarElement, CategoryScale, LinearScale, ChartDataLabels);

const props = defineProps<{
  chartData: {
    labels: string[];
    newData: number[];
    dropData: number[];
    balanceData: number[];
    startingBalance: number;
  } | null;
}>();

const chartData = computed(() => {
  if (!props.chartData) {
    return { labels: [], datasets: [] };
  }
  
  console.log('props.chartData =>', props.chartData);
  const { labels, newData, dropData, balanceData, startingBalance } = props.chartData;
  
  // Prepare data for floating bars
  const startEndData = [];
  const increaseData = [];
  const decreaseData = [];
  
  // 1. Start Bar
  startEndData.push([0, startingBalance]);
  increaseData.push(null); // Placeholder
  decreaseData.push(null); // Placeholder
  
  // 2. Monthly Bars
  // Loop through months (indices 1 to length-2, skipping Start and End labels)
  for (let i = 1; i < labels.length - 1; i++) {
    const prevBalance = balanceData[i - 1];
    const added = newData[i];
    const dropped = Math.abs(dropData[i]); // Ensure positive value for calculation
    
    // Start Bar is handled separately, so balanceData[0] is Start Balance
    // balanceData[i] is the balance at the end of month i
    
    // Green Bar (New Clients): Starts at previous balance, goes up
    const greenStart = prevBalance;
    const greenEnd = prevBalance + added;
    increaseData.push([greenStart, greenEnd]);
    
    // Red Bar (Drop Out): Starts at the top of Green Bar, goes down
    const redStart = greenEnd;
    const redEnd = greenEnd - dropped;
    decreaseData.push([redEnd, redStart]); // Chart.js draws from min to max, so [bottom, top]
    
    // No grey bar for monthly columns in this visualization style
    startEndData.push(null);
  }
  
  // 3. End Bar
  const finalBalance = balanceData[balanceData.length - 1];
  startEndData.push([0, finalBalance]);
  increaseData.push(null);
  decreaseData.push(null);
  
  return {
    labels,
    datasets: [
      {
        label: 'Balance',
        data: startEndData,
        backgroundColor: '#94a3b8', // Slate
        borderRadius: 4,
        order: 1,
      },
      {
        label: 'New Clients',
        data: increaseData,
        backgroundColor: '#10b981', // Emerald
        borderRadius: 4,
        order: 2,
      },
      {
        label: 'Drop Out',
        data: decreaseData,
        backgroundColor: '#ef4444', // Red
        borderRadius: 4,
        order: 3,
      },
    ],
  };
});

const chartOptions: ChartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      display: true,
      position: 'bottom',
    },
    tooltip: {
      callbacks: {
        label: (context: any) => {
          const raw = context.raw;
          if (!raw) return '';
          const val = Math.abs(raw[1] - raw[0]);
          return `${context.dataset.label}: ${val}`;
        },
      },
    },
    datalabels: {
      display: true,
      color: (context) => {
        return context.dataset.label === 'Balance' ? '#fff' : '#1e293b';
      },
      anchor: (context) => {
        // For floating bars, anchor logic can be tricky.
        // Simple approach: center for balance, end for movements
        return context.dataset.label === 'Balance' ? 'center' : 'end';
      },
      align: (context) => {
        return context.dataset.label === 'Balance' ? 'center' : 'top';
      },
      formatter: (value, context) => {
        if (!value) return '';
        const val = Math.abs(value[1] - value[0]);
        if (val === 0) return '';
        
        if (context.dataset.label === 'Drop Out') return `-${val}`;
        if (context.dataset.label === 'New Clients') return `+${val}`;
        return val;
      },
      font: { weight: 'bold' },
    },
  },
  scales: {
    x: {
      stacked: true, // Important for aligning the floating bars if needed, though here we use separate columns logic
    },
    y: {
      beginAtZero: true,
      title: {
        display: true,
        text: 'Number of Hotels',
      },
    },
  },
};
</script>

<template>
  <Bar :data="chartData" :options="chartOptions" />
</template>
