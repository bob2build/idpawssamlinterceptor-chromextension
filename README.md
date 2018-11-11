# idpawssamlinterceptor
A chrome extention to intercept Saml Assersion passed from IDP (Identity Provider) to AWS. The SAML assertion can be used to generate CLI credentials which can be used in other tools such as awscli, terraform etc.

## Overview
This chrome extention, listens for requests to signin requests to signin.aws.amazon.com and holds the SAML assertion metadata in memory. The extension provides a popup to generate CLI credentials and download them.

This tool is inspired from 
* https://github.com/prolane/samltoawsstskeys
* https://aws.amazon.com/blogs/security/how-to-implement-federated-api-and-cli-access-using-saml-2-0-and-ad-fs/ 


## Functionality
* Capture SAML assertions sent to signin.aws.amazon.com
* Render list of roles available for Valid assertion. (Assertion usually expires in under 10 minutes)
* For each valid role, render links to generate and download credentials
* Provide configuration to support which websites are allowed to receive credentials
* Store & Retrieve configuration values on shutdown/startup  

## TODO
* Refactor JS code and add some tests
* Add some CSS to make UI better
