# idpawssamlinterceptor

A Chrome extension to intercept SAML responses containing the SAML assertion passed from an IDP (IDentity Provider) to AWS.
The intercepted SAML response allows for generating AWS CLI credentials, which in turn can be used with other tools such as awscli, terraform etc

## Overview

This Chrome extension, listens for sign-in requests to signin.aws.amazon.com, storing the SAML response in memory.
The extension provides a popup to generate AWS CLI credentials using the SAML response and download them.

This tool is inspired by
* https://github.com/prolane/samltoawsstskeys
* https://aws.amazon.com/blogs/security/how-to-implement-federated-api-and-cli-access-using-saml-2-0-and-ad-fs/ 


## Functionality

* Capture SAML responses sent to signin.aws.amazon.com
* Render list of roles available for valid response (responses usually expire in under 10 minutes)
* For each valid role, render links to generate and download AWS CLI credentials
* Provide configuration to support which websites are allowed to receive credentials
* Store & retrieve configuration values on shutdown/startup  

## Requirements

Install the following tools:
* yarn
* node (v14 works fine)

## Test

Run the following commands:
```
cd /.../path/to/idpawssamlinterceptor-chromextension/
yarn
yarn test
```

## Build

Run the following commands:
```
cd /.../path/to/idpawssamlinterceptor-chromextension/
yarn
yarn build
```

## Install

* Browse to chrome://extensions/ .
* Enable “Developer mode” using the toggle in the top-right corner.
* Select “Load unpacked” and point it to the `idpawssamlinterceptor-chromextension/build/` directory.

## TODO
* Refactor JS code and add some tests
* Add some CSS to make UI better
