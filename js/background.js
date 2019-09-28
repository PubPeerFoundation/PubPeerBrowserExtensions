let tempDisabledHosts = [];
const STORAGE_KEY = 'DISABLED_HOSTS';

const listener = async (msg) => {
  const { name, host } = msg;
  let { [STORAGE_KEY]: disabledHosts } = await browser.storage.local.get(STORAGE_KEY);
  disabledHosts = disabledHosts || [];
  if (name === 'disableOnce') {
    tempDisabledHosts = addItem(host, tempDisabledHosts);
    await browser.storage.local.set({ [STORAGE_KEY]: removeItem(host, disabledHosts) });
    browser.runtime.sendMessage({ name: 'close_window' });
  } else if (name === 'disableForever') {
    await browser.storage.local.set({ [STORAGE_KEY]: addItem(host, disabledHosts) });
    tempDisabledHosts = removeItem(host, tempDisabledHosts);
    browser.runtime.sendMessage({ name: 'close_window' });
  } else if (name === 'enable') {
    await browser.storage.local.set({ [STORAGE_KEY]: removeItem(host, disabledHosts) });
    tempDisabledHosts = removeItem(host, tempDisabledHosts);
    browser.runtime.sendMessage({ name: 'close_window' });
  }
}

const removeItem = (item, arr) => {
  if (Array.isArray(arr)) {
    return unique(arr.filter(value => item !== value));
  }
  return [];
}

const addItem = (item, arr) => {
  if (Array.isArray(arr)) {
    arr.push(item);
    return unique(arr);
  }
  return [];
};

const isValidUrl = url => /^(http[s]?:\/\/){0,1}(www\.){0,1}[a-zA-Z0-9\.\-]+\.[a-zA-Z]{2,5}[\.]{0,1}/.test(url);

const unique = arr => [... new Set(arr)];

const runScript = (host, tabId) => {
  browser.storage.local.get(STORAGE_KEY).then(({ [STORAGE_KEY]: disabledHosts }) => {
    disabledHosts = disabledHosts || [];
    if (!disabledHosts.includes(host) && !tempDisabledHosts.includes(host)) {
      browser.tabs.executeScript(tabId, { file: 'js/contentScript/sanitizer.js' });
      browser.tabs.executeScript(tabId, { file: 'js/contentScript/pubpeer.js' });
    }
  })
}

const initTabsEvent = () => {
  browser.tabs.onUpdated.addListener((tabId, { status }, { url }) => {
    if (isValidUrl(url) && status === 'complete') {
      const host = url.indexOf('//') > -1 ? url.split('//')[1].split('/')[0] : '';
      runScript(host, tabId);
    }
  });
}

const init = () => {
  browser.runtime.onMessage.addListener(listener);
  initTabsEvent();
};

init();
