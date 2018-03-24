import * as React from 'react';
import { UserManagerSettings } from 'oidc-client';

const googleLoginButton = require('../btn_google_signin_light_normal_web.png');
const googleSettings: UserManagerSettings = {
    authority: 'https://accounts.google.com/.well-known/openid-configuration',
    client_id: '832067986394-it9obigmu3qnemg0em02pocq4q4e1gd8.apps.googleusercontent.com',
    redirect_uri: 'https://localhost:3000/signinhandler',
    response_type: 'id_token',
    scope: 'openid profile email',
    prompt: 'consent',
};

interface Props {
    location?: { state?: { from?: string; }; };
    onCreateSignInRequest: (redirectUrl?: string) => Promise<void>; 
}

export default class Login extends React.Component<Props, {}> {
    constructor(props: Props) {
        super(props);
    }

    render() {
        return (
            <React.Fragment>
                <h3>Login</h3><img src={googleLoginButton} onClick={this.googleSignIn} />
            </React.Fragment>
        );
    }

    private googleSignIn = () => {
        sessionStorage.setItem('UserManagerSettings', JSON.stringify(googleSettings));
        const redirectUrl = this.props.location && this.props.location.state && this.props.location.state.from;
        return this.props.onCreateSignInRequest(redirectUrl);
    }
}