// Make an array unique
function unique(array) {
  return [... new Set(array)];
}

// Unique object array by object's property
function uniqueByProperty(array, property) {
  return Array.from(new Set(array.map(s => s[property]))).map(p => array.find(e => e[property] === p));
}

// Check if given url is valid
function isValidUrl(url) {
  return /^(http[s]?:\/\/){0,1}(www\.){0,1}[a-zA-Z0-9\.\-]+\.[a-zA-Z]{2,5}[\.]{0,1}/.test(url);
}
