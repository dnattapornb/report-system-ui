<script setup lang="ts">
import { onMounted } from 'vue';
import { useSaasMetricsStore } from './stores/saasMetricsStore'; // Adjust path
import SalePerformancePage from './components/SalePerformancePage.vue'; // Adjust path

const store = useSaasMetricsStore();

onMounted(() => {
  store.fetchAndConnect(); // Fetch data and connect to WebSocket when app mounts
});
</script>

<template>
  <div id="app">
    <SalePerformancePage />
  </div>
</template>
