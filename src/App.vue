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
    :toastOptions="{
    style: {
      background: 'transparent',
      border: 'none',
      boxShadow: 'none',
      padding: 0
    }
  }"
  />
</template>
