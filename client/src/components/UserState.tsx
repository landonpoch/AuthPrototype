import * as React from 'react';
import AuthHelper from '../helpers/auth';
import { NavLink, RouteComponentProps, withRouter } from 'react-router-dom';

// tslint:disable-next-line:no-any
interface Props extends RouteComponentProps<any> {
    auth: AuthHelper;
}

interface State {
    isAuthenticated: boolean;
}

class UserState extends React.Component<Props, State> {
    private loginListenerHandle: number;
    private logoutListenerHandle: number;

    constructor(props: Props) {
        super(props);
        this.state = { isAuthenticated: this.props.auth.isAuthenticated() };
    }

    componentWillMount() {
        this.loginListenerHandle = this.props.auth.addListener('login', this.onLogin);
        this.logoutListenerHandle = this.props.auth.addListener('logout', this.onLogout);
    }

    render() {
        return (
            this.state.isAuthenticated ?
                (
                    <span>
                        <span>{this.props.auth.getDisplayName()}</span>
                        <a href="javascript:;" onClick={this.signOut}>Logout</a>
                    </span>
                ) :
                <NavLink to="/login">Login</NavLink>
        );
    }

    componentWillUnmount() {
        this.props.auth.removeListener('login', this.loginListenerHandle);
        this.props.auth.removeListener('logout', this.logoutListenerHandle);
    }

    private signOut = () => {
        return this.props.auth.onCreateSignOutRequest(this.props.history);
    }

    private onLogin = () => { this.setState({ isAuthenticated: true }); };
    private onLogout = () => { this.setState({ isAuthenticated: false }); };
}

export default withRouter(UserState);