window.readyHandlers = [];
window.ready = function ready(handler) {
  window.readyHandlers.push(handler);
  handleState();
};

window.handleState = function handleState () {
  if (['interactive', 'complete'].indexOf(document.readyState) > -1) {
    while(window.readyHandlers.length > 0) {
      (window.readyHandlers.shift())();
    }
  }
};

document.onreadystatechange = window.handleState;
var isPaymentPage = false
var redirectUrl;
var iPaymoneySdk;

window.onClosePageIpay = function onClosePageIpay() {
  if (isPaymentPage === true) {
    if (redirectUrl)  {
      window.location.replace(redirectUrl)
    } else {
      document.querySelector(".ipaymoney-payment-page").remove();
    };
    isPaymentPage = false
  }
}

window.addEventListener('message', function(message) {
  if (message.data.type == "payment.response") {
    if (redirectUrl) window.location.replace(redirectUrl);
    if (callbackUrl) {
      if (iPaymoneySdk == "woocommerce") {
        window.location.replace(`${callbackUrl}&external_reference=${message.data.other.externalReference}&status=${message.data.other.status}&amount=${message.data.other.amount}`)
      } else {
        var myHeaders = new Headers();
        myHeaders.append("Content-Type", "application/json");
        var raw = JSON.stringify(message.data.other);
        var requestOptions = {
          method: 'POST',
          headers: myHeaders,
          body: raw
        };
        fetch(callbackUrl, requestOptions)
          .then(response => response.json())
          .then(result => console.log(result))
          .catch(error => console.log('error', error));
      }
    }
  }
});

ready(function () {
  var ipaymoneyOpenButton = document.querySelectorAll(".ipaymoney-button");
  var key;
  var amount;
  var environement;
  var transactionId;  

  for (var i = 0; i < ipaymoneyOpenButton.length; i++) {
    ipaymoneyOpenButton[i].addEventListener("click", ((e) => {
      key = e.target.dataset.key
      amount = e.target.dataset.amount
      environement = e.target.dataset.environement
      redirectUrl = e.target.dataset.redirectUrl
      callbackUrl = e.target.dataset.callbackUrl
      transactionId = e.target.dataset.transactionId
      iPaymoneySdk = e.target.dataset.sdk

      var iPayDiv = document.createElement("div");
      document.body.appendChild(iPayDiv);
      iPayDiv.className = "ipaymoney-payment-page"
      iPayDiv.setAttribute("style", "position: fixed; top: 0; left: 0; width: 100%; height: 100%; background-color: rgba(0, 0, 0, 0.50); z-index: 999999;")
      
      var iPayIframeContainer = document.createElement("div");
      iPayDiv.appendChild(iPayIframeContainer);
      iPayIframeContainer.setAttribute("style", "position: relative; width: 100%; height: 100%; max-width: 700px; margin: 0 auto;")
      
      var closeIconContainer = document.createElement("div");
      iPayIframeContainer.appendChild(closeIconContainer);
      closeIconContainer.setAttribute("style", "display: none;")
      closeIconContainer.className = "ipaymoney-close-button"
      closeIconContainer.setAttribute('onclick', "onClosePageIpay()")
      
      var closeIconSvg = document.createElementNS('http://www.w3.org/2000/svg', "svg");
      closeIconContainer.appendChild(closeIconSvg);
      closeIconSvg.setAttribute("style", "cursor: pointer")
      closeIconSvg.setAttributeNS(null, "fill", "#b0c430");
      closeIconSvg.setAttributeNS(null, "viewBox", "0 0 16 16");
      closeIconSvg.setAttributeNS(null, "width", "20px");
      closeIconSvg.setAttributeNS(null, "height", "20px");

      var closeIconPath = document.createElementNS(closeIconSvg.namespaceURI, "path");  
      closeIconPath.setAttributeNS(null, "d", "M 2.75 2.042969 L 2.042969 2.75 L 2.398438 3.101563 L 7.292969 8 L 2.042969 13.25 L 2.75 13.957031 L 8 8.707031 L 12.894531 13.605469 L 13.25 13.957031 L 13.957031 13.25 L 13.605469 12.894531 L 8.707031 8 L 13.957031 2.75 L 13.25 2.042969 L 8 7.292969 L 3.101563 2.398438 Z");
      closeIconSvg.appendChild(closeIconPath);

      var iPayLoadingGif = document.createElement('img');
      iPayLoadingGif.src = "https://i-pay.money/loading-gif-1.gif";
      iPayLoadingGif.setAttribute("style", "position: absolute; width: 100px; height: 100px; top: 50%; left: 50%; -webkit-transform: translate(-50%, -50%); transform: translate(-50%, -50%); z-index: 9999999;")
      iPayIframeContainer.appendChild(iPayLoadingGif);

      var iPayIframe = document.createElement("iframe");
      iPayIframeContainer.appendChild(iPayIframe);
      iPayIframe.setAttribute("style", "display: none")
      iPayIframe.onload = function() {
        iPayIframe.setAttribute("style", "border: 0; width: 100%; display: block;")
        iPayLoadingGif.setAttribute("style", "display: none")
        closeIconContainer.setAttribute("style", "position: absolute; top: 0; right: 0; margin: 1rem 2.4rem 0 0; border-radius: 100px; padding: 0.5rem; background-color: rgba(188, 209, 38, 0.22); display: flex; align-items: center; justify-content: center;")
      };
      iPayIframe.onerror = function() {
        console.log("Something wrong happened");
      };

      var url = `https://i-pay.money/api/sdk/payment_pages?key=${key}&amount=${amount}&environement=${environement}&parent_domaine=${window.location.origin}&transaction_id=${transactionId}`
      iPayIframe.src = url
      iPayIframe.width = "100%"
      iPayIframe.height = "100%"
      iPayIframe.frameborder = "0"
      iPayIframe.id = "i-pay-frame"
      isPaymentPage = true
    }))
  }
});

