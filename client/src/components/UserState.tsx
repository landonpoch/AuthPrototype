import * as React from 'react';
import * as H from 'history';
import { NavLink, RouteComponentProps, withRouter } from 'react-router-dom';

// tslint:disable-next-line:no-any
interface Props extends RouteComponentProps<any> {
    user?: { username: string; };
    onCreateSignOutRequest: (history: H.History) => Promise<void>;
}

class UserState extends React.Component<Props, {}> {
    constructor(props: Props) {
        super(props);
    }

    render() {
        return (
            this.props.user ?
                (
                    <span>
                        <span>{this.props.user.username}</span>
                        <a href="javascript:;" onClick={this.signOut}>Logout</a>
                    </span>
                ) :
                <NavLink to="/login">Login</NavLink>
        );
    }

    private signOut = () => {
        sessionStorage.removeItem('UserManagerSettings');
        return this.props.onCreateSignOutRequest(this.props.history);
    }
}

export default withRouter(UserState);