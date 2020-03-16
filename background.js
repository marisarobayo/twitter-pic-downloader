let userMap;
let numberOfPics;
let scannedTabs;

async function getPics(){
	//Take all related tabs
	let tabRequest = promiseTimeout(500, getTabs());
	let tabs = await tabRequest;
	//Ask tabs for their images, let them find them
	let numberOfPics;
	try {
		let picRequest = promiseTimeout(3000, getMessages(tabs));
		let pics = await picRequest;
		//Process all the responses to get all URLs well organized and get the number to show on the UI
		numberOfPics = processPics(pics);
	} catch(err){
		//Failsafe if any pagescript gets blocked
		numberOfPics = err;
		console.log(err);
	}

	//Process all the responses to get all URLs well organized
	return numberOfPics;
}

const getTabs = async function(){
	let tabs = await browser.tabs.query({currentWindow: true, url:'*://twitter.com/*/status/*'});
	return tabs;
}

const getMessages = async function(tabs){
	let tabMap = new Map();
	for(let tab of tabs){
		//run content script listener on the tabs, this makes them search their images
		let response = await browser.tabs.sendMessage( tab.id, {'req':'images'});
		tabMap.set(tab, response);
	}
	return tabMap;
}

function processPics(tabMap){
	numberOfPics = 0;
	userMap = new Map();
	scannedTabs = []

	for (let tab of tabMap.keys()){
		let response = tabMap.get(tab);
		//first we get with regex what user it is
		var reg = /[a-z]*:\/\/twitter\.com\/([a-zA-Z0-9\-_]+)\/status\/\d*/gm,
			match = reg.exec(tab.url);
		let user = match[1];
		for(let picUrl of response.content){
			//add tab to the list of tabs with images
			if(!scannedTabs.includes(tab)){
				scannedTabs.push(tab);
			}
			
			//add pic link if it isnt there already, so no duplicates
			//we are also ensuring that sort by user works
			if(userMap.has(user)){
				if(!userMap.get(user).includes(picUrl)){
					userMap.get(user).push(picUrl);
					numberOfPics++;
				}
			} else {
				userMap.set(user,new Array(picUrl));
				numberOfPics++;
			}
		}
	}
	return numberOfPics;
}

const askForPics = async function(){
		numberOfPics = 0;
		userMap = new Map();
		scannedTabs = []
		
		//get all tabs following criteria (on these the content script runs)
		let tabs = await browser.tabs.query({currentWindow: true, url:'*://twitter.com/*/status/*'});
		for(let tab of tabs){
			//run content script listener on the tabs, this makes them search their images
			let response = await browser.tabs.sendMessage( tab.id, {'req':'images'});
			//first we get with regex what user it is
			var reg = /[a-z]*:\/\/twitter\.com\/([a-zA-Z0-9\-_]+)\/status\/\d*/gm,
				match = reg.exec(tab.url);
			let user = match[1];
			for(let picUrl of response.content){
				//add tab to the list of tabs with images
				if(!scannedTabs.includes(tab)){
					scannedTabs.push(tab);
				}
				
				//add pic link if it isnt there already, so no duplicates
				//we are also ensuring that sort by user works
				if(userMap.has(user)){
					if(!userMap.get(user).includes(picUrl)){
						userMap.get(user).push(picUrl);
						numberOfPics++;
					}
				} else {
					userMap.set(user,new Array(picUrl));
					numberOfPics++;
				}
			}
			
		}
		//console.log(userMap);
		return numberOfPics;
}

let promiseTimeout = function(ms, promise){

	// Create a promise that rejects in <ms> milliseconds
	let timeout = new Promise((resolve, reject) => {
	  let id = setTimeout(() => {
		clearTimeout(id);
		reject('Timed out in '+ ms + 'ms.')
	  }, ms)
	})
  
	// Returns a race between our timeout and the passed in promise
	return Promise.race([
	  promise,
	  timeout
	])
  }

async function StartDownload(){
	for(var user of userMap.keys()){
		for(pic of userMap.get(user)){
			var strArray = pic.split('/');
			var filename = strArray[strArray.length-1];
			//If it has the ? character (new design) we ought to remove those tags
			//We also use the occasion to get the format
			let regexpRemove = /\?format\=\w+&name=\w+/;
			let regexpFormat = /\?format\=(\w+)&/;
			let matchFormat = regexpFormat.exec(filename);
			let format = matchFormat[1];
			let newFilename = filename.replace(regexpRemove,"") + "." + format;
			browser.downloads.download({
				saveAs: false,
				url: pic,
				filename: 'Twitter Pic Downloader/'+ user + "/" + newFilename //+ downloadIndex + "." + extension
			});
		}
	}
	
	//closing all tabs but if all are tweets that we are going to download pics from, create an empty tab
	let allTabs = await browser.tabs.query({currentWindow: true});
	if(allTabs.length == scannedTabs.length){
		browser.tabs.create({});
	}
	let twitterTabIndexes = []
	for(twitterTab of scannedTabs){
		twitterTabIndexes.push(twitterTab.id);
	}
	browser.tabs.remove(twitterTabIndexes);
}