var Browser = (function () {
  'use strict';

  if (typeof navigator === 'undefined' || !navigator) {
    return null;
  }

  var userAgentString = navigator.userAgent;

  var browsers = [
    ['Edge', /Edge\/([0-9\._]+)/],
    ['Chrome', /(?!Chrom.*OPR)Chrom(?:e|ium)\/([0-9\.]+)(:?\s|$)/],
    ['Firefox', /Firefox\/([0-9\.]+)(?:\s|$)/],
    ['Safari', /Version\/([0-9\._]+).*Safari/]
  ];

  return browsers.map(function (rule) {
    if (rule[1].test(userAgentString)) {
      var match = rule[1].exec(userAgentString);
      var version = match && match[1].split(/[._]/).slice(0, 3);

      if (version && version.length < 3) {
        Array.prototype.push.apply(version, (version.length == 1) ? [0, 0] : [0]);
      }

      return {
        name: rule[0],
        version: version.join('.')
      };
    }
  }).filter(Boolean).shift();
})();
Element.prototype.parents = function (selector) {
  'use strict';
  var parents = [],
    element = this,
    hasSelector = selector !== undefined;

  while (element = element.parentElement) {
    if (element.nodeType !== Node.ELEMENT_NODE) {
      continue;
    }
    if (!hasSelector || element.matches(selector)) {
      parents.push(element);
    }
  }

  return parents;
};
(function (Browser) {
  'use strict';
  var
    url = "https://pubpeer.com",
    address = `${url}/v3/publications?devkey=PubMed${Browser.name}`,
    utm = `?utm_source=${Browser.name}&utm_medium=BrowserExtension&utm_campaign=${Browser.name}`,
    pageDOIs = document.body.innerHTML.match(/\b(10[.][0-9]{4,}(?:[.][0-9]+)*\/(?:(?!["&\'<>])\S)+)\b/gi) || [];

  function init() {
    informExtensionInstalled();

    if (pageNeedsPubPeerLinks()) {
      addPubPeerLinks();
    }
  }

  function unique(array) {
    return [... new Set(array)];
  }

  function contains(selector, text) {
    var elements = document.querySelectorAll(selector);
    return [].filter.call(elements, function (element) {
      return RegExp(text).test(element.textContent);
    });
  }
  function informExtensionInstalled() {
    localStorage.setItem('pubpeer-extension', true);
  }

  function pageNeedsPubPeerLinks() {
    return unique(pageDOIs).length > 0 && window.location.hostname.indexOf('pubpeer') === -1
  }

  function addPubPeerLinks() {
    let request = new XMLHttpRequest();
    request.open('POST', address, true);
    request.setRequestHeader("Content-Type", "application/json;charset=UTF-8");

    request.onload = function () {
      if (request.status >= 200 && request.status < 400) {
        let responseText = JSON.parse(request.responseText);
        if (!responseText) {
          return;
        }
        responseText.feedbacks.forEach(function (publication) {
          appendPublicationDetails(publication)
        });
      }
    };
    request.send(JSON.stringify({
      dois: unique(pageDOIs),
      version: '0.3.2',
      browser: Browser.name
    }));
  }

  function appendPublicationDetails(publication) {
    var
      googleSnippetDiv = "div.s",
      bingSnippetDiv = "div.b_caption",
      duckDuckGoSnippetDiv = "div.result__body",
      snippetsSelector = `${googleSnippetDiv}, ${bingSnippetDiv}, ${duckDuckGoSnippetDiv}, div, span`;

    let total_comments = publication.total_comments;
    let hrefText = (total_comments == 1) ? `1 comment` : `${total_comments} comments`;
    hrefText += ` on PubPeer (by: ${publication.users})`;
    let linkToComments = publication.url + utm;
    let unsortedDoiElements = contains(snippetsSelector, publication.id);
    let aDoiElement = [];
    if (unsortedDoiElements.length > 0) {
      for (let m = 0; m < unsortedDoiElements.length; m++) {
        var allParents = unsortedDoiElements[m].parents().length;
        aDoiElement.push({
          element: unsortedDoiElements[m],
          rents: allParents
        });
      }
      aDoiElement.sort(function (a, b) {
        return b.rents - a.rents;
      });
    }
    let elementsWithDois = aDoiElement.length;
    for (let k = 0; k < elementsWithDois; k++) { //try each element that contains a matched DOI
      if (aDoiElement[k].element.getElementsByClassName('pp_comm').length === 0) {
        aDoiElement[k].element.insertAdjacentHTML('afterend',
          Sanitizer.escapeHTML`<p class="pp_comm" style="margin: 0 1em;background-color:#7ACCC8;padding: 5px 8px;border-radius:6px;">
            <img src="${url}/img/logo.svg"; style="vertical-align:middle;padding-right:8px;height:25px;background-color:#7ACCC8;">
            <a href="${linkToComments}" style="color:rgb(255,255,255);text-decoration:none;font-weight:600;vertical-align:middle;">
              ${hrefText}
            </a>
          </p>`
        );
      }
    }
  }

  init();
}(Browser));
