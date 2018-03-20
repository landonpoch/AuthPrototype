import * as React from 'react';
// import { withRouter, RouteComponentProps } from 'react-router-dom';

interface Props {
    user?: {
        username: string;
    };
    onCreateSignInRequest: (args?: {}) => void;
    onCreateSignOutRequest: () => void;
}

// tslint:disable-next-line:no-any
// type PropsUnion = Props & RouteComponentProps<any>;

class Login extends React.Component<Props, {}> {
    constructor(props: Props) {
        super(props);
    }

    render() {
        return (
            <h3>{
                this.props.user ?
                    <div>
                        <p>{this.props.user.username}</p>
                        <a href="#" onClick={this.props.onCreateSignOutRequest}>Logout</a>
                    </div> :
                    <a href="#" onClick={this.props.onCreateSignInRequest}>Login</a>
            }</h3>
        );
    }
}

// export default withRouter(MockLogin);
export default Login;