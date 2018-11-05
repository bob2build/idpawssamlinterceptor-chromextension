/*global chrome*/
import * as React from 'react'
import * as AWS from 'aws-sdk'
import SAMLAssertionView from "../components/SAMLAssertionView";

class SAMLAssertionContainer extends React.Component {
  constructor(props) {
    super(props);
    this.state = {fetching: false, assertion: "", extensionId: props.extensionId, roles: [], expires: null};
  }

  receiveAssertion = (response) => {
    if (response) {
      let encoded = response.encoded_saml;
      if (encoded === "") {
        this.setState({
          fetching: false,
          assertion: encoded,
        });
      } else {
        if (response.encoded_saml === this.state.assertion) {
          if (this.state.expires < new Date()) {
            this.setState({fetching: false, assertion: "", roles: [], expires: null})
          }
          this.setState({fetching: false});
          return;
        }
        let doc = new DOMParser().parseFromString(atob(encoded), "text/xml");
        let conditionNode = doc.querySelector('SubjectConfirmationData');
        let expiryTime = Date.parse(conditionNode.attributes.getNamedItem('NotOnOrAfter').value);
        let currentTime = new Date();
        if (currentTime > expiryTime) {
          let diff = currentTime - expiryTime
          this.setState({fetching: false, assertion: "", roles: []});
          return;
        }
        let diff = expiryTime - currentTime
        let roleNodes = doc.querySelectorAll('[Name="https://aws.amazon.com/SAML/Attributes/Role"]');
        let roles = []
        if (roleNodes !== null) {
          roleNodes.forEach(function (roleNode) {
            roleNode.childNodes.forEach(function (roleAttr) {
              let providerRoleStr = roleAttr.firstChild.nodeValue
              let elements = providerRoleStr.split(",")
              if (elements[0].indexOf("saml-provider") >= 0) {
                roles.push({"providerArn": elements[0], "roleArn": elements[1], "credentials": null, fetching: false})
              } else {
                roles.push({"providerArn": elements[1], "roleArn": elements[0], "credentials": null, fetching: false})
              }
            })
          })
        }
        this.setState({fetching: false, assertion: encoded, roles: roles, expires: expiryTime})
        setTimeout(() => {
          this.fetchAssertion()
        }, expiryTime - new Date())
      }
    }
  }

  fetchAssertion = () => {
    this.setState({fetching: true})
    if (this.state.extensionId === "") {
      chrome.runtime.sendMessage({type: 'SEND_SAML'}, this.receiveAssertion);
    } else {
      chrome.runtime.sendMessage(this.state.extensionId, {type: 'SEND_SAML'}, this.receiveAssertion);
    }
  }

  componentDidMount() {
    this.fetchAssertion()
  }

  downloadCredentials = (roleArn) => {
    let filtered = this.state.roles.filter((r) => {
      return roleArn === r.roleArn
    })
    if (filtered.length > 0) {
      let role = filtered[0]
      let docContent = "[default] \n" +
        "aws_access_key_id = " + role.credentials.access_key_id + " \n" +
        "aws_secret_access_key = " + role.credentials.secret_key + " \n" +
        "aws_session_token = " + role.credentials.session_token;

      let doc = URL.createObjectURL(new Blob([docContent], {type: 'application/octet-binary'}));
      // Triggers download of the generated file
      chrome.downloads.download({url: doc, filename: 'credentials', conflictAction: 'overwrite', saveAs: false});
    }
  }

  generateCredentials = (roleArn) => {
    let filtered = this.state.roles.filter((r) => {
      return roleArn === r.roleArn
    })
    if (filtered.length > 0) {
      let role = filtered[0]
      let params = {
        PrincipalArn: role.providerArn,
        RoleArn: role.roleArn,
        SAMLAssertion: this.state.assertion
      };

      let sts = new AWS.STS()
      sts.assumeRoleWithSAML(params, function (err, data) {
        if (err) {
          console.log(err)
        } else {
          this.receiveCredentials(role.roleArn, data)
        }
      }.bind(this))
      let updatedRoles = this.state.roles.map((role) => {
        if (role.roleArn === roleArn) {
          let roleWithCreds = Object.assign(role, {
            fetching: true
          })
          return roleWithCreds
        } else {
          return role
        }
      })
      this.setState({roles: updatedRoles})
    }
  }

  receiveCredentials = (roleArn, data) => {
    let updatedRoles = this.state.roles.map((role) => {
      if (role.roleArn === roleArn) {
        let roleWithCreds = Object.assign(role, {
          credentials: {
            access_key_id: data.Credentials.AccessKeyId,
            secret_key: data.Credentials.SecretAccessKey,
            session_token: data.Credentials.SessionToken
          }
        })
        return roleWithCreds
      } else {
        return role
      }
    })
    this.setState({roles: updatedRoles})
  }

  render() {
    if (this.state.fetching) {
      return (
        <div>
          Loading....
          <button onClick={function () {
            this.fetchAssertion()
          }.bind(this)}>Reload
          </button>
        </div>
      )
    }
    if (this.state.assertion === "") {
      return (
        <div>
          No Valid authentication credentials <button onClick={function () {
          this.fetchAssertion()
        }.bind(this)}>Reload</button>
        </div>
      )
    }
    return (
      <div>
        <button onClick={function () {
          this.fetchAssertion()
        }.bind(this)}>Reload
        </button>
        Expires : {new Date(this.state.expires).toTimeString()}
        <br/>
        <SAMLAssertionView onGenerateClick={this.generateCredentials} onDownloadClick={this.downloadCredentials}
                           roles={this.state.roles}/>
      </div>)
  }

}

export default SAMLAssertionContainer
