import * as React from 'react';
import { BrowserRouter as Router, Route, NavLink } from 'react-router-dom';
import Home from './components/Home';
import Login from './components/Login';
import LoginHandler from './components/LoginHandler';
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
                    <ul>
                        <li><NavLink to="/">Home</NavLink></li>
                        <li><NavLink to="/login">Login</NavLink></li>
                        <li><NavLink to="/protected">Protected</NavLink></li>
                        <li><a href="#" onClick={this.removeUserState}>Remove User State</a></li>
                    </ul>
                    
                    <Route exact={true} path="/" component={Home} />
                    <Route path="/protected" component={Protected} />
                    <Route 
                        path="/login" 
                        render={props => 
                        <Login user={this.state.user} onCreateSignInRequest={this.onCreateSignInRequest} />}
                    />
                    <Route 
                        path="/loginhandler" 
                        render={props => <LoginHandler onProcessSigninResponse={this.onProcessSigninResponse} />} 
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
        this.getOidcClient().processSigninResponse()
            .then((response: OidcResponse) => {
                
                // tslint:disable-next-line:no-console
                console.log(response);
                
                localStorage.setItem('id_token', response.id_token);
                localStorage.setItem('access_token', response.access_token);
                localStorage.setItem('profile', JSON.stringify(response.profile));
                localStorage.setItem('exp', JSON.stringify(response.expires_at));
                this.initUserState();

                fetch('https://localhost:8443/token/test', { 
                    method: 'GET',
                    headers: new Headers({ 'Authorization': `Bearer ${response.id_token}` }),
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
            redirect_uri: 'https://localhost:3000/loginhandler',
            post_logout_redirect_uri: 'https://localhost:3000/',
            response_type: 'id_token token',
            scope: 'openid profile email',
            filterProtocolClaims: true,
            loadUserInfo: true,
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
            setTimeout(this.removeUserState, expiresInMs);
        }
    }

    private removeUserState = () => {
        localStorage.removeItem('id_token');
        localStorage.removeItem('access_token');
        localStorage.removeItem('profile');
        this.setState({ user: undefined });
    }
}

export default App;
