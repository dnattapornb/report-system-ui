<script setup lang="ts">
import { computed } from 'vue';
import { use } from 'echarts/core';
import { CanvasRenderer } from 'echarts/renderers';
import { GaugeChart } from 'echarts/charts';
import VChart from 'vue-echarts';
import { formatCurrency } from '../../utils/formatters';

use([CanvasRenderer, GaugeChart]);

const props = withDefaults(defineProps<{
  value: number;
  max: number;
  label: string;
  color?: string;
  unit?: string; // เพิ่มหน่วยเงิน หรือหน่วยนับ
}>(), {
  color: '#3b82f6',
  unit: '',
});

const chartOption = computed(() => {
  const maxVal = props.max || 100; // ป้องกันหารด้วย 0
  
  return {
    series: [
      {
        type: 'gauge',
        startAngle: 180,
        endAngle: 0,
        min: 0,
        max: maxVal,
        splitNumber: 1, // แบ่งแค่ Start กับ End (เพื่อโชว์แค่ 0 กับ Target)
        
        // จัดตำแหน่งให้อยู่ชิดขอบล่างพอดี โดยไม่ต้องใช้ CSS Hack
        center: ['50%', '70%'],
        radius: '100%',
        
        // 1. เส้นพื้นหลังและ Progress Bar
        axisLine: {
          lineStyle: {
            width: 15, // ความหนาเส้น
            color: [[1, '#f1f5f9']], // สีพื้นหลัง (Slate-100)
          },
          roundCap: true
        },
        progress: {
          show: true,
          width: 15, // ความหนาต้องเท่ากับ axisLine
          itemStyle: { color: props.color },
          roundCap: true
        },
        
        // 2. เข็ม (Needle)
        pointer: {
          show: true,
          icon: 'path://M12.85 5.34c-.9.9-2.36.9-3.26 0-.9-.9-.9-2.36 0-3.26.9-.9 2.36-.9 3.26 0 .9.9.9 2.36 0 3.26zm-.52 4.09L9.5 22.8l-2.83-13.37c.84-.46 1.84-.46 2.68 0z', // รูปทรงเข็มแบบ Modern
          length: '65%',
          width: 6,
          offsetCenter: [0, '-10%'],
          itemStyle: {
            color: '#475569' // สีเข็ม (Slate-600)
          }
        },
        
        // จุดยึดเข็มตรงกลาง
        anchor: {
          show: true,
          showAbove: true,
          size: 5,
          itemStyle: { borderWidth: 2, borderColor: '#475569' }
        },
        
        // 3. ป้ายกำกับ 0 และ Target (Max)
        axisTick: { show: true },
        splitLine: { show: true },
        axisLabel: {
          show: true,
          distance: 25, // ระยะห่างจากวงกลม
          color: '#323843', // สีเทาอ่อน
          fontSize: 10,
          formatter: (value: number) => {
            if (value === 0) return '0';
            if (value === maxVal) return formatCurrency(maxVal, true); // แสดง Target
            return '';
          }
        },
        
        // 4. แสดงค่า Actual ตรงกลาง (Title & Detail)
        title: {
          show: true,
          offsetCenter: [0, '50%'], // ขยับชื่อ Label ลงมา
          fontSize: 12,
          color: '#64748b',
          fontWeight: 'bold'
        },
        detail: {
          valueAnimation: true,
          fontSize: 20,
          fontWeight: '900',
          offsetCenter: [0, '0%'], // ขยับตัวเลขขึ้นไปเหนือเข็มเล็กน้อย
          color: '#1e293b',
          formatter: (val: number) => {
            // คำนวณ % เพื่อโชว์คู่กับค่าจริง
            const percent = maxVal > 0 ? (val / maxVal * 100).toFixed(1) : '0';
            return `{value|${formatCurrency(val)}}\n{percent|${percent}%}`;
          },
          rich: {
            value: {
              fontSize: 0,
              fontWeight: 'bolder',
              color: '#0f172a',
              padding: [0, 0, 5, 0]
            },
            percent: {
              fontSize: 12,
              color: props.color, // สี % ตามสีธีม
              fontWeight: 'bold',
              backgroundColor: '#f8fafc',
              padding: [2, 6],
              borderRadius: 4
            }
          }
        },
        
        data: [
          {
            value: props.value,
            name: props.label // ชื่อ Label ด้านล่าง
          }
        ]
      }
    ]
  };
});
</script>

<template>
  <div class="relative w-full h-[180px] flex items-end justify-center overflow-hidden">
    <v-chart class="w-full h-full" :option="chartOption" autoresize />
  </div>
</template>
