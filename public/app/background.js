/*global chrome*/

/* Add minimal functionality to intercept SAML requests to signin.aws.amazon.com and hold the last recorded SAML Assertion */

var encodedSamlResponse = ""

const samlRequestListener = (message, sender, sendResponse) => {
  if (message.type === "SEND_SAML")
    sendResponse({encoded_saml: encodedSamlResponse});
  else {
    console.log("Unknown Message received" + message)
  }
}

(function () {
  const networkFilters = {
    urls: [
      "*://signin.aws.amazon.com/saml"
    ]
  };

  chrome.webRequest.onBeforeRequest.addListener((details) => {
    const {method, url} = details;
    if (method === "POST") {
      if (details.hasOwnProperty("requestBody")) {
        const {requestBody} = details;
        if (requestBody.hasOwnProperty("formData")) {
          const {formData} = requestBody
          if (formData.hasOwnProperty("SAMLResponse")) {
            encodedSamlResponse = String(formData.SAMLResponse)
            console.log("Intercepted SAML response at " + new Date().toTimeString())
          }
        }
      }
    }
  }, networkFilters, ['requestBody']);

  chrome.runtime.onMessage.addListener(samlRequestListener);
  chrome.runtime.onMessageExternal.addListener(samlRequestListener);
}());
