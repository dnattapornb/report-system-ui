<script setup lang="ts">
import { useReportStore } from '../stores/reportStore.ts';

const store = useReportStore();
</script>

<template>
  <div class="relative group">
    <div class="flex items-center gap-2 cursor-pointer">
      <span class="relative flex h-3 w-3">
        <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
        <span class="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
      </span>
      <span class="text-sm font-medium text-slate-600">{{ store.onlineUsersCount }} Online</span>
    </div>
    
    <!-- Tooltip with user list -->
    <div v-if="store.onlineUsers.length > 0"
         class="absolute top-full right-0 mt-2 w-72 bg-white border border-slate-200 rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-50 p-4 space-y-3 invisible group-hover:visible">
      <h4 class="font-bold text-sm text-slate-800 border-b pb-2">Currently Viewing</h4>
      <div v-for="user in store.onlineUsers" :key="user.id" class="text-xs text-slate-600">
        <p class="font-semibold">{{ user.browser }} on {{ user.os }}</p>
        <p class="text-slate-400">IP: {{ user.ip }}</p>
      </div>
    </div>
  </div>
</template>
