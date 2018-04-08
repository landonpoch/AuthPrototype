import * as React from 'react';
import { RouteComponentProps } from 'react-router-dom';
import AuthHelper from '../helpers/auth';
import { AuthProvider } from '../helpers/interfaces';

const facebookLoginButton = require('../facebook.png');
const googleLoginButton = require('../btn_google_signin_light_normal_web.png');

// tslint:disable-next-line:no-any
interface Props extends RouteComponentProps<any> {
    auth: AuthHelper;
}

export default class Login extends React.Component<Props, {}> {
    constructor(props: Props) {
        super(props);
    }

    render() {
        return (
            <React.Fragment>
                <h3>Google Login</h3>
                <img src={googleLoginButton} onClick={this.googleSignIn} />
                <h3>Facebook Login</h3>
                <img src={facebookLoginButton} onClick={this.facebookLogin} width="192" />
                <h3>Username and Password</h3>
                <span>TODO!</span>
            </React.Fragment>
        );
    }

    private googleSignIn = () => {
        const redirectUrl: string = this.props.location && this.props.location.state && this.props.location.state.from;
        return this.props.auth.onCreateSignInRequest(AuthProvider.Google, redirectUrl);
    }

    private facebookLogin = () => {
        const redirectUrl: string = this.props.location && this.props.location.state && this.props.location.state.from;
        return this.props.auth.onCreateSignInRequest(AuthProvider.Facebook, redirectUrl);
    }
}