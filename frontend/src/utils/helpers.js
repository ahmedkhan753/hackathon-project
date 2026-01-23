// Utility functions
export const formatDate = (date) => {
  return new Intl.DateTimeFormat('en-US').format(date);
};

export const capitalize = (str) => {
  return str.charAt(0).toUpperCase() + str.slice(1);
};