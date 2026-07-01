// TODO: Implement proper date formatting (e.g., using date-fns or dayjs)
export const formatDate = (date: Date): string => {
  return date.toISOString().split('T')[0]; // Simple YYYY-MM-DD placeholder
};
