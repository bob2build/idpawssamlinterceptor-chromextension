import * as React from 'react';
import './App.css';
import CssBaseline from '@material-ui/core/CssBaseline'
import {MuiThemeProvider, createMuiTheme} from '@material-ui/core/styles';

const theme = createMuiTheme(
    {
        typography: {
            useNextVariants: true,
        },
    }
);

import ChromePluginContainer, {PluginProps} from './containers/ChromePluginContainer'
import STSCredentialsContainer from './containers/STSCredentialsContainer'
import SAMLAssertionView from './components/SAMLAssertionView'

class App extends React.Component {
    public render() {
        return (
            <MuiThemeProvider theme={theme}>
                <React.Fragment>
                    <CssBaseline/>
                    <ChromePluginContainer>
                        {(props: PluginProps) => {
                            return (
                                <STSCredentialsContainer triggerDownload={props.triggerDownload}
                                                         assertion={props.assertion}
                                                         isLoading={props.isLoading}
                                                         refreshAssertion={props.refreshAssertion}>
                                    {({generateCredentials, downloadCredentials, roles, expiryTime, refreshAssertion}) => {
                                        return <SAMLAssertionView onGenerateClick={generateCredentials}
                                                                  onDownloadClick={downloadCredentials} roles={roles}
                                                                  onRefreshClick={refreshAssertion}/>
                                    }
                                    }
                                </STSCredentialsContainer>)
                        }}
                    </ChromePluginContainer>
                </React.Fragment>
            </MuiThemeProvider>
        );
    }
}

export default App;
