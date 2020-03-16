browser.runtime.onMessage.addListener(returnImageLinks);

async function returnImageLinks(request){
	var response = '';

	if(request.req === 'images') {

		//We switch behaviour depending on the structure of the page
		//We support standard /status/id pages and /status/id/photo/number pages
		//The detection method will vary from one type of page to the other
		let photoregexp = /\/photo\/\d*/;
		let currentURL = window.location.href;

		if(photoregexp.test(currentURL)){
			console.log("modal");
			let statusPageURL = currentURL.replace(photoregexp, "");
			response = await detectPicsOnModalPage(statusPageURL);
		} else {
			response = detectPicsStandardStatusPage(document);
		}
	}
	return Promise.resolve({content: response});
}

async function detectPicsOnModalPage(statusPageURL){
	//Modal pages preload the images on the slider in a lazy manner, and the bottom page can be a timeline
	//The only way to extract the pics is loading the corresponding status page
	//It is slow, but it is reliable.
	let statusPage = await (await window.fetch(statusPageURL)).text();
	let parser = new DOMParser();
	let doc = parser.parseFromString(statusPage, "text/html");
	return detectPicsStandardStatusPage(doc);
}

function detectPicsStandardStatusPage(webPage){
	
	//old DOM strategy if the older Twitter version loads
	const metas = document.getElementsByTagName('meta');
	let selectedImages = [];
	for(let i = 0; i< metas.length; i++){
		//if the meta is an image
		if(metas[i].getAttribute('property') === 'og:image'){
			//some checks so unwanted images dont get it, twitter tends to put username pics in here
			if(i < metas.length && metas[i+1].getAttribute('property') === 'og:image:user_generated' && metas[i+1].getAttribute('content') === 'true'){
				let pic = metas[i].getAttribute('content');
				pic = pic.replace(":large","");
				pic = pic + ":orig";
				selectedImages.push(pic);
			}
		}
	}
	
	//2019's redesign, if the previous one doesn't work, try this method
	
	if(selectedImages.length == 0){
		
		//finding the first article tag and getting images from there by img tag
		const articles = document.getElementsByTagName('article');
		const article = articles[0];
		const imgs = article.getElementsByTagName('img');
		for(let i = 0; i< imgs.length; i++){
			let src = imgs[i].getAttribute('src');
			//not including profile pic or emojis, or hashflags
			if(src.includes("/media")){
				//forcing original quality
				let regexp = /name=\w+/
				let newsrc = src.replace(regexp,"name=orig");
				selectedImages.push(newsrc);
			}
		}
	}
	return selectedImages;

}