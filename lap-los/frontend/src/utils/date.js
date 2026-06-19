export const formatDate = (value) => value ? new Intl.DateTimeFormat('en-IN').format(new Date(value)) : '';
