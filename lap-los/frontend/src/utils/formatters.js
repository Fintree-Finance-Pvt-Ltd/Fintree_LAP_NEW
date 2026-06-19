export const titleCase = (value = '') => value.toLowerCase().replace(/\b\w/g, (char) => char.toUpperCase());
