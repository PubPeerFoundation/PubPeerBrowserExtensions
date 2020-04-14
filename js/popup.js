let host = '', tabId = null;

document.addEventListener("DOMContentLoaded", function (event) {
  setHost();
  initClickEvents();
  initMessagingEvents();
});

const initClickEvents = () => {
  document.addEventListener('click', eventListener);
};

const initMessagingEvents = () => {
  browser.runtime.onMessage.addListener(onMessage);
}

const setHost = () => {
  browser.tabs.query({ active: true, currentWindow: true }, tabs => {
    const { url, id } = tabs[0];
    tabId = id;
    if (typeof url === 'string') {
      host = url.indexOf('//') > -1 ? url.split('//')[1].split('/')[0] : '';
      document.getElementById('host').innerText = host;
    }
  })
}

const eventListener = (e) => {
  const { id } = e.target;
  if (id === 'btn_close') {
    window.close();
  } else if (id === 'btn_disable_once') {
    browser.runtime.sendMessage({ name: 'disableOnce', host, tabId });
  } else if (id === 'btn_disable_forever') {
    browser.runtime.sendMessage({ name: 'disableForever', host, tabId });
  } else if (id === 'btn_enable') {
    browser.runtime.sendMessage({ name: 'enable', host, tabId });
  }
}

const onMessage = (msg) => {
  const { name } = msg;
  if (name === 'close_window') {
    window.close();
  }
};
