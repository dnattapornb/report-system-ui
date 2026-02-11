<script setup lang="ts">
import { onMounted } from 'vue';
import { Toaster } from 'vue-sonner';
import { useReportStore } from './stores/reportStore.ts';
import SalePerformance from './components/SalePerformance.vue';
import 'vue-sonner/style.css';

const store = useReportStore();

onMounted(() => {
  // Fetch data and connect to WebSocket when app mounts
  store.fetchAndConnect();
});
</script>

<template>
  <div id="app" class="w-full min-h-screen">
    <SalePerformance />
  </div>
  
  <Toaster
    position="bottom-right"
    closeButton
    :toastOptions="{
      class: 'bg-white !border-slate-100 !shadow-xl !rounded-2xl !p-4',
      titleClassName: 'text-slate-800 font-bold text-sm mb-1',
      descriptionClassName: 'text-slate-500 text-xs leading-relaxed font-medium',
      closeButtonClassName: '!bg-slate-100 !text-slate-400 hover:!bg-slate-200 hover:!text-slate-600'
    }"
  />
</template>
