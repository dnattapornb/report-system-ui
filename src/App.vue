<script setup lang="ts">
import { onMounted } from 'vue';
import { useReportStore } from './stores/reportStore.ts';
import SalePerformance from './components/SalePerformance.vue';

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
</template>
