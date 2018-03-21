import * as React from 'react';
import { BrowserRouter as Router, Route, NavLink } from 'react-router-dom';
import Home from './components/Home';
import Login from './components/Login';
import SigninHandler from './components/SigninHandler';
import Protected from './components/Protected';
import './App.css';
import { UserManager, UserManagerSettings } from 'oidc-client';

// tslint:disable-next-line:no-string-literal
window['UserManager'] = UserManager;

const logo = require('./logo.svg');

interface State {
    user?: { username: string; };
    id_token?: string;
}

class App extends React.Component<{}, State> {
    private mgr: UserManager;

    constructor(props: {}) {
        super(props);
        this.state = { user: undefined, id_token: undefined };
    }

    componentWillMount() {
        this.updateUserState();
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
                    <Route path="/signinhandler" component={SigninHandler} />
                </div>
            </Router>
        );
    }

    private onCreateSignInRequest = (thing: {}) => {
        return this.getUserManager()
            .signinPopup()
            .then(response => {
                // tslint:disable-next-line:no-console
                console.log(response);

                return fetch('https://localhost:8443/token/test', { 
                    method: 'GET',
                    headers: new Headers({ 'Authorization': `Bearer ${response.id_token}` }),
                });
            })
            .then(r => r.text())
            .then(console.log)
            .catch(err => {
                // tslint:disable-next-line:no-console
                console.log(err);
            });
    }

    private getUserManager = (): UserManager => {
        if (!this.mgr) {
            const userManagerSettings: UserManagerSettings = {
                authority: 'https://accounts.google.com/.well-known/openid-configuration',
                client_id: '832067986394-it9obigmu3qnemg0em02pocq4q4e1gd8.apps.googleusercontent.com',
                redirect_uri: 'https://localhost:3000/signinhandler',
                response_type: 'id_token',
                scope: 'openid profile email',
                prompt: 'consent',
            };
            const mgr = new UserManager(userManagerSettings);
            mgr.events.addUserLoaded(() => {
                this.updateUserState();
            });
            mgr.events.addUserUnloaded(() => {
                this.updateUserState();
            });
            this.mgr = mgr;
        }
        return this.mgr;
    }

    private updateUserState = () => {
        return this.getUserManager().getUser()
            .then(user => {
                if (user && user.profile && user.profile.name) {
                    this.setState({
                        user: { username: user.profile.name },
                        id_token: user.id_token
                    });
                } else {
                    this.setState({ user: undefined, id_token: undefined });
                }
            });
    }

    private onCreateSignOutRequest = () => {
        return this.getUserManager().removeUser();
    }
}

export default App;
