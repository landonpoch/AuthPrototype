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
    private connectListenerHandle: number;
    private disconnectListenerHandle: number;

    constructor(props: Props) {
        super(props);
        this.state = { connected: false, lastMessageReceived: undefined };
    }

    componentWillMount() {
        this.connectListenerHandle = this.props.auth.addListener('connect', this.onConnect);
        this.disconnectListenerHandle = this.props.auth.addListener('disconnect', this.onDisconnect);
    }
    
    render() {
        return (
            <React.Fragment>
                <p>Websocket Status: {this.state.connected ? 'Connected' : 'Disconnected'}</p>
                <p>Last Message Received: {this.state.lastMessageReceived}</p>
            </React.Fragment>
        );
    }

    componentWillUnmount() {
        this.props.auth.removeListener('connect', this.connectListenerHandle);
        this.props.auth.removeListener('disconnect', this.disconnectListenerHandle);
    }

    private onConnect = () => {
        this.setState({ connected: true });
        const socket = this.props.auth.getSocket();
        socket.on('thing', (message: string) => { this.setState({ lastMessageReceived: message }); });
    }

    private onDisconnect = () => {
        this.setState({ connected: false });
    }
}