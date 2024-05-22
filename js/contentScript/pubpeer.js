class PubPeer {
  constructor(Browser) {
    this.innerHTMLHosts = [
      "www.embopress.org",
      "www.pnas.org",
      "www.sciencedirect.com",
    ];
    this.url = "https://pubpeer.com";
    this.apiUrl = `${this.url}/v3/publications?devkey=PubMed${Browser.name}`;
    this.utm = `?utm_source=${Browser.name}&utm_medium=BrowserExtension&utm_campaign=${Browser.name}`;
    this.feedbacks = [];
    this.urlFeedbacks = [];
    this.type = "";
    this.publicationIds = [];
    this.publications = [];
    this.pubpeerUrls = [];
    this.uriEncodedUrls = {};
    this.pageUrls = this.extractValidUrls();
    this.uriEncodedDOIs = {};
    this.processingUrl = false;
    this.pagePmidOrDoiCount = 0;
    this.validPublicationCount = 0;
  }

  init() {
    this.informExtensionInstalled();

    if (this.pageNeedsPubPeerLinks()) {
      this.addPubPeerLinks();
    }
  }

  extractValidUrls() {
    let urls = Array.prototype.map.call(
      document.querySelectorAll("a"),
      (el) => el.href
    );
    urls = urls.filter((url) => {
      if (!isValidUrl(url)) {
        return false;
      }
      return Domains.validate(url);
    });
    urls = urls.map((url) => {
      const decodedUrl = decodeURIComponent(url);
      if (url !== decodedUrl) {
        this.uriEncodedUrls[decodedUrl.toLowerCase()] = url;
      }
      return decodedUrl;
    });
    return unique(urls);
  }

  contains(selector, text) {
    var elements = document.querySelectorAll(selector);
    var lowerCaseText = text.toLowerCase();
    if (this.processingUrl) {
      lowerCaseText = 'href="' + lowerCaseText;
    }
    return [].filter.call(elements, (element) => {
      if (typeof element[this.targetAttr] === "string") {
        return element[this.targetAttr].toLowerCase().includes(lowerCaseText);
      }
      return false;
    });
  }

  get pageDOIs() {
    return (
      document.body.innerHTML.match(
        /\b(10[.][0-9]{4,}(?:[.][0-9]+)*\/(?:(?!["&\'<>])\S)+)\b/gi
      ) || []
    ).map((doi) => {
      const decodedDOI = decodeURIComponent(doi);
      if (doi !== decodedDOI) {
        uriEncodedDOIs[decodedDOI.toLowerCase()] = doi;
      }
      return decodedDOI;
    });
  }

  get pagePMIDs() {
    return (
      document.body.innerText.replace(/\n/g, "").match(/(PMID:?\s\d+)/gi) || []
    ).map((id) => id.match(/\d+/)[0]);
  }

  get isPubMed() {
    return (
      (location.href.toLowerCase().indexOf("pubmed") > -1 &&
        this.pagePMIDs.length) ||
      !this.pageDOIs.length
    );
  }

  get targetAttr() {
    return this.innerHTMLHosts.includes(location.host) || this.processingUrl
      ? "innerHTML"
      : "innerText";
  }

  get uriEncodedIds() {
    return this.processingUrl ? this.uriEncodedUrls : this.uriEncodedDOIs;
  }

  informExtensionInstalled() {
    localStorage.setItem("pubpeer-extension", true);
  }

  pageNeedsPubPeerLinks() {
    return (
      (unique(this.pageDOIs).length > 0 ||
        unique(this.pagePMIDs).length > 0 ||
        unique(this.pageUrls).length > 0) &&
      window.location.hostname.indexOf("pubpeer") === -1
    );
  }

  addPubPeerLinks() {
    let request = new XMLHttpRequest();
    request.open("POST", this.apiUrl, true);
    request.setRequestHeader("Content-Type", "application/json;charset=UTF-8");

    request.onload = () => {
      if (request.status >= 200 && request.status < 400) {
        let responseText = JSON.parse(request.responseText);
        if (!responseText) {
          return;
        }
        this.feedbacks =
          (responseText.feedbacks &&
            uniqueByProperty(responseText.feedbacks, "id")) ||
          []; // Make sure the feedbacks are unique by id
        this.urlFeedbacks = responseText.urlFeedbacks || [];
        this.determinePageType();
        this.feedbacks.forEach((publication) => {
          this.processingUrl = false;
          this.appendPublicationDetails(publication);
        });
        this.urlFeedbacks.forEach((publication) => {
          this.processingUrl = true;
          this.appendPublicationDetails(publication);
        });
        this.addTopBar();
      }
    };

    let param = {
      version: "1.6.2",
      browser: Browser.name,
      urls: this.pageUrls,
    };

    if (this.isPubMed) {
      param.pmids = unique(this.pagePMIDs);
      this.pagePmidOrDoiCount = param.pmids.length;
    } else {
      param.dois = unique(this.pageDOIs);
      this.pagePmidOrDoiCount = param.dois.length;
    }

    request.send(JSON.stringify(param));
  }

  isDOMElement(obj) {
    return !!(obj && obj.nodeType === 1);
  }

  isVisible(el) {
    const style = window.getComputedStyle(el);
    return !(el.offsetParent === null || style.display === "none");
  }

  isBiorxivOnlyComment(publication) {
    if (
      publication.total_comments === 0 &&
      publication.updates[0].content &&
      publication.updates[0].content.type &&
      publication.updates[0].content.type === "biorxiv_comment"
    ) {
      return true;
    }
    return false;
  }

  onAfterAddingTopBar() {
    const articleElement = document.querySelector("p.pp_articles");
    switch (location.hostname) {
      case "www.cell.com":
        const headerElement = document.querySelector(
          "header.header.base.fixed"
        );
        if (
          this.isDOMElement(headerElement) &&
          this.isDOMElement(articleElement)
        ) {
          headerElement.style.top = "35px";
          articleElement.style.zIndex = 1000;
          articleElement.style.width = "100vw";
        }
        break;
      case "journals.plos.org":
        document.body.style.height = "auto";
        break;
      default:
        break;
    }
    this.initTopBarRemoveEvent();
    this.initHeaderSubContentToggleEvent();
  }

  initHeaderSubContentToggleEvent() {
    const toggleElement = document.getElementById("pubpeer-toggle-subcontent");
    if (toggleElement) {
      toggleElement.onclick = function () {
        const subContent = document.getElementById("pubpeer-header-subcontent");
        if (subContent) {
          subContent.style.display =
            subContent.style.display === "none" ? "block" : "none";
        }
      };
    }
  }

  initTopBarRemoveEvent() {
    const closeElement = document.getElementById(
      "btn-close-pubpeer-article-summary"
    );
    if (closeElement) {
      const that = this;
      closeElement.onclick = function () {
        this.parentNode.parentNode.remove();
        that.onAfterRemovingTopBar();
      };
    }
  }

  onAfterRemovingTopBar() {
    switch (location.hostname) {
      case "www.cell.com":
        const headerElement = document.querySelector(
          "header.header.base.fixed"
        );
        if (this.isDOMElement(headerElement)) {
          headerElement.style.top = 0;
        }
        break;
      case "journals.plos.org":
        document.body.style.height = "100%";
        break;
      default:
        break;
    }
  }

  getPublicationType(publication) {
    let publicationType = "";
    if (publication.updates && publication.updates.length) {
      switch (publication.updates[0].type) {
        case "BLOGGED":
        case "RETRACTED":
        case "EXPRESSION OF CONCERN":
          publicationType = publication.updates[0].type;
          break;
        default:
          publicationType = "";
          break;
      }
      if (
        publicationType === "BLOGGED" &&
        (publication.total_comments > 0 ||
          this.isBiorxivOnlyComment(publication))
      ) {
        this.type = publicationType = "";
      }
    }
    return publicationType;
  }

  determinePageType() {
    if (this.feedbacks.length === 1) {
      this.type = this.getPublicationType(this.feedbacks[0]);
    } else {
      this.type = "";
    }
  }

  generateNotificationTitle(publication, isTopBar = false) {
    let title = "";
    const type = this.getPublicationType(publication);
    const titlePrefix =
      isTopBar && this.feedbacks.length === 1 && this.pagePmidOrDoiCount > 1
        ? "An article on this page"
        : "This article";
    if (type === "BLOGGED") {
      title = "Additional information on PubPeer";
    } else if (type === "RETRACTED") {
      if (publication.total_comments === 0) {
        title = `${titlePrefix} has been retracted on PubPeer`;
      } else if (publication.total_comments === 1) {
        title = `${titlePrefix} has been retracted and there is a comment on PubPeer`;
      } else {
        title = `${titlePrefix} has been retracted and there are ${publication.total_comments} comments on PubPeer`;
      }
    } else if (type === "EXPRESSION OF CONCERN") {
      if (publication.total_comments === 0) {
        title = `${titlePrefix} has an expression of concern on PubPeer`;
      } else if (publication.total_comments === 1) {
        title = `${titlePrefix} has an expression of concern and there is a comment on PubPeer`;
      } else {
        title = `${titlePrefix} has an expression of concern and there are ${publication.total_comments} comments on PubPeer`;
      }
    }
    return title;
  }

  getBackgroundColor(type) {
    return type === "RETRACTED" || type === "EXPRESSION OF CONCERN"
      ? "#EF5753"
      : "#7ACCC8";
  }

  addTopBar() {
    const bgColor = this.getBackgroundColor(this.type);
    const articleCount = this.validPublicationCount;
    const topbarClassName = "pp_articles";
    if (
      (articleCount > 0 || this.type !== "") &&
      document.getElementsByClassName(topbarClassName).length === 0
    ) {
      let pElement = document.createElement("p");
      pElement.className = topbarClassName;
      pElement.style = `
        position: -webkit-sticky;
        top: 0;
        position: sticky;
        z-index: 9999;
        margin: 0;
        background-color: ${bgColor};
        text-align: center !important;
        padding: 5px 8px;
        font-size: 13px;
      `;
      let hrefText = "";
      if (this.type !== "") {
        const title = this.generateNotificationTitle(this.feedbacks[0], true);
        hrefText = `
          <a href="${
            this.feedbacks[0].url + this.utm
          }" target="_blank" rel="noopener noreferrer" style="color:rgb(255,255,255);text-decoration:none;font-weight:500;vertical-align:middle;border: none;">
            ${title}
          </a>
        `;
      } else {
        hrefText =
          articleCount === 1
            ? Sanitizer.escapeHTML`
              <a href="${
                this.publications[0].url + this.utm
              }" target="_blank" rel="noopener noreferrer" style="color:rgb(255,255,255);text-decoration:none;font-weight:500;vertical-align:middle;border: none;">
                "${this.publications[0].title}" has comments on PubPeer
              </a>
            `
            : `
              <span style="color:rgb(255,255,255);text-decoration:none;font-weight:500;vertical-align:middle;">
                There are ${articleCount} articles on this page with PubPeer comments
              </span>
            `;
      }
      pElement.innerHTML = `
        <div ${
          this.publications.length > 1
            ? 'id="pubpeer-toggle-subcontent" style="cursor: pointer"'
            : ""
        }>
          <img src="${
            this.url
          }/img/logo.svg" style="display:inline;vertical-align:middle;padding-right:8px;height:25px;background-color:${bgColor};"></img>
            ${hrefText}
          <div id="btn-close-pubpeer-article-summary" style="float:right;font-size:20px;line-height:24px;padding-right:10px;cursor: pointer;user-select:none;color:white;">×</div>
        </div>
        ${
          this.publications.length > 1
            ? `<div id="pubpeer-header-subcontent" style="display: none;">${this.publications.reduce(
                (html, publication) => {
                  html += `
                  <div>
                    ${Sanitizer.escapeHTML`
                    <a href="${
                      publication.url + this.utm
                    }" target="_blank" rel="noopener noreferrer" style="color:rgb(255,255,255);text-decoration:none;font-weight:500;vertical-align:middle;border: none;">
                      ${publication.title}
                    </a>
                  `}
                  </div>
                `;
                  return html;
                },
                ""
              )}</div>`
            : ""
        }
      `;
      document.body.prepend(pElement);
      this.onAfterAddingTopBar();
    }
  }

  appendPublicationDetails(publication) {
    if (this.isBiorxivOnlyComment(publication)) {
      return;
    }
    var googleSnippetDiv = "div.s",
      bingSnippetDiv = "div.b_caption",
      duckDuckGoSnippetDiv = "div.result__body",
      snippetsSelector = `${googleSnippetDiv}, ${bingSnippetDiv}, ${duckDuckGoSnippetDiv}, div, a, span`;

    const publicationType = this.getPublicationType(publication);
    const bgColor = this.getBackgroundColor(publicationType);
    let total_comments = publication.total_comments;
    let hrefText = "";
    if (publicationType !== "") {
      hrefText = this.generateNotificationTitle(publication);
      if (total_comments > 0) {
        hrefText += ` (by: ${publication.users})`;
      }
    } else {
      hrefText =
        total_comments == 1 ? `1 comment` : `${total_comments} comments`;
      hrefText += ` on PubPeer (by: ${publication.users})`;
    }
    let linkToComments = publication.url + this.utm;
    let unsortedDoiElements = this.contains(snippetsSelector, publication.id);
    if (
      !unsortedDoiElements.length &&
      !this.isPubMed &&
      Object.keys(this.uriEncodedIds).includes(publication.id.toLowerCase())
    ) {
      unsortedDoiElements = this.contains(
        snippetsSelector,
        this.uriEncodedIds[publication.id.toLowerCase()]
      );
    }
    let aDoiElement = [];
    if (unsortedDoiElements.length > 0) {
      for (let m = 0; m < unsortedDoiElements.length; m++) {
        var allParents = unsortedDoiElements[m].parents().length;
        aDoiElement.push({
          element: unsortedDoiElements[m],
          rents: allParents,
        });
      }
      aDoiElement.sort(function (a, b) {
        return b.rents - a.rents;
      });
    }
    let elementsWithDois = aDoiElement.length;
    for (let k = 0; k < elementsWithDois; k++) {
      //try each element that contains a matched DOI
      if (
        aDoiElement[k].element.parentNode.getElementsByClassName("pp_comm")
          .length === 0 &&
        this.isVisible(aDoiElement[k].element)
      ) {
        aDoiElement[k].element.insertAdjacentHTML(
          "afterend",
          Sanitizer.escapeHTML`<div class="pp_comm" style="margin: 1rem 0;display: flex;max-width: calc(100% - 16px);background-color: ${bgColor};padding: 5px 8px;font-size: 13px;border-radius:6px;">
            <img src="${this.url}/img/logo.svg" style="vertical-align:middle;padding-right:8px;height:25px;background-color: ${bgColor};"></img>
            <div style="align-items: center;display: flex;">
              <a href="${linkToComments}" target="_blank" rel="noopener noreferrer" style="color:rgb(255,255,255);text-decoration:none;font-weight:500;vertical-align:middle;border: none;">
                ${hrefText}
              </a>
            </div>
          </div>`
        );
        if (publication.title) {
          if (!this.publicationIds.includes(publication.id)) {
            this.publicationIds.push(publication.id);
          }
        }
      }
    }
    if (!this.pubpeerUrls.includes(publication.url)) {
      this.publications.push(publication);
      this.pubpeerUrls.push(publication.url);
      this.validPublicationCount++;
    }
  }
}
