import * as React from 'react'
import * as AWS from "aws-sdk";

interface CredentialFile {
    url: string
    filename: string
    conflictAction: string
    saveAs: boolean
}

interface Props {
    children: (state: STSCredentialsProps) => JSX.Element
    triggerDownload: (c: CredentialFile) => void
    refreshAssertion: () => void
    assertion: string
    isLoading: boolean
}

interface Role {
    arn: string
    provider: string
    credentials: Credentials | null
    fetching: boolean
}

interface Credentials {
    accessKeyId: string
    secretAccessKey: string
    sessionToken: string
}

interface State {
    roles: Role[]
    expirtyTime: number
    assertion: string
}

interface STSCredentialsProps {
    roles: Role[]
    expiryTime: number
    downloadCredentials: (roleArn: string, autosave: boolean) => void
    generateCredentials: (roleArn: string) => void
    refreshAssertion: () => void
}

/* Handles Generation of AWS credentials */
export default class STSCredentialsContainer extends React.Component<Props, State> {
    constructor(props: Props) {
        super(props);
        let parsed = this.parseAssertion()
        this.state = {roles: parsed.roles, expirtyTime: parsed.expiryTime, assertion: this.props.assertion}
    }

    componentDidUpdate() {
        if (this.props.assertion !== this.state.assertion) {
            let parsedAssertion = this.parseAssertion();
            this.setState({roles: parsedAssertion.roles, assertion: this.props.assertion});
        }
    }

    parseAssertion = () => {
        let roles: Role[] = [];
        let expiryTime = new Date().getTime()
        let assertion: string = this.props.assertion
        if (assertion !== "") {
            let doc = new DOMParser().parseFromString(atob(assertion), "text/xml");
            let conditionNode = doc.querySelector('SubjectConfirmationData');
            if (conditionNode !== null) {
                let expiryTimeStr = conditionNode.attributes.getNamedItem('NotOnOrAfter');
                if (expiryTimeStr !== null) {
                    expiryTime = Date.parse(expiryTimeStr.value);
                    let currentTime = new Date().getTime();
                    if (currentTime > expiryTime) {

                    } else {
                        let roleNodes = doc.querySelectorAll('[Name="https://aws.amazon.com/SAML/Attributes/Role"]');
                        if (roleNodes !== null) {
                            roleNodes.forEach(function (roleNode) {
                                roleNode.childNodes.forEach(function (roleAttr) {
                                    if (roleAttr.firstChild !== null && roleAttr.firstChild.nodeValue !== null) {
                                        let providerRoleStr = roleAttr.firstChild.nodeValue;
                                        let elements = providerRoleStr.split(",");
                                        if (elements[0].indexOf("saml-provider") >= 0) {
                                            roles.push({
                                                "provider": elements[0],
                                                "arn": elements[1],
                                                "credentials": null,
                                                "fetching": false
                                            })
                                        } else {
                                            roles.push({
                                                "provider": elements[1],
                                                "arn": elements[0],
                                                "credentials": null,
                                                "fetching": false
                                            })
                                        }
                                    }
                                })
                            })
                        }
                    }
                }
            }
        }
        return {roles: roles, expiryTime: expiryTime};
    };

    downloadCredentials = (roleArn: string, autosave: boolean) => {
        let filtered = this.state.roles.filter((r) => {
            return roleArn === r.arn
        })
        if (filtered.length > 0 && filtered[0].credentials !== null) {
            let docContent = "[default] \n" +
                "aws_access_key_id = " + filtered[0].credentials.accessKeyId + " \n" +
                "aws_secret_access_key = " + filtered[0].credentials.secretAccessKey + " \n" +
                "aws_session_token = " + filtered[0].credentials.sessionToken;

            let doc = URL.createObjectURL(new Blob([docContent], {type: 'application/octet-binary'}));
            this.props.triggerDownload({
                url: doc,
                conflictAction: 'overwrite',
                filename: 'credentials',
                saveAs: !autosave
            });
        }
    }

    generateCredentials = (roleArn: string) => {
        let filtered = this.state.roles.filter((r) => {
            return roleArn === r.arn
        })
        if (filtered.length > 0) {
            let updatedRoles = this.state.roles.map((role) => {
                if (role.arn === roleArn) {
                    let roleWithCreds = Object.assign(role, {
                        fetching: true
                    })
                    return roleWithCreds
                } else {
                    return role
                }
            })
            this.setState({roles: updatedRoles});
            let role = filtered[0];
            let params = {
                PrincipalArn: role.provider,
                RoleArn: role.arn,
                SAMLAssertion: this.props.assertion
            };

            let sts = new AWS.STS();
            let receiveCredentials = this.receiveCredentials;
            sts.assumeRoleWithSAML(params, function (err, data) {
                if (err) {
                    console.log(err);
                } else {
                    receiveCredentials(role.arn, data)
                }
            })
        }
    };

    receiveCredentials = (roleArn: string, data: AWS.STS.Types.AssumeRoleWithSAMLResponse) => {
        let updatedRoles = this.state.roles.map((role) => {
            if (role.arn === roleArn) {
                if (typeof data.Credentials !== 'undefined') {
                    let roleWithCreds = Object.assign(role, {
                        credentials: {
                            accessKeyId: data.Credentials.AccessKeyId,
                            secretAccessKey: data.Credentials.SecretAccessKey,
                            sessionToken: data.Credentials.SessionToken
                        },
                        fetching: false
                    })
                    return roleWithCreds
                } else {
                    return Object.assign(role, {fetching: false})
                }
            } else {
                return role
            }
        })
        this.setState({roles: updatedRoles})
    }

    render() {
        /*if (this.state.roles.length === 0) {
            return (<div>No Valid SAML assertion Found. Login to any AWS app in OKTA and <button
                onClick={this.props.refreshAssertion}>Refresh</button> again
            </div>)
        }*/
        return this.props.children({
            roles: this.state.roles,
            expiryTime: this.state.expirtyTime,
            downloadCredentials: this.downloadCredentials,
            generateCredentials: this.generateCredentials,
            refreshAssertion: this.props.refreshAssertion
        })
    }
}
