let backgroundPage = null;
CheckTabs();

function Download() {
	backgroundPage.StartDownload();
	document.getElementById("information").textContent = "Downloading... you can click to re-check tabs";	
	document.getElementById("submit").onclick = CheckTabs;
	document.getElementById("submit").disabled = false;
	document.getElementById("submit").value = "Re-check";
}

async function CheckTabs(){
	if(backgroundPage == null){
		backgroundPage = await browser.extension.getBackgroundPage();
	}
	let numberOfPics = await backgroundPage.getPics();
	if(isNaN(numberOfPics)){
		document.getElementById("information").textContent = "There was an error detecting tab content. Please try again.";
		document.getElementById("submit").onclick = CheckTabs;
		document.getElementById("submit").disabled = false;
		document.getElementById("submit").value = "Re-check";
	}
	 else if(numberOfPics > 0){
		document.getElementById("information").textContent = numberOfPics + " images detected.";
		document.getElementById("submit").onclick = Download;
		document.getElementById("submit").disabled = false;
		document.getElementById("submit").value = "Download";
	} else {
		document.getElementById("information").textContent = "No tabs found. click to re-check.";
		document.getElementById("submit").onclick = CheckTabs;
		document.getElementById("submit").disabled = false;
		document.getElementById("submit").value = "Re-check";
	}
}