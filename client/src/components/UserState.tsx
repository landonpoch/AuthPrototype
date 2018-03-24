import * as React from 'react';
import { NavLink } from 'react-router-dom';

interface Props {
    user?: {
        username: string;
    };
    onCreateSignOutRequest: () => Promise<void>;
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
        return this.props.onCreateSignOutRequest();
    }
}

export default UserState;