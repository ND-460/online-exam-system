// Debug utility functions for analytics troubleshooting

export const logAnalyticsData = (componentName, data) => {
  if (import.meta.env.DEV) {
    console.group(`🔍 Analytics Debug - ${componentName}`);
    console.log('Data received:', data);
    console.log('Data type:', typeof data);
    console.log('Is array:', Array.isArray(data));
    if (data && typeof data === 'object') {
      console.log('Object keys:', Object.keys(data));
    }
    console.groupEnd();
  }
};

export const logAPICall = (url, response, error = null) => {
  if (import.meta.env.DEV) {
    console.group(`🌐 API Call Debug`);
    console.log('URL:', url);
    if (error) {
      console.error('Error:', error);
    } else {
      console.log('Response:', response);
      console.log('Status:', response?.status);
      console.log('Data:', response?.data);
    }
    console.groupEnd();
  }
};

export const logChartData = (chartName, data) => {
  if (import.meta.env.DEV) {
    console.group(`📊 Chart Debug - ${chartName}`);
    console.log('Chart data:', data);
    console.log('Data length:', data?.length);
    if (data && data.length > 0) {
      console.log('First item:', data[0]);
      console.log('Data keys:', Object.keys(data[0] || {}));
    }
    console.groupEnd();
  }
};