import * as React from 'react';
import Auth from '../helpers/auth';

interface Props {
    auth: Auth;
}

interface State {
    connected: boolean;
    lastMessageReceived?: string;
}

export default class WebsocketState extends React.Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = { connected: false, lastMessageReceived: undefined };
        this.props.auth.addOnLogin(this.onLogin);
        this.props.auth.addOnLogout(this.onLogout);
    }
    
    render() {
        return (
            <React.Fragment>
                <p>Websocket Status: {this.state.connected ? 'Connected' : 'Disconnected'}</p>
                <p>Last Message Received: {this.state.lastMessageReceived}</p>
            </React.Fragment>
        );
    }

    private onLogin = () => {
        const socket = this.props.auth.getSocket();
        this.setState({ connected: true });
        socket.on('thing', (message: string) => { this.setState({ lastMessageReceived: message }); });
    }

    private onLogout = () => {
        this.setState({ connected: false });
    }
}