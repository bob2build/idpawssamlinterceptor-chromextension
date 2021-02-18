import * as React from 'react'
import {withStyles, createStyles, Theme} from '@material-ui/core/styles'
import Typography from '@material-ui/core/Typography';
import RefreshIcon from '@material-ui/icons/Refresh'
import IconButton from '@material-ui/core/IconButton';
import Switch from '@material-ui/core/Switch';
import FormControlLabel from '@material-ui/core/FormControlLabel';
import {ChangeEvent} from "react";

const styles = ({palette, spacing}: Theme) => createStyles({
    root: {
        display: 'flex',
        flexDirection: 'column',
        padding: spacing.unit,
        backgroundColor: palette.background.paper,
        color: palette.primary.main,
    },
    noroles: {
        padding: spacing.unit,
        backgroundColor: palette.background.paper,
        color: palette.primary.main,
    }
});


interface Role {
    arn: string
    provider: string
    credentials: any
    fetching: boolean
}

interface Props {
    roles: Role[]
    onGenerateClick: (role: string) => void
    onDownloadClick: (role: string, autosave: boolean) => void
    onRefreshClick: () => void

    // injected style props
    classes: {
        root: string;
        noroles: string;
    };
}

interface State {
    saveas: boolean
}

class SAMLAssertionView extends React.Component<Props, State> {
    constructor(props: Props) {
        super(props)
        this.state = {saveas: true}
    }

    handleSaveAs = (e: ChangeEvent) => {
        this.setState((previousState: State, currentProps: Props) => {
            return {saveas: !previousState.saveas};
        });
    }

    render() {
        let {onGenerateClick, onDownloadClick, roles, classes, onRefreshClick} = this.props
        let autosave = this.state.saveas
        return (
            <div className={classes.root}>
                <div>
                    <Typography align={"center"}> IDP SAML Interceptor <IconButton
                        onClick={onRefreshClick}><RefreshIcon/></IconButton>
                        {roles.length > 0 &&
                        <FormControlLabel control={
                            <Switch checked={this.state.saveas}
                                    value="saveas"
                                    color="primary"
                                    onChange={this.handleSaveAs}/>} label="autosave"/>
                        }
                    </Typography>
                </div>
                <div>
                    {roles.length > 0 ?
                        (<table>
                            <tbody>
                            {roles.map(function (role: Role) {
                                let cells: JSX.Element[] = []
                                cells.push(<td key='role'>{role.arn}</td>)
                                if (role.credentials === null && role.fetching === false) {
                                    cells.push(<td key='generate' onClick={(e) => onGenerateClick(role.arn)}><a
                                        href='#'>Generate</a></td>)
                                } else if (role.credentials === null && role.fetching === true) {
                                    cells.push(<td key='generate'> Generating...</td>)
                                }
                                else {
                                    cells.push(<td key='download' onClick={(e) => onDownloadClick(role.arn, autosave)}>
                                        <a
                                            href='#'>Download</a></td>)
                                    cells.push(<td key='saveas'
                                                   onClick={(e) => onDownloadClick(role.arn, autosave)}></td>)
                                }
                                return (
                                    <tr key={role.arn}>
                                        {cells.map(function (c) {
                                            return c
                                        })}
                                    </tr>)
                            })}
                            </tbody>
                        </table>)
                        :
                        (<p>No Valid SAML Assertion Found. <br/>Log into any of your AWS apps via your identity provider
                            console (e.g., Okta) and try again.</p>)
                    }
                </div>
            </div>)
    }
}

export default withStyles(styles)(SAMLAssertionView)
