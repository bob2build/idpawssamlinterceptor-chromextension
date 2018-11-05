import * as React from 'react'

interface Role {
    roleArn: string
    providerArn: string
    credentials: any
    fetching: boolean
}

interface Props {

    onGenerateClick: (role: string) => void

    onDownloadClick: (role: string) => void

    roles: Role[]
}

class SAMLAssertionView extends React.Component<Props, object> {
    constructor(props: Props) {
        super(props)
    }

    render() {
        let {onGenerateClick, onDownloadClick} = this.props
        return (
            <div>
                <table>
                    <tbody>
                    {this.props.roles.map(function (role: Role) {
                        let cells: JSX.Element[] = []
                        cells.push(<td key='role'>{role.roleArn}</td>)
                        if (role.credentials === null && role.fetching === false) {
                            cells.push(<td key='generate' onClick={(e) => onGenerateClick(role.roleArn)}><a
                                href='#'>Generate</a></td>)
                        } else if (role.credentials === null && role.fetching === true) {
                            cells.push(<td key='generate'> Generating...</td>)
                        }
                        else {
                            cells.push(<td key='download' onClick={(e) => onDownloadClick(role.roleArn)}><a
                                href='#'>Download</a></td>)
                        }
                        return (
                            <tr key={role.roleArn}>
                                {cells.map(function (c) {
                                    return c
                                })}
                            </tr>)
                    })}
                    </tbody>
                </table>
            </div>)
    }
}

export default SAMLAssertionView
