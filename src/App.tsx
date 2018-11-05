import * as React from 'react';
import './App.css';
import CssBaseline from '@material-ui/core/CssBaseline'

import SAMLAssertionContainer from './containers/SAMLAssertionContainer'

class App extends React.Component {
    public render() {
        return (
            <React.Fragment>
                <CssBaseline/>
                <SAMLAssertionContainer extensionId={process.env.REACT_APP_CHROME_EXTENSION_ID || ""}/>
            </React.Fragment>
        );
    }
}

export default App;
