<script setup lang="ts">
import { onMounted } from 'vue';
import { useSaasMetricsStore } from './stores/saasMetricsStore';
import SalePerformancePage from './components/SalePerformancePage.vue';

const store = useSaasMetricsStore();

onMounted(() => {
  // Fetch data and connect to WebSocket when app mounts
  store.fetchAndConnect();
});
</script>

<template>
  <div id="app" class="w-full min-h-screen">
    <SalePerformancePage />
  </div>
</template>
