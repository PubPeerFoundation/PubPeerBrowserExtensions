var pageDOIs=document.body.innerHTML.match(/\b(10[.][0-9]{4,}(?:[.][0-9]+)*\/(?:(?!["&\'<>])\S)+)\b/gi);
pageDOIs = $.unique(pageDOIs);
if(window.location.hostname != "pubpeer.com" && pageDOIs.length > 0){
	let dotcom = "devkey=PubMedChrome";

	new Promise(function(resolve, reject) {
		let storedDOIs = localStorage.getItem("storedDOIs");
		let LastIDdownload = localStorage.getItem("LastIDdownload");

		if (
			!storedDOIs
			|| storedDOIs.length < 10
			|| !LastIDdownload
			|| ((Date.now() - LastIDdownload) > (168 * 60 * 60 * 1000))
		) {
			let IDsURL = "https://api.pubpeer.com/v2/pubposts?filter=doi&"+dotcom;
			let idRequest = new XMLHttpRequest();
			idRequest.onload = function () {
				localStorage.setItem("storedDOIs", this.responseText);
				localStorage.setItem("LastIDdownload", String(Date.now()));
				resolve(this.responseText);
			};
			idRequest.open("get", IDsURL);
			idRequest.send();
		} else {
			resolve(storedDOIs);
		}
	}).then(function(storedDOIs) {
		let allDOIs = $.parseJSON(storedDOIs);
		let matchedPageDOIs = new Array();
		let address = "https://api.pubpeer.com/v2/publications/"
		for(let i=0; i<pageDOIs.length; i++){
			if(allDOIs.dois.indexOf(pageDOIs[i]) != -1){
				matchedPageDOIs.push(pageDOIs[i]);
				address += pageDOIs[i] + ";";
			}
		}

		return new Promise(function(resolve, reject) {
			if (matchedPageDOIs.length == 0) {
				resolve();
			}
			let articleRequest = new XMLHttpRequest();
			articleRequest.onload = function() {
				resolve([this.responseText, matchedPageDOIs]);
			};
			articleRequest.open("get", address + "?" + dotcom);
			articleRequest.send();
		});
	}).then(function(responseAndDois) {
		if (!responseAndDois) { return; }
		let json = $.parseJSON(responseAndDois[0]);
		let matchedPageDOIs = responseAndDois[1];
		for(let i=0; i<matchedPageDOIs.length; i++){
			let total_comments = json.feedbacks[i].total_comments;
			let hrefText;
			if(total_comments == 1){
				hrefText = "1 comment on PubPeer";
			} else if(total_comments > 1){
				hrefText = total_comments + " comments on PubPeer";
			}
			if(total_comments > 0) {
				let comment_users = "by ";
				for(let j = 0; j < total_comments; j++) {
					if(json.feedbacks[i].comments[j] && json.feedbacks[i].comments[j].user) {
						comment_users += json.feedbacks[i].comments[j].user;
						if(j+1 < total_comments) {
							comment_users += ", ";
						}
					}
				}
				hrefText += " (" + comment_users + ")";
			}
			let linkToComments = json.feedbacks[i].url + "?utm_source=Chrome&utm_medium=BrowserExtension&utm_campaign=Chrome";
			let tagElements = ":contains("+matchedPageDOIs[i]+")";
			let unsortedDoiElements = $(tagElements);
			let aDoiElement = [];
			if(unsortedDoiElements.length>0){
				for(let m=0; m<unsortedDoiElements.length; m++){
					var allParents = $(unsortedDoiElements[m]).parents().length
					aDoiElement.push({element:unsortedDoiElements[m], rents:allParents});
				}
				aDoiElement.sort(function(a,b){
					return b.rents - a.rents;
				});
			}
			let elementsWithDois = aDoiElement.length
			for(let k=0; k<elementsWithDois; k++){	//try each element that contains a matched DOI
				let pp_commClass = document.getElementsByClassName('pp_comm');
				let elementsAdded = pp_commClass.length;
				let anyAlreadyAdded = false;
				for(let l=0; l == 0 || l<elementsAdded; l++){	//check if an existing tag is nested below the element
					var alreadyAdded = $.contains(aDoiElement[k].element, pp_commClass[l]);
					if(alreadyAdded == true){
						anyAlreadyAdded = true;
					}
				}
				if(!anyAlreadyAdded){
					$(aDoiElement[k].element).append(
						$("<p>", { class: "pp_comm" })
							.append($("<a>", { href: linkToComments, style: "color: rgb(255,255,255); text-decoration: none; font-weight: bold; margin-left: 1em", text: hrefText}))
							.css("background", "#ff9e29")
					);
				}
			}
		}
	});
}
