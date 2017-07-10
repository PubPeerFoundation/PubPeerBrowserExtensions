navigator.browserInfo= (function(){
    var ua= navigator.userAgent, tem,
    M= ua.match(/(opera|chrome|safari|firefox|msie|trident(?=\/))\/?\s*(\d+)/i) || [];
    if(/trident/i.test(M[1])){
        tem=  /\brv[ :]+(\d+)/g.exec(ua) || [];
        return 'IE '+(tem[1] || '');
    }
    if(M[1]=== 'Chrome'){
        tem= ua.match(/\b(OPR|Edge)\/(\d+)/);
        if(tem!= null) return tem.slice(1).join(' ').replace('OPR', 'Opera');
    }
    M= M[2]? [M[1], M[2]]: [navigator.appName, navigator.appVersion, '-?'];
    if((tem= ua.match(/version\/(\d+)/i))!= null) M.splice(1, 1, tem[1]);
    return { 'browser': M[0], 'version': M[1] };
})();

let address = "https://pubpeer.dev/v3/publications";
let dotcom = `devkey=PubMed${navigator.browserInfo.browser}`;
let utm = `?utm_source=${navigator.browserInfo.browser}&utm_medium=BrowserExtension&utm_campaign=${navigator.browserInfo.browser}`;
let pageDOIs = document.body.innerHTML.match(/\b(10[.][0-9]{4,}(?:[.][0-9]+)*\/(?:(?!["&\'<>])\S)+)\b/gi);

if (pageDOIs !== null) {
    pageDOIs = $.unique(pageDOIs);

    if (window.location.hostname.indexOf('pubpeer') == -1) {

        $.post(address + "?" + dotcom, {
            dois: pageDOIs
        })
        .done(function(responseText) {
            if (!responseText) {
                return;
            }
            responseText.feedbacks.forEach(function(publication) {
                let total_comments = publication.total_comments;
                let hrefText = (total_comments == 1) ? "1 comment" : total_comments + " comments";
                hrefText += ' on PubPeer';

                hrefText += " (by: " + publication.users + ")";
                let linkToComments = publication.url + utm;
                let unsortedDoiElements = $(":contains(" + publication.id + ")");
                let aDoiElement = [];
                if (unsortedDoiElements.length > 0) {
                    for (let m = 0; m < unsortedDoiElements.length; m++) {
                        var allParents = $(unsortedDoiElements[m]).parents().length
                        aDoiElement.push({
                            element: unsortedDoiElements[m],
                            rents: allParents
                        });
                    }
                    aDoiElement.sort(function(a, b) {
                        return b.rents - a.rents;
                    });
                }
                let elementsWithDois = aDoiElement.length
                for (let k = 0; k < elementsWithDois; k++) { //try each element that contains a matched DOI
                    let pp_commClass = $('.pp_comm');
                    let elementsAdded = pp_commClass.length;
                    let anyAlreadyAdded = false;
                    for (let l = 0; l == 0 || l < elementsAdded; l++) { //check if an existing tag is nested below the element
                        var alreadyAdded = $.contains(aDoiElement[k].element, pp_commClass[l]);
                        if (alreadyAdded == true) {
                            anyAlreadyAdded = true;
                        }
                    }
                    if (!anyAlreadyAdded) {
                        $(aDoiElement[k].element).append(
                            $("<p>", {
                                class: "pp_comm",
                                style: "margin: 0 1em;background-color: #7ACCC8;padding: 5px 8px;border-radius: 6px;"
                            })
                            .append($('<img>', {
                                style: "vertical-align: middle;padding-right: 8px;height:25px; float:left;",
                                src: "https://preprod.pubpeer.com/img/logo.svg"
                            }))
                            .append($("<a>", {
                                href: linkToComments,
                                style: "color: rgb(255,255,255); text-decoration: none; font-weight: 500;vertical-align: middle;",
                                text: hrefText
                            }))
                        );
                    }
                }
            });
        });
    }
}