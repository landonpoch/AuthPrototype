import * as React from 'react';
import Auth from '../helpers/auth';
import { NavLink, RouteComponentProps, withRouter } from 'react-router-dom';

// tslint:disable-next-line:no-any
interface Props extends RouteComponentProps<any> {
    auth: Auth;
}

interface State {
    isAuthenticated: boolean;
}

class UserState extends React.Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = { isAuthenticated: false };
        this.props.auth.addOnLogin(this.onLoginStateChange);
        this.props.auth.addOnLogout(this.onLoginStateChange);
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

    private signOut = () => {
        sessionStorage.removeItem('UserManagerSettings');
        return this.props.auth.onCreateSignOutRequest(this.props.history);
    }

    private onLoginStateChange = () => {
        this.setState({ isAuthenticated: this.props.auth.isAuthenticated() });
    }
}

export default withRouter(UserState);