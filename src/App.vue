<script setup lang="ts">
import { onMounted } from 'vue';
import { useSaasMetricsStore } from './stores/saasMetricsStore';
import SalePerformance from './components/SalePerformance.vue';

const store = useSaasMetricsStore();

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
