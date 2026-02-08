<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue';
import { use, registerMap } from 'echarts/core';
import { CanvasRenderer } from 'echarts/renderers';
import { MapChart } from 'echarts/charts';
import { TooltipComponent, GeoComponent, VisualMapComponent } from 'echarts/components';
import VChart from 'vue-echarts';
import axios from 'axios';
import { formatNumber } from '../../utils/formatters';

use([
  CanvasRenderer,
  MapChart,
  TooltipComponent,
  GeoComponent,
  VisualMapComponent,
]);

const props = defineProps<{
  distributionData?: Record<string, number>;
  thailandProvinceDistribution?: Record<string, number>;
}>();

const isMapLoaded = ref(false);
const geoJsonFeatures = ref<any[]>([]);

const countryNameMapping: Record<string, string> = {
  'South Korea': 'Korea',
  'Korea': 'Korea',
  'Dem. Rep. Korea': 'Dem. Rep. Korea',
  'Laos': 'Lao PDR',
  'Lao': 'Lao PDR',
  'Lao PDR': 'Lao PDR',
  'Viet Nam': 'Vietnam',
  'Vietnam': 'Vietnam',
  'Cambodia': 'Cambodia',
  'Japan': 'Japan',
  'Hong Kong': 'Hong Kong',
  // 'Hong Kong': 'China', // Uncomment ถ้าต้องการรวมยอดเข้าจีน
  'China': 'China',
  'Taiwan': 'Taiwan',
  'Myanmar': 'Myanmar',
  'Malaysia': 'Malaysia',
  'Singapore': 'Singapore',
  'Indonesia': 'Indonesia',
  'Philippines': 'Philippines',
  // เพิ่มประเทศอื่นได้ที่นี่ตาม Log แจ้งเตือน
};

const thailandTotal = computed(() => {
  const data = props.thailandProvinceDistribution || {};
  return Object.values(data).reduce((sum, val) => sum + val, 0);
});

const processedMapData = computed(() => {
  const aggregatedData: Record<string, number> = {};
  const rawInter = props.distributionData || {};
  
  Object.entries(rawInter).forEach(([dbName, val]) => {
    if (dbName === 'Thailand') return;
    
    const mapName = countryNameMapping[dbName] || dbName;
    
    if (aggregatedData[mapName]) {
      aggregatedData[mapName] += val;
    } else {
      aggregatedData[mapName] = val;
    }
  });
  
  const data: { name: string; value: number }[] = Object.entries(aggregatedData).map(([name, val]) => ({
    name,
    value: val,
  }));
  
  if (thailandTotal.value > 0) {
    data.push({ name: 'Thailand', value: thailandTotal.value });
  }
  
  return data;
});

const sortedCountries = computed(() => {
  return [...processedMapData.value]
    .sort((a, b) => b.value - a.value);
});

const validateMapData = () => {
  if (geoJsonFeatures.value.length === 0 || processedMapData.value.length === 0) return;
  
  const validMapNames = new Set(geoJsonFeatures.value.map((f: any) => f.properties.name));
  
  console.groupCollapsed('🌏 Asia Map Data Check');
  let hasError = false;
  
  processedMapData.value.forEach(item => {
    if (!validMapNames.has(item.name)) {
      console.warn(`❌ Mismatch Found: "${item.name}" -> Not found in World Map GeoJSON.`);
      console.warn(`   👉 Action: Please add "${item.name}" to 'countryNameMapping' with the correct map name.`);
      hasError = true;
    }
  });
  
  if (!hasError) {
    console.log('✅ All country names matched successfully!');
  }
  console.groupEnd();
};

const chartOption = computed(() => {
  return {
    tooltip: {
      trigger: 'item',
      backgroundColor: 'rgba(0, 0, 0, 0.8)',
      borderColor: 'transparent',
      textStyle: { color: '#fff' },
      formatter: (params: any) => {
        if (!params.data) return '';
        const { name, value } = params.data;
        return `
          <div class="flex items-center gap-2 mb-1">
            <span class="font-bold text-white text-sm">${name}</span>
          </div>
          <div>
            <span class="font-black text-xl text-white">${formatNumber(value || 0)}</span>
            <span class="text-xs font-normal text-gray-400 ml-1">Hotels</span>
          </div>
        `;
      },
    },
    visualMap: {
      min: 0,
      max: 200,
      left: 'left',
      bottom: 'bottom',
      text: ['High', 'Low'],
      calculable: true,
      inRange: {
        color: ['#ffedd5', '#fb923c', '#c2410c'],
      },
    },
    geo: {
      map: 'world',
      roam: false,
      center: [105, 18],
      zoom: 3.5,
      label: { show: false },
      itemStyle: {
        areaColor: '#f1f5f9',
        borderColor: '#94a3b8',
        borderWidth: 0.5,
      },
      emphasis: {
        itemStyle: { areaColor: '#facc15' },
        label: { show: false },
      },
    },
    series: [
      {
        name: 'Hotels',
        type: 'map',
        geoIndex: 0,
        data: processedMapData.value,
      },
    ],
  };
});

watch([() => isMapLoaded.value, () => processedMapData.value], ([loaded]) => {
  if (loaded) {
    validateMapData();
  }
});

onMounted(async () => {
  try {
    const response = await axios.get('https://raw.githubusercontent.com/apache/echarts-examples/gh-pages/public/data/asset/geo/world.json');
    const geoJson = response.data;
    
    geoJsonFeatures.value = geoJson.features;
    
    registerMap('world', geoJson);
    isMapLoaded.value = true;
  } catch (error) {
    console.error('Error loading world map:', error);
  }
});
</script>

<template>
  <div class="flex flex-col w-full gap-4 overflow-hidden">
    <!-- Asia map -->
    <div class="bg-white rounded-2xl border border-slate-100 relative flex-[2] min-h-[400px] overflow-hidden">
      <div v-if="!isMapLoaded" class="absolute inset-0 flex items-center justify-center z-10">
        <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
      <v-chart v-if="isMapLoaded" class="chart" :option="chartOption" autoresize />
    </div>
    
    <!-- Asia Details -->
    <!-- Asia Country Ranking -->
    <div class="bg-white p-6 rounded-2xl border border-slate-100 flex flex-col flex-1 min-h-0 overflow-hidden">
      <p class="text-md text-left font-bold text-slate-500 uppercase tracking-widest mb-4 sticky top-0 bg-white z-10">
        Country Ranking
      </p>
      <div class="grid grid-cols-2 gap-2">
        <div
          v-for="(item, index) in sortedCountries"
          :key="item.name"
          class="flex items-center justify-between hover:bg-slate-50 transition-all pr-4"
        >
          <div class="flex items-center gap-3">
            <div class="w-6 h-6 rounded flex items-center justify-center text-xs font-bold text-white bg-orange-400 shadow-sm">
              {{ index + 1 }}
            </div>
            <div class="font-bold text-slate-700 text-sm">{{ item.name }}</div>
          </div>
          <div class="text-sm font-bold text-slate-600">{{ formatNumber(item.value) }}</div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped lang="css">
.chart {
  height: 100%;
  width: 100%;
}

.custom-scrollbar::-webkit-scrollbar {
  width: 4px;
}

.custom-scrollbar::-webkit-scrollbar-thumb {
  background-color: #cbd5e1;
  border-radius: 20px;
}
</style>
