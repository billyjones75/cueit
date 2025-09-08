export const generateProjectAbbreviation = (projectName) => {
  if (!projectName || typeof projectName !== 'string') {
    return 'PROJ';
  }

  const words = projectName
    .trim()
    .replace(/[^\w\s]/g, '')
    .split(/\s+/)
    .filter(word => word.length > 0);

  if (words.length === 0) {
    return 'PROJ';
  }

  if (words.length === 1) {
    const word = words[0].toUpperCase();
    if (word.length <= 3) {
      return word;
    }
    return word.substring(0, 3);
  }

  const abbreviation = words
    .map(word => word.charAt(0).toUpperCase())
    .join('')
    .substring(0, 5);

  return abbreviation || 'PROJ';
};
