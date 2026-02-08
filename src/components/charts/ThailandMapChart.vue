<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue';
import { use, registerMap } from 'echarts/core';
import { CanvasRenderer } from 'echarts/renderers';
import { MapChart } from 'echarts/charts';
import { TooltipComponent, GeoComponent } from 'echarts/components';
import VChart from 'vue-echarts';
import axios from 'axios';
import { formatNumber } from '../../utils/formatters.ts';

use([CanvasRenderer, MapChart, TooltipComponent, GeoComponent]);

const props = defineProps<{
  distributionData?: Record<string, number>
}>();

const isMapLoaded = ref(false);
const mapData = ref<any[]>([]);
const geoJsonFeatures = ref<any[]>([]);

// Key: Name Google Sheet(Redis) -> Value: ชื่อใน GeoJSON (pro_en)
const provinceNameMapping: Record<string, string> = {
  'Phang-Nga': 'Phangnga',
  'Phattalung': 'Phatthalung',
  'Songkha': 'Songkhla',
  'Pathumthani': 'Pathum Thani',
  'Prachinburi': 'Prachin Buri',
  'Chonburi': 'Chon Buri',
  'Sisaket': 'Si Sa Ket',
  'Nongbua Lamphu': 'Nong Bua Lamphu',
  'Buriram': 'Buri Ram',
  'Lopburi': 'Lop Buri',
  'Suphanburi': 'Suphan Buri',
  'Saraburi': 'Sara Buri',
  'Singburi': 'Sing Buri',
  'Kanchanaburi': 'Kanchanaburi',
  'Nakhon Ratchasima': 'Nakhon Ratchasima', // Korat
  'Phetchaboon': 'Phetchabun',
  'Mukdahern': 'Mukdahan',
  'Petchaburi': 'Phetchaburi',
};

const normalizeName = (name: string) => {
  return name.toLowerCase().replace(/\s+/g, '').replace('province', '').replace(/-/g, '').trim();
};

const provinceDataRaw = computed(() => {
  const sourceData = props.distributionData || {};
  const mappedData: Record<string, number> = {};
  
  Object.entries(sourceData).forEach(([key, val]) => {
    const mappedKey = provinceNameMapping[key] || key;
    
    if (mappedData[mappedKey]) {
      mappedData[mappedKey] += val;
    } else {
      mappedData[mappedKey] = val;
    }
  });
  
  return mappedData;
});


const getGradientColor = (hex: string, intensity: number) => {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  const minIntensity = 0.3;
  const factor = minIntensity + (intensity * (1 - minIntensity));
  const toHex = (n: number) => n.toString(16).padStart(2, '0');
  const newR = Math.round(r * factor + 255 * (1 - factor));
  const newG = Math.round(g * factor + 255 * (1 - factor));
  const newB = Math.round(b * factor + 255 * (1 - factor));
  return `#${toHex(newR)}${toHex(newG)}${toHex(newB)}`;
};

const regionColorMap: Record<string, string> = {
  'Northern': '#10b981',
  'Southern': '#3b82f6',
  'Northeastern': '#f97316',
  'Central': '#ec4899',
  'Eastern': '#eab308',
  'Western': '#854d0e',
};

const geoToAppRegion: Record<string, string> = {
  'North': 'Northern',
  'South': 'Southern',
  'Northeast': 'Northeastern',
  'Central': 'Central',
  'East': 'Eastern',
  'West': 'Western',
};

const provinceToRegion = ref<Record<string, string>>({});

const regionCounts = computed(() => {
  const counts: Record<string, number> = {};
  Object.keys(regionColorMap).forEach(r => counts[r] = 0);
  
  const normalizedMapping: Record<string, string> = {};
  Object.keys(provinceToRegion.value).forEach(key => {
    normalizedMapping[normalizeName(key)] = provinceToRegion.value[key];
  });
  
  Object.entries(provinceDataRaw.value).forEach(([provName, val]) => {
    const cleanName = normalizeName(provName);
    const region = normalizedMapping[cleanName] || 'Central';
    if (counts[region] !== undefined) counts[region] += val;
    else counts['Central'] += val;
  });
  
  return counts;
});

const sortedRegions = computed(() => {
  const regionsArray = Object.keys(regionColorMap).map(region => ({
    name: region,
    color: regionColorMap[region],
    count: regionCounts.value[region] || 0,
  }));
  
  return regionsArray.sort((a, b) => b.count - a.count);
});

const processData = (features: any[]) => {
  const data: any[] = [];
  const normalizedMapping: Record<string, string> = {};
  const normalizedDataRaw: Record<string, number> = {};
  const validGeoNames = new Set<string>();
  
  Object.keys(provinceToRegion.value).forEach(key => {
    normalizedMapping[normalizeName(key)] = provinceToRegion.value[key];
  });
  
  Object.keys(provinceDataRaw.value).forEach(key => {
    normalizedDataRaw[normalizeName(key)] = provinceDataRaw.value[key];
  });
  
  features.forEach((f: any) => {
    const name = f.properties.pro_en || f.properties.name;
    validGeoNames.add(normalizeName(name));
  });
  
  if (Object.keys(provinceDataRaw.value).length > 0) {
    console.groupCollapsed('🗺️ Thailand Map Data Check');
    let hasError = false;
    Object.keys(provinceDataRaw.value).forEach(inputName => {
      const normalizedInput = normalizeName(inputName);
      if (!validGeoNames.has(normalizedInput)) {
        console.warn(`❌ Mismatch Found: "${inputName}" (Normalized: ${normalizedInput}) -> Not found in GeoJSON`);
        hasError = true;
      } else {
        // console.log(`✅ Matched: ${inputName}`);
      }
    });
    if (!hasError) console.log('✅ All province data matched successfully!');
    console.groupEnd();
  }
  
  const regionMaxValues: Record<string, number> = {};
  Object.keys(normalizedDataRaw).forEach((provKey) => {
    const region = normalizedMapping[provKey] || 'Central';
    const val = normalizedDataRaw[provKey];
    if (!regionMaxValues[region] || val > regionMaxValues[region]) {
      regionMaxValues[region] = val;
    }
  });
  
  // สร้าง Data สำหรับ ECharts
  features.forEach((feature: any) => {
    const props = feature.properties;
    const mapName = props.name || props.pro_en || 'Unknown';
    const cleanMapName = normalizeName(mapName);
    const region = normalizedMapping[cleanMapName] || 'Central';
    const value = normalizedDataRaw[cleanMapName] || 0;
    const localMax = regionMaxValues[region] || 1;
    
    const baseColor = regionColorMap[region] || '#cbd5e1';
    let finalColor = baseColor;
    if (value > 0) {
      const intensity = value / localMax;
      finalColor = getGradientColor(baseColor, intensity);
    } else {
      finalColor = getGradientColor(baseColor, 0.1);
    }
    
    data.push({
      name: mapName,
      value: value,
      region: region,
      ratioInRegion: (value / localMax * 100).toFixed(1),
      itemStyle: { areaColor: finalColor, borderColor: '#fff', borderWidth: 1 },
    });
  });
  
  mapData.value = data;
};

// --- Computed ---
const sortedProvinceData = computed(() => {
  return mapData.value
    .filter(d => d.value > 0)
    .sort((a, b) => b.value - a.value)
    .slice(0, 10);
});

const totalHotels = computed(() => Object.values(provinceDataRaw.value).reduce((a, b) => a + b, 0));

const chartOption = computed(() => {
  return {
    tooltip: {
      trigger: 'item',
      backgroundColor: 'rgba(0, 0, 0, 0.8)',
      borderColor: 'transparent',
      borderWidth: 0,
      padding: [10, 15],
      borderRadius: 6,
      textStyle: {
        color: '#fff',
        fontFamily: 'Inter, sans-serif',
      },
      formatter: (params: any) => {
        if (!params.data) return '';
        const { name, value, region, ratioInRegion } = params.data;
        const color = regionColorMap[region] || '#fff';
        return `
          <div class="flex items-center gap-2 mb-1">
            <span class="w-2 h-2 rounded-full" style="background-color: ${color}"></span>
            <span class="font-bold text-white text-sm">${region}</span>
          </div>
          
          <div class="text-left text-xs text-gray-300 mb-3">${name}</div>
          
          <div class="flex justify-between items-end gap-6">
             <div>
                <span class="font-black text-xl text-white">${formatNumber(value)}</span>
                <span class="text-xs font-normal text-gray-400 ml-1">Hotels</span>
             </div>
             
             <div class="text-[10px] px-2 py-0.5 rounded bg-gray-700 text-gray-200 border border-gray-600 font-medium">
               Top ${ratioInRegion}% of Region
             </div>
          </div>
        `;
      },
    },
    series: [
      {
        name: 'Hotels',
        type: 'map',
        map: 'thailand',
        roam: false,
        layoutCenter: ['50%', '50%'],
        layoutSize: '110%',
        label: { show: false },
        itemStyle: {
          areaColor: '#f1f5f9',
          borderColor: '#cbd5e1',
          borderWidth: 1,
        },
        emphasis: {
          label: { show: false },
          itemStyle: {
            areaColor: '#334155',
            shadowBlur: 10,
            shadowColor: 'rgba(0, 0, 0, 0.2)',
          },
        },
        data: mapData.value,
      },
    ],
  };
});

watch(() => props.distributionData, (newData) => {
  if (geoJsonFeatures.value.length > 0) {
    // console.log('Data updated, reprocessing map...');
    processData(geoJsonFeatures.value);
  }
}, { deep: true });

onMounted(async () => {
  try {
    const response = await axios.get('https://raw.githubusercontent.com/chingchai/OpenGISData-Thailand/refs/heads/master/provinces.geojson');
    const geoJson = response.data;
    
    const dynamicMapping: Record<string, string> = {};
    geoJson.features.forEach((feature: any) => {
      const p = feature.properties;
      const provinceName = p.pro_en;
      const geoRegion = p.reg_royin;
      const appRegion = geoToAppRegion[geoRegion] || 'Central';
      dynamicMapping[provinceName] = appRegion;
      feature.properties.name = provinceName;
    });
    
    provinceToRegion.value = dynamicMapping;
    
    geoJsonFeatures.value = geoJson.features;
    
    registerMap('thailand', geoJson);
    processData(geoJson.features);
    
    isMapLoaded.value = true;
  } catch (error) {
    console.error('Error loading map:', error);
  }
});
</script>

<template>
  <div class="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-8 overflow-hidden">
    <!-- Thailand map -->
    <div class="bg-white rounded-2xl border border-slate-100 lg:col-span-6 relative h-[400px] lg:h-full overflow-hidden">
      <div v-if="!isMapLoaded" class="absolute inset-0 flex items-center justify-center z-10">
        <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
      <v-chart v-if="isMapLoaded" class="chart" :option="chartOption" autoresize />
    </div>
    
    <!-- Thailand Details -->
    <div class="lg:col-span-6 flex flex-col h-full overflow-hidden">
      <!-- Thailand All Region -->
      <div class="bg-white p-6 rounded-2xl shadow-xs border border-slate-100 mb-4">
        <p class="text-md text-left font-bold text-slate-500 uppercase tracking-widest mb-4">Region</p>
        <div class="mb-4 grid grid-cols-2 gap-2">
          <div v-for="item in sortedRegions" :key="item.name" class="flex items-center justify-between text-xs">
            <div class="flex items-center gap-2">
              <div class="w-3 h-3 rounded-full shadow-sm" :style="{ backgroundColor: item.color }"></div>
              <p class="text-slate-600 font-medium">{{ item.name }}</p>
            </div>
            <p class="font-bold text-slate-800 bg-slate-100 px-1.5 py-0.5 rounded text-[10px]">
              {{ formatNumber(item.count || 0) }}
            </p>
          </div>
        </div>
      </div>
      
      <!-- Thailand Top 10 Provinces -->
      <div class="bg-white flex-1 p-6 rounded-2xl shadow-xs border border-slate-100 overflow-y-auto custom-scrollbar">
        <p class="text-md text-left font-bold text-slate-500 uppercase tracking-widest mb-4">Top 10 Provinces</p>
        <div class="pr-2 space-y-3">
          <div
            v-for="(item, index) in sortedProvinceData"
            :key="item.name"
            class="group flex items-center justify-between hover:bg-slate-50 transition-all"
          >
            <div class="flex items-center gap-3">
              <div
                class="w-6 h-6 rounded flex items-center justify-center text-xs font-bold text-white shadow-sm"
                :style="{ backgroundColor: regionColorMap[item.region] }"
              >
                {{ index + 1 }}
              </div>
              <div>
                <div class="font-bold text-slate-700 text-sm">{{ item.name }}</div>
                <div class="text-left text-[10px] text-slate-400">{{ item.region }}</div>
              </div>
            </div>
            <div class="text-sm font-bold text-slate-600">{{ formatNumber(item.value) }}</div>
          </div>
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
