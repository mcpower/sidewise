/* Copyright (c) 2012 Joel Thornton <sidewise@joelpt.net> See LICENSE.txt for license details. */

var IFRAME_LOAD_TIMEOUT_MS=12E3;chrome=window.parent=void 0;window.onload=onLoad;function onLoad(){document.getElementById("contentFrame").onload=onLoadIframe;setIframeSrc()}function onLoadIframe(){document.getElementById("loadingHint").style.display="none";TimeoutManager.clear("iframeLoad")}
function setIframeSrc(){var a=location.hash.slice(1);document.getElementById("loadingHint").style.display="block";document.getElementById("loadingURL").innerText=a;document.getElementById("contentFrame").src=a;TimeoutManager.set("iframeLoad",onIframeLoadTimeout,IFRAME_LOAD_TIMEOUT_MS)}
function onIframeLoadTimeout(){this.document.getElementById("loadingError").innerHTML="This content is taking a long time to load.<br/><br/>Many sites block being loaded in an IFRAME. This may be the case here. If the content never loads, you are probably out of luck. Sorry!"};
