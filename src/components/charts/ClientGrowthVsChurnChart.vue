<script setup lang="ts">
import { computed } from 'vue';
import { Bar } from 'vue-chartjs';
import { Chart as ChartJS, Title, Tooltip, Legend, BarElement, CategoryScale, LinearScale, type ChartOptions } from 'chart.js';
import ChartDataLabels from 'chartjs-plugin-datalabels';
import type { ReportMetricItem } from '../../types/report';

ChartJS.register(Title, Tooltip, Legend, BarElement, CategoryScale, LinearScale, ChartDataLabels);

const props = defineProps<{
  chartData: ReportMetricItem[];
}>();

const chartData = computed(() => {
  const labels = props.chartData.map(d => d.label);
  
  return {
    labels,
    datasets: [
      {
        label: 'New Clients',
        data: props.chartData.map(d => (d.clientNewOrganicCount || 0) + (d.clientNewPartnerCount || 0)),
        backgroundColor: '#10b981', // Emerald-500
        borderColor: '#059669',
        borderRadius: 4,
      },
      {
        label: 'Churned Clients',
        data: props.chartData.map(d => d.clientChurnCount || 0),
        backgroundColor: '#f43f5e', // Rose-500
        borderColor: '#e11d48',
        borderRadius: 4,
      },
    ],
  };
});

const chartOptions: ChartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  interaction: { mode: 'index', intersect: false },
  plugins: {
    legend: {
      position: 'top',
    },
    datalabels: {
      anchor: 'end',
      align: 'top',
      formatter: (value: number) => value > 0 ? value.toString() : '',
      font: { weight: 'bold', size: 11 },
      color: '#64748b', // Slate-500
      offset: -2
    },
    tooltip: {
      callbacks: {
        footer: (tooltipItems) => {
          let newClients = 0;
          let churned = 0;
          tooltipItems.forEach(function(tooltipItem) {
            if (tooltipItem.datasetIndex === 0) newClients = tooltipItem.raw as number;
            if (tooltipItem.datasetIndex === 1) churned = tooltipItem.raw as number;
          });
          // If we are hovering over a single bar, we might not have both values in tooltipItems depending on mode.
          // But with mode: 'index', we should have both if they exist.
          // Let's calculate Net Growth if we have the data context.
          // Actually, simpler to just show the net in the tooltip if possible, but let's keep it standard for now.
          return '';
        }
      }
    }
  },
  scales: {
    y: {
      beginAtZero: true,
      title: { display: true, text: 'Number of Clients' },
      ticks: {
        precision: 0
      },
      grid: {
        color: '#f1f5f9' // Slate-100
      }
    },
    x: {
      grid: {
        display: false
      }
    }
  },
};
</script>

<template>
  <Bar :data="chartData" :options="chartOptions" />
</template>
