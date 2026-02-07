import { socket } from './socket';
import type { ReportMetricsData } from '../types/report';

let updateCallback: ((data: ReportMetricsData) => void) | null = null;

export function initWebSocket(callback: (data: ReportMetricsData) => void) {
  if (updateCallback) {
    socket.off('update:saas-metrics', updateCallback);
  }
  updateCallback = callback;

  socket.on('update:saas-metrics', (newData: ReportMetricsData) => {
    if (updateCallback) {
      updateCallback(newData);
    }
  });

  console.log('WebSocket listener for "update:saas-metrics" initialized.');
}

export function closeWebSocket() {
  if (updateCallback) {
    socket.off('update:saas-metrics', updateCallback);
    updateCallback = null;
    console.log('WebSocket listener for "update:saas-metrics" closed.');
  }
}
