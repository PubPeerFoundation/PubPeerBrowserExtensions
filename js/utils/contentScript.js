const runDisplayScript = async (tabId) => {
  const scriptsToExecute = [
    { file: "js/contentScript/utils.js", target: { tabId: tabId } },
    { file: "js/contentScript/sanitizer.js", target: { tabId: tabId } },
    { file: "js/contentScript/domains.js", target: { tabId: tabId } },
    { file: "js/contentScript/browser.js", target: { tabId: tabId } },
    { file: "js/contentScript/element.js", target: { tabId: tabId } },
    { file: "js/contentScript/pubpeer.js", target: { tabId: tabId } },
  ];
  for (const script of scriptsToExecute) {
    await browser.scripting.executeScript({
      target: script.target,
      files: [script.file],
    });
  }
  setTimeout(() => {
    showContent(tabId);
  }, 300);
};

const showContent = (tabId) => {
  browser.scripting.executeScript({
    target: { tabId: tabId },
    files: ["js/contentScript/content.js"],
  });
};

const hideContent = (tabId) => {
  browser.scripting.executeScript({
    target: { tabId: tabId },
    files: ["js/contentScript/removePubPeerMarks.js"],
  });
};
