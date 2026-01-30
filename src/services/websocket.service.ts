import { socket } from './socket';
import type { SaaSMetricsData } from '../types/report';

let updateCallback: ((data: SaaSMetricsData) => void) | null = null;

export function initWebSocket(callback: (data: SaaSMetricsData) => void) {
  if (updateCallback) {
    socket.off('update:saas-metrics', updateCallback);
  }
  updateCallback = callback;

  socket.on('update:saas:metrics', (newData: SaaSMetricsData) => {
    if (updateCallback) {
      updateCallback(newData);
    }
  });

  console.log('WebSocket listener for "update:saas-metrics" initialized.');
}

export function closeWebSocket() {
  if (updateCallback) {
    socket.off('update:saas:metrics', updateCallback);
    updateCallback = null;
    console.log('WebSocket listener for "update:saas-metrics" closed.');
  }
}
