import * as React from 'react';
// import { withRouter, RouteComponentProps } from 'react-router-dom';

interface Props {
    user?: {
        username: string;
    };
    onCreateSignInRequest: (args?: {}) => void;
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
                    this.props.user.username :
                    <button onClick={this.props.onCreateSignInRequest}>Login</button>
            }</h3>
        );
    }
}

// export default withRouter(MockLogin);
export default Login;