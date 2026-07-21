export function extractItems(response: any): any[] {
  if (!response) return [];
  if (Array.isArray(response)) return response;
  if (response.data && Array.isArray(response.data)) return response.data;
  if (response.items && Array.isArray(response.items)) return response.items;
  if (response.results && Array.isArray(response.results)) return response.results;
  if (response.contents && Array.isArray(response.contents)) return response.contents;
  if (typeof response === 'object' && response !== null) {
    const arrayProps = Object.keys(response).find(key => Array.isArray(response[key]));
    if (arrayProps) return response[arrayProps];
  }
  return [];
}
