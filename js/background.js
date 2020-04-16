let tempDisabledHosts = [];
const webStoreHosts = [
  'chrome.google.com',
  'addons.mozilla.org'
];
const STORAGE_KEY = 'DISABLED_HOSTS';

const listener = async (msg, sender) => {
  const { name, host, tabId } = msg;
  browser.storage.local.get(STORAGE_KEY, ({ [STORAGE_KEY]: disabledHosts }) => {
    disabledHosts = disabledHosts || [];
    if (name === 'disableOnce') {
      tempDisabledHosts = addItem(host, tempDisabledHosts);
      browser.storage.local.set({ [STORAGE_KEY]: removeItem(host, disabledHosts) }, () => {
        browser.runtime.sendMessage({ name: 'close_window' });
        runRemoveScript(tabId);
      });
    } else if (name === 'disableForever') {
      browser.storage.local.set({ [STORAGE_KEY]: addItem(host, disabledHosts) }, () => {
        tempDisabledHosts = removeItem(host, tempDisabledHosts);
        browser.runtime.sendMessage({ name: 'close_window' });
        runRemoveScript(tabId);
      });
    } else if (name === 'enable') {
      browser.storage.local.set({ [STORAGE_KEY]: removeItem(host, disabledHosts) }, () => {
        tempDisabledHosts = removeItem(host, tempDisabledHosts);
        browser.runtime.sendMessage({ name: 'close_window' });
        runDisplayScript(host, tabId);
      });
    }
  });
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

const runDisplayScript = (host, tabId) => {
  browser.storage.local.get(STORAGE_KEY, ({ [STORAGE_KEY]: disabledHosts }) => {
    disabledHosts = disabledHosts || [];
    if (!webStoreHosts.includes(host) && !disabledHosts.includes(host) && !tempDisabledHosts.includes(host)) {
      browser.tabs.executeScript(tabId, { file: 'js/utils.js', runAt: 'document_idle' });
      browser.tabs.executeScript(tabId, { file: 'js/contentScript/sanitizer.js', runAt: 'document_idle' });
      browser.tabs.executeScript(tabId, { file: 'js/contentScript/domains.js', runAt: 'document_idle' });
      setTimeout(() => {
        browser.tabs.executeScript(tabId, { file: 'js/contentScript/pubpeer.js', runAt: 'document_idle' });
      }, 300);
    }
  });
}

const runRemoveScript = (tabId) => {
  browser.tabs.executeScript(tabId, { file: 'js/contentScript/removePubPeerMarks.js' });
}

const initTabsEvent = () => {
  browser.tabs.onUpdated.addListener((tabId, { status }, { url }) => {
    if (isValidUrl(url) && status === 'complete') {
      const host = url.indexOf('//') > -1 ? url.split('//')[1].split('/')[0] : '';
      runDisplayScript(host, tabId);
    }
  });
}

const init = () => {
  browser.runtime.onMessage.addListener(listener);
  initTabsEvent();
};

init();
