// Reusable helper functions for dashboard statistics

export const calculateAvgResponseTime = (searches: any[]): number => {
  if (!searches || searches.length === 0) return 0;
  
  const completedSearches = searches.filter((s: any) => s.status === 'completed');
  
  if (completedSearches.length === 0) return 0;
  
  const totalDuration = completedSearches.reduce((sum: number, s: any) => {
    if (s.completedAt && s.createdAt) {
      const duration = (new Date(s.completedAt).getTime() - new Date(s.createdAt).getTime()) / 1000;
      return sum + duration;
    } else {
      const estimatedTime = Math.min(2 + (s.resultsCount || 0) * 0.05, 30);
      return sum + estimatedTime;
    }
  }, 0);
  
  return totalDuration / completedSearches.length;
};

export const formatResponseTime = (seconds: number): string => {
  if (seconds === 0) return 'N/A';
  if (seconds < 60) return `${seconds.toFixed(1)}s`;
  
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.round(seconds % 60);
  
  if (remainingSeconds === 0) return `${minutes}m`;
  return `${minutes}m ${remainingSeconds}s`;
};
