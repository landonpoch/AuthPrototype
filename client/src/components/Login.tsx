import * as React from 'react';

interface Props {
    user?: {
        username: string;
    };
    onCreateSignInRequest: (args?: {}) => void;
    onCreateSignOutRequest: () => void;
}

class Login extends React.Component<Props, {}> {
    constructor(props: Props) {
        super(props);
    }

    render() {
        return (
            this.props.user ?
                (
                    <span>
                        <span>{this.props.user.username}</span>
                        <a href="#" onClick={this.props.onCreateSignOutRequest}>Logout</a>
                    </span>
                ) :
                <a href="#" onClick={this.props.onCreateSignInRequest}>Login</a>
        );
    }
}

export default Login;