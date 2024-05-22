const addHostToDisabledArray = (host) => {
  browser.storage.local.get("DISABLED_HOSTS", (result) => {
    let DisabledHostArray = result.DISABLED_HOSTS || [];
    DisabledHostArray.push(host);
    browser.storage.local.set({ DISABLED_HOSTS: DisabledHostArray });
  });
};

const isHostInDisabledArray = (host) => {
  return new Promise((resolve) => {
    browser.storage.local.get("DISABLED_HOSTS", (result) => {
      let DisabledHostArray = result.DISABLED_HOSTS || [];
      resolve(DisabledHostArray.includes(host));
    });
  });
};

const removeHostFromDisabledArray = (host) => {
  browser.storage.local.get("DISABLED_HOSTS", (result) => {
    let DisabledHostArray = result.DISABLED_HOSTS || [];
    const index = DisabledHostArray.indexOf(host);
    if (index !== -1) {
      DisabledHostArray.splice(index, 1);
      browser.storage.local.set({ DISABLED_HOSTS: DisabledHostArray });
    }
  });
};
