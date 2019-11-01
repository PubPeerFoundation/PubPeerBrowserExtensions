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
    publicationIds = [],
    publications = [],
    pageDOIs = document.body.innerHTML.match(/\b(10[.][0-9]{4,}(?:[.][0-9]+)*\/(?:(?!["&\'<>])\S)+)\b/gi) || [],
    pagePMIDs = (document.body.innerText.match(/(PMID:\s\d+)/gi) || []).map(id => id.match(/\d+/)[0]),
    isPubMed = location.href.toLowerCase().indexOf('pubmed') > -1 && pagePMIDs.length;

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
      return RegExp(text, 'i').test(element.textContent);
    });
  }

  function informExtensionInstalled() {
    localStorage.setItem('pubpeer-extension', true);
  }

  function pageNeedsPubPeerLinks() {
    return isPubMed ? unique(pagePMIDs).length > 0 : unique(pageDOIs).length > 0 && window.location.hostname.indexOf('pubpeer') === -1
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
          appendPublicationDetails(publication);
        });
        addTopBar();
      }
    };

    let param = {
      version: '0.3.3',
      browser: Browser.name
    }

    if (isPubMed) {
      param.pmids = unique(pagePMIDs);
    } else {
      param.dois = unique(pageDOIs);
    }

    request.send(JSON.stringify(param));
  }

  function isDOMElement (obj) {
    return !!(obj && obj.nodeType === 1);
  }

  function onAfterAddingTopBar () {
    const articleElement = document.querySelector('p.pp_articles');
    switch (location.hostname) {
      case 'www.cell.com':
        const headerElement = document.querySelector('header.header.base.fixed');
        if (isDOMElement(headerElement) && isDOMElement(articleElement)) {
          headerElement.style.top = '35px';
          articleElement.style.zIndex = 1000;
          articleElement.style.width = '100vw';
        }
        break;
      case 'journals.plos.org':
        document.body.style.height = 'auto';
        break;
      default:
        break;
    }
  }

  function onAfterRemovingTopBar () {
    switch (location.hostname) {
      case 'www.cell.com':
        const headerElement = document.querySelector('header.header.base.fixed');
        if (isDOMElement(headerElement)) {
          headerElement.style.top = 0;
        }
        break;
      case 'journals.plos.org':
        document.body.style.height = '100%';
        break;
      default:
        break;
    }
  }

  function addTopBar () {
    const articleCount = publications.length;
    const topbarClassName = 'pp_articles';
    if (articleCount > 0 && document.getElementsByClassName(topbarClassName).length === 0) {
      let pElement = document.createElement('p');
      pElement.className = topbarClassName;
      pElement.style = `
        position: -webkit-sticky;
        top: 0;
        position: sticky;
        z-index: 9999;
        margin: 0;
        background-color:#7ACCC8;
        text-align: center;
        padding: 5px 8px;
        font-size: 13px;
      `
      const hrefText = articleCount === 1 ?
        `
          <a href="${publications[0].url + utm}" target="_blank" rel="noopener noreferrer" style="color:rgb(255,255,255);text-decoration:none;font-weight:500;vertical-align:middle;">
            [${publications[0].title}] has comments on PubPeer
          </a>
        ` :
        `
          <span style="color:rgb(255,255,255);text-decoration:none;font-weight:500;vertical-align:middle;">
            There are ${articleCount} articles on this page with PubPeer comments
          </span>
        `;
      pElement.innerHTML = `
        <img src="${url}/img/logo.svg"; style="vertical-align:middle;padding-right:8px;height:25px;background-color:#7ACCC8;">
          ${hrefText}
        <div id="btn-close-pubpeer-article-summary" style="float: right; font-size: 20px;line-height: 24px; padding-right: 10px; cursor: pointer; user-select: none;color: white;">×</div>
      `;
      document.body.prepend(pElement);
      onAfterAddingTopBar();
      const closeElement = document.getElementById('btn-close-pubpeer-article-summary');
      if (closeElement) {
        closeElement.onclick = function () {
          this.parentNode.remove();
          onAfterRemovingTopBar();
        }
      }
    }
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
      if (aDoiElement[k].element.parentNode.getElementsByClassName('pp_comm').length === 0) {
        aDoiElement[k].element.insertAdjacentHTML('afterend',
          Sanitizer.escapeHTML`<div class="pp_comm" style="margin: 1rem 0;display: flex;width: calc(100% - 16px);background-color:#7ACCC8;padding: 5px 8px;font-size: 13px;border-radius:6px;">
            <img src="${url}/img/logo.svg"; style="vertical-align:middle;padding-right:8px;height:25px;background-color:#7ACCC8;"><img>
            <div style="align-items: center;display: flex;">
              <a href="${linkToComments}" target="_blank" rel="noopener noreferrer" style="color:rgb(255,255,255);text-decoration:none;font-weight:500;vertical-align:middle;">
                ${hrefText}
              </a>
            </div>
          </div>`
        );
        if (publication.title) {
          if (!publicationIds.includes(publication.id)) {
            publicationIds.push(publication.id);
            publications.push(publication);
          }
        }
      }
    }
  }

  init();
}(Browser));
