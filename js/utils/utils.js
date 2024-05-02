// Polyfills "browser" in Chrome:
if (typeof browser == "undefined") {
  globalThis.browser = chrome;
}

// Function to check if a given URL is valid
const isValidUrl = (url) => {
  return /^(http[s]?:\/\/){0,1}(www\.){0,1}[a-zA-Z0-9\.\-]+\.[a-zA-Z]{2,5}[\.]{0,1}/.test(
    url
  );
};
