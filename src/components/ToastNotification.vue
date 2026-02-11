<script setup lang="ts">
import { computed } from 'vue';
import { toast } from 'vue-sonner';

const props = defineProps<{
  toastId: string | number;
  type: 'info' | 'warning' | 'success';
  title: string;
  user: string;
  sheet: string;
  details: { label: string; value: string; highlight?: boolean }[];
}>();

const colorClass = computed(() => {
  switch (props.type) {
    case 'info':
      return 'bg-blue-500 text-blue-600';     // สีฟ้า (เหมือนกราฟ)
    case 'warning':
      return 'bg-orange-500 text-orange-600'; // สีส้ม (เตือน)
    case 'success':
      return 'bg-emerald-500 text-emerald-600'; // สีเขียว (สำเร็จ)
    default:
      return 'bg-slate-500 text-slate-600';
  }
});

const icon = computed(() => {
  switch (props.type) {
    case 'info':
      return '📝';
    case 'warning':
      return '⚠️';
    case 'success':
      return '🚀';
    default:
      return '🔔';
  }
});
</script>

<template>
  <div class="pointer-events-auto relative w-full min-w-[320px] bg-white rounded-xl shadow-lg border border-slate-100 overflow-hidden flex flex-row pointer-events-auto">
    
    <div :class="['w-1.5 flex-shrink-0', colorClass.split(' ')[0]]"></div>
    
    <div class="flex-1 p-3 flex flex-col gap-2 pr-8"> <div class="flex items-center gap-2 mb-1">
      <div :class="['w-6 h-6 rounded-full flex items-center justify-center bg-opacity-10 text-xs flex-shrink-0', colorClass.split(' ')[0].replace('bg-', 'bg-'), colorClass.split(' ')[1]]">
        {{ icon }}
      </div>
      <h4 class="text-sm font-bold text-slate-800 line-clamp-1">{{ title }}</h4>
    </div>
      
      <div class="flex items-center gap-2 text-xs text-slate-500 border-b border-slate-50 pb-2">
        <span class="font-medium text-slate-400">By:</span>
        <span class="font-semibold text-slate-700 truncate max-w-[180px]" :title="user">{{ user }}</span>
      </div>
      
      <div class="grid grid-cols-2 gap-y-1 gap-x-4 text-xs">
        <div class="col-span-2 flex justify-between">
          <span class="text-slate-400">Sheet:</span>
          <span class="font-medium text-slate-700 truncate max-w-[150px]">{{ sheet }}</span>
        </div>
        <div v-for="(item, index) in details" :key="index" class="col-span-2 flex justify-between items-center">
          <span class="text-slate-400">{{ item.label }}:</span>
          <span :class="['font-medium truncate max-w-[150px] text-right', item.highlight ? 'text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded' : 'text-slate-700']">
            {{ item.value }}
          </span>
        </div>
      </div>
    </div>
    
    <button
      @click="toast.dismiss(toastId)"
      class="absolute top-2 right-2 p-1 rounded-full text-slate-300 hover:text-slate-500 hover:bg-slate-50 transition-colors duration-200"
      title="Dismiss"
    >
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <line x1="18" y1="6" x2="6" y2="18"></line>
        <line x1="6" y1="6" x2="18" y2="18"></line>
      </svg>
    </button>
  
  </div>
</template>
