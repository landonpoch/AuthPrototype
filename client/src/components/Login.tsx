import * as React from 'react';
import { RouteComponentProps } from 'react-router-dom';
import AuthHelper, { AuthProvider } from '../helpers/auth';

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
                <button onClick={this.facebookLogout}>Logout</button>
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
        // tslint:disable-next-line:max-line-length
        // const redirectUrl: string = this.props.location && this.props.location.state && this.props.location.state.from;
        // return this.props.auth.onCreateSignInRequest(AuthProvider.Facebook, redirectUrl);
        
        // https://stackoverflow.com/questions/7125320/facebook-login-without-pop-up
        // var uri = encodeURI(location.href);
        const uri = encodeURI('https://localhost:3000/'); // Should be using signinhandler
        // https://developers.facebook.com/apps/174980966636737/fb-login/settings/
        // https://www.facebook.com/settings?tab=applications
        FB.getLoginStatus(response => {
            if (response.status === 'connected') {
                // window.location.href=uri;
            } else {
                // tslint:disable-next-line:max-line-length
                const loginUri = encodeURI(`https://www.facebook.com/dialog/oauth?client_id=174980966636737&redirect_uri=${uri}&response_type=token&state=bleh`);
                location.replace(loginUri);
                // this.props.history.push(loginUri);
            }
        });

        // FB.login(
        //     response => {
        //         // tslint:disable-next-line:no-console
        //         console.log('Begin login callback');
        // tslint:disable-next-line:max-line-length
        //         fetch(`//localhost:8443/token?grant_type=facebook_access_token&client_id=174980966636737&facebook_access_token=${response.authResponse.accessToken}`)
        //             .then(r => r.json())
        //             .then(console.log)
        //             .catch(console.log);
        //         // tslint:disable-next-line:no-console
        //         console.log(response);
        //         // tslint:disable-next-line:no-console
        //         console.log('End login callback');
        //     },
        //     { scope: 'public_profile,email' });
    }

    private facebookLogout = () => {
        FB.logout(response => {
            // tslint:disable-next-line:no-console
            console.log('Begin logout callback');
            // tslint:disable-next-line:no-console
            console.log(response);
            // tslint:disable-next-line:no-console
            console.log('End logout callback');
        });
    }
}