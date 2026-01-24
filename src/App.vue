<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { socket } from './services/socket';
import { Line } from 'vue-chartjs';
import {
	Chart as ChartJS, Title, Tooltip, Legend, LineElement,
	PointElement, CategoryScale, LinearScale
} from 'chart.js';
import type { AllReportData } from './types/report'; // สร้าง Type ให้ตรงกับ Backend

ChartJS.register(Title, Tooltip, Legend, LineElement, PointElement, CategoryScale, LinearScale);

const allReport = ref<AllReportData | null>(null);
const selectedType = ref<'revenue' | 'hotels'>('revenue');

// Chart re-renders automatically when allReport or selectedType changes
const chartData = computed(() => {
	if (!allReport.value || !allReport.value[selectedType.value]) {
		return { labels: [], datasets: [] };
	}
	
	const typeData = allReport.value[selectedType.value];
	const years = Object.keys(typeData).sort();
	const months = ["01", "02", "03", "04", "05", "06", "07", "08", "09", "10", "11", "12"];
	
	const colors = ['#3b82f6', '#10b981', '#f59e0b'];
	
	return {
		labels: months.map(m => `Month ${m}`),
		datasets: years.map((year, index) => ({
			label: `Year ${year}`,
			data: months.map(m => typeData[year][m] || 0),
			borderColor: colors[index % colors.length],
			backgroundColor: colors[index % colors.length],
			tension: 0.3,
		}))
	};
});

// Life Cycle & Real-time Pub/Sub
onMounted(async () => {
	// Initial Load
	try {
		const res = await fetch('http://localhost:3000/reports');
		allReport.value = await res.json();
		console.log('allReport ==>',allReport)
	} catch (err) {
		console.error('Failed to load initial data', err);
	}
	
	// WebSocket (Pub/Sub)
	socket.on('update:report', (data: AllReportData) => {
		console.log('[update:report] --> Real-time Update Received!');
		allReport.value = data;
	});
});
</script>

<template>
	<main class="p-8 bg-slate-50 min-h-screen font-sans text-slate-900">
		<div class="max-w-6xl mx-auto">
			<header class="flex flex-col md:flex-row justify-between items-center mb-10 gap-4">
				<div>
					<h1 class="text-4xl font-extrabold tracking-tight text-slate-800">
						Real-time <span class="text-blue-600">Reports</span>
					</h1>
					<p class="text-slate-500 mt-1">Comparing monthly data across multiple years</p>
				</div>
				
				<div class="flex p-1 bg-slate-200 rounded-xl shadow-inner">
					<button
						v-for="type in ['revenue', 'hotels']"
						:key="type"
						@click="selectedType = type as any"
						:class="[
              'px-6 py-2 rounded-lg font-bold transition-all duration-200 uppercase tracking-wider text-sm',
              selectedType === type ? 'bg-white shadow-sm text-blue-600' : 'text-slate-500 hover:text-slate-700'
            ]"
					>
						{{ type }}
					</button>
				</div>
			</header>
			
			<section class="bg-white p-8 rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100">
				<div v-if="allReport" class="h-[500px]">
					<Line
						:data="chartData"
						:options="{
              maintainAspectRatio: false,
              plugins: { legend: { position: 'bottom' } },
              scales: { y: { beginAtZero: true } }
            }"
					/>
				</div>
				<div v-else class="h-[500px] flex items-center justify-center">
					<div class="flex flex-col items-center gap-4">
						<div class="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
						<p class="text-slate-400 font-medium italic">Synchronizing with Redis...</p>
					</div>
				</div>
			</section>
		</div>
	</main>
</template>
