import * as React from 'react';
import { BrowserRouter as Router, Route, NavLink } from 'react-router-dom';
import Home from './components/Home';
import Login from './components/Login';
import SigninHandler from './components/SigninHandler';
import SignoutHandler from './components/SignoutHandler';
import Protected from './components/Protected';
import './App.css';
import { OidcClient } from 'oidc-client';

// tslint:disable-next-line:no-string-literal
window['OidcClient'] = OidcClient;

const logo = require('./logo.svg');

interface State {
    user?: { username: string; };
}

interface OidcResponse {
    state?: {};
    id_token: string;
    session_state: string;
    access_token: string;
    token_type: 'Bearer';
    profile: OidcClaims;
    expires_at: number;
}

interface OidcClaims {
    azp: string;
    sub: string;
    email: string;
    email_verified?: boolean;
    jti: string;
    name: string;
    picture: string[];
    given_name: string;
    family_name: string;
    locale: string;
    profile: string;
    gender: string;
}

class App extends React.Component<{}, State> {
    private client: OidcClient;

    constructor(props: {}) {
        super(props);
        this.state = { user: undefined };
    }

    componentWillMount() {
        this.initUserState();
    }

    render() {
        return (
            <Router>
                <div className="App">
                    <header className="App-header">
                        <img src={logo} className="App-logo" alt="logo" />
                        <h1 className="App-title">Welcome to React</h1>
                    </header>
                    <Login 
                        user={this.state.user}
                        onCreateSignInRequest={this.onCreateSignInRequest}
                        onCreateSignOutRequest={this.onCreateSignOutRequest}
                    />
                    <NavLink to="/">Home</NavLink>
                    <NavLink to="/protected">Protected</NavLink>
                    
                    <Route exact={true} path="/" component={Home} />
                    <Route path="/protected" component={Protected} />
                    <Route 
                        path="/signinhandler" 
                        render={props => <SigninHandler onProcessSigninResponse={this.onProcessSigninResponse} />} 
                    />
                    <Route 
                        path="/signouthandler" 
                        render={props => <SignoutHandler onProcessSignoutResponse={this.onProcessSignoutResponse} />} 
                    />
                </div>
            </Router>
        );
    }

    private onCreateSignInRequest = (thing: {}) => {
        this.getOidcClient().createSigninRequest({ state: { bar: 15 } })
            .then(req => {
                location.assign(req.url);
            }).catch(err => {
                // tslint:disable-next-line:no-console
                console.log(err);
            });
    }

    private onProcessSigninResponse = () => {
        return this.getOidcClient().processSigninResponse()
            .then((response: OidcResponse) => {
                
                // tslint:disable-next-line:no-console
                console.log(response);
                
                localStorage.setItem('id_token', response.id_token);
                localStorage.setItem('access_token', response.access_token);
                localStorage.setItem('profile', JSON.stringify(response.profile));
                localStorage.setItem('exp', JSON.stringify(response.expires_at));
                this.initUserState();

                return fetch('https://localhost:8443/token/test', { 
                    method: 'GET',
                    headers: new Headers({ 'Authorization': `Bearer ${response.id_token}` }),
                }).then(r => r.text())
                .then(text => {
                    // tslint:disable-next-line:no-console
                    console.log(text);
                });
            }).catch(err => {
                // tslint:disable-next-line:no-console
                console.log(err);
            });
    }

    private getOidcClient = (): OidcClient => {
        return this.client = this.client || new OidcClient({
            authority: 'https://accounts.google.com',
            client_id: '832067986394-it9obigmu3qnemg0em02pocq4q4e1gd8.apps.googleusercontent.com',
            redirect_uri: 'https://localhost:3000/signinhandler',
            // post_logout_redirect_uri: 'https://localhost:3000/signouthandler',
            response_type: 'id_token token',
            scope: 'openid profile email',
            filterProtocolClaims: true,
            loadUserInfo: true,
            // TODO: Find out if there is a way to auto populate metadata based on the wellknown url
            // https://accounts.google.com/.well-known/openid-configuration
            metadata: {
                authorization_endpoint: 'https://accounts.google.com/o/oauth2/v2/auth',
                issuer: 'https://accounts.google.com',
                jwks_uri: 'https://www.googleapis.com/oauth2/v3/certs',
                userinfo_endpoint: 'https://www.googleapis.com/oauth2/v3/userinfo',
                end_session_endpoint:
                'https://www.google.com/accounts/Logout?continue=https://appengine.google.com/_ah/logout'
            }
        });
    }

    private initUserState = () => {
        const profileStr = localStorage.getItem('profile');
        if (profileStr) {
            const profile = JSON.parse(profileStr) as OidcClaims;
            this.setState({ user: { username: profile.name }});
        }

        const exp = localStorage.getItem('exp');
        if (exp) {
            const expiresInMs = ((JSON.parse(exp) as number) * 1000) - Date.now();
            setTimeout(this.createSignOutRequest, expiresInMs);
        }
    }

    private onProcessSignoutResponse = () => {
        return this.getOidcClient().processSignoutResponse()
            .then(response => {
                // tslint:disable-next-line:no-console
                console.log(response);
                localStorage.removeItem('id_token');
                localStorage.removeItem('access_token');
                localStorage.removeItem('profile');
                this.setState({ user: undefined });
            });
    }

    private onCreateSignOutRequest = () => {
        return this.createSignOutRequest();
    }

    private createSignOutRequest = () => {
        return this.getOidcClient()
            .createSignoutRequest()
            .then(response => {
                // tslint:disable-next-line:no-console
                console.log(response);
                location.replace(`${response.url}?continue=https://localhost:3000/signouthandler`);
            });
    }
}

export default App;
