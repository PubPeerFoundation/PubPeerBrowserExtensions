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

// Extract hostname from the url
function extractHostNameFromUrl(url) {
  let hostname;
  const www = 'www.';

  //find & remove protocol (http, ftp, etc.) and get hostname
  if (url.indexOf("//") > -1) {
    hostname = url.split('/')[2];
  } else {
    hostname = url.split('/')[0];
  }
  //find & remove port number
  hostname = hostname.split(':')[0];
  //find & remove "?"
  hostname = hostname.split('?')[0];
  hostname = hostname.toLowerCase();
  let possibleHostNames = [hostname], anotherHostName;
  if (hostname.indexOf(www) === -1) {
    anotherHostName = www + hostname;
  } else {
    anotherHostName = hostname.split(www)[1];
  }

  possibleHostNames.push(anotherHostName);

  return possibleHostNames;
}
