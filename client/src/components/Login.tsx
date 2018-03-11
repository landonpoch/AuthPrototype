import * as React from 'react';
import { OidcClient } from 'oidc-client';

// tslint:disable-next-line:no-string-literal
window['OidcClient'] = OidcClient;

export default class Login extends React.Component {
    client: OidcClient;

    constructor(props: {}) {
        super(props);
        this.client = new OidcClient({
            authority: 'https://accounts.google.com',
            client_id: '832067986394-it9obigmu3qnemg0em02pocq4q4e1gd8.apps.googleusercontent.com',
            redirect_uri: 'http://localhost:3000/',
            post_logout_redirect_uri: 'http://localhost:3000/',
            response_type: 'id_token token',
            scope: 'openid https://www.googleapis.com/auth/plus.login profile',
            filterProtocolClaims: true,
            loadUserInfo: true,
        });

        if (location.href.indexOf('#') >= 0) {
            this.processSigninResponse();
        }
    }

    render() {
        return (
            <div>
                <button onClick={this.login}>Login</button>
            </div>
        );
    }

    private login = () => {
        this.client.createSigninRequest({ state: { bar: 15 } })
            .then(req => {
                location.assign(req.url);
            }).catch(err => {
                // tslint:disable-next-line:no-console
                console.log(err);
            });
    }

    private processSigninResponse = () => {
        this.client.processSigninResponse()
            .then(response => {
                const signinResponse = response;
                // tslint:disable-next-line:no-console
                console.log(signinResponse);
            }).catch(err => {
                // tslint:disable-next-line:no-console
                console.log(err);
            });
    }
}