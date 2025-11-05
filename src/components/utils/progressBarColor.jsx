// Utility function to calculate dynamic progress bar color based on percentage used
export const getProgressBarColor = (percentageUsed) => {
  if (percentageUsed <= 50) {
    // Green zone: 0-50%
    return '#10B981'; // Green
  } else if (percentageUsed <= 75) {
    // Yellow zone: 51-75%
    return '#F59E0B'; // Amber/Orange
  } else if (percentageUsed <= 90) {
    // Orange zone: 76-90%
    return '#F97316'; // Orange
  } else if (percentageUsed <= 100) {
    // Red zone: 91-100%
    return '#EF4444'; // Red
  } else {
    // Over budget: >100%
    return '#991B1B'; // Dark Red
  }
};