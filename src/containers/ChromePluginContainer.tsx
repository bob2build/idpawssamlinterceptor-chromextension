/*global chrome*/
import * as React from 'react'

interface Props {
    children: (state: PluginProps) => JSX.Element
}

interface State {
    assertion: string
    isLoading: boolean
    extensionId: string
    config: string
    isConfigLoading: boolean
}

export interface PluginProps {
    assertion: string
    isLoading: boolean
    extensionId: string
    config: string
    isConfigLoading: boolean
    saveConfiguration: (config: string) => void
    triggerDownload: (c: CredentialFile) => void
    refreshAssertion: () => void
}

interface CredentialFile {
    url: string
    filename: string
    conflictAction: string
    saveAs: boolean
}

interface FetchAssertionResponse {
    encoded_saml: string
}

interface FetchConfigurationResponse {
    config: string
}

/* Handles communication with chrome API */
export default class ChromePluginContainer extends React.Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = {
            assertion: "",
            isLoading: false,
            extensionId: process.env.REACT_APP_CHROME_EXTENSION_ID || "",
            config: "",
            isConfigLoading: false
        };
    }

    receiveAssertion = (response: FetchAssertionResponse) => {
        if (response) {
            let encoded = response.encoded_saml;
            this.setState({
                isLoading: false,
                assertion: encoded,
            });
        }
    };

    fetchAssertion = () => {
        this.setState({isLoading: true});
        /*
            Property "extensionId" is set during local testing.
            This allows for rapid testing of the popup page by running it as a webpage in Chrome rather than running it after installing the extension.
            For this to work, do the following:
            - .env.local must contain REACT_APP_CHROME_EXTENSION_ID="XXX"
            - manifest.json must be updated to
                "externally_connectable": {
                    "matches": [
                    "*://localhost:* /*"
                    ]
                }
            - uncomment a line in background.js to enable listening for external messages
         */

        if (this.state.extensionId === "") {
            // @ts-ignore
            chrome.runtime.sendMessage({type: 'FETCH_SAML'}, this.receiveAssertion);
        } else {
            // @ts-ignore
            chrome.runtime.sendMessage(this.state.extensionId, {type: 'FETCH_SAML'}, this.receiveAssertion);
        }
    };

    fetchConfiguration = () => {
        this.setState({isLoading: true});
        if (this.state.extensionId === "") {
            // @ts-ignore
            chrome.runtime.sendMessage({type: 'FETCH_CONFIG'}, this.receiveConfiguration);
        } else {
            // @ts-ignore
            chrome.runtime.sendMessage(this.state.extensionId, {type: 'FETCH_CONFIG'}, this.receiveConfiguration);
        }
    };

    receiveConfiguration = (response: FetchConfigurationResponse) => {
        this.setState({
            isConfigLoading: false,
            config: response.config
        });
    }

    saveConfiguration = (config: string) => {
        // @ts-ignore
        chrome.runtime.sendMessage(this.state.extensionId, {
            type: 'SAVE_CONFIG',
            config: config
        }, this.receiveConfiguration);
    }

    triggerDownload = (c: CredentialFile) => {
        // Triggers download of the generated file
        if (this.state.extensionId === "") {
            // @ts-ignore
            chrome.downloads.download(c);
        } else {
            alert("Unable to download credentials while running via webpack. URL: " + c.url + " Saveas: " + c.saveAs)
        }
    }

    componentDidMount() {
        this.fetchAssertion();
        this.fetchConfiguration();
    }

    render() {
        return this.props.children({
            ...this.state,
            saveConfiguration: this.saveConfiguration,
            triggerDownload: this.triggerDownload,
            refreshAssertion: this.fetchAssertion
        })
    }
}
