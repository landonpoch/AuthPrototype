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

class App extends React.Component<{}, State> {
    private client: OidcClient;

    constructor(props: {}) {
        super(props);
        this.state = { user: undefined };
        fetch(`https://localhost:8443/`)
            .then(response => response.text())
            .then(body => {
                // tslint:disable-next-line:no-console
                console.log(body);
            })
            .catch(err => {
                // tslint:disable-next-line:no-console
                console.log(err);
            });
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
            .then(response => {
                this.setState({ user: { username: response.profile.name }});
                // tslint:disable-next-line:no-console
                console.log(response);
                fetch('https://localhost:8443/', { 
                    method: 'POST',
                    body: JSON.stringify({ token: response.id_token }),
                    headers: new Headers({
                        'Content-Type': 'application/json'
                    })
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
}

export default App;
