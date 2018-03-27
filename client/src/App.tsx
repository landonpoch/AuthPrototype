import * as React from 'react';
import * as H from 'history';
import { BrowserRouter as Router, Route, NavLink } from 'react-router-dom';
import Home from './components/Home';
import UserState from './components/UserState';
import Login from './components/Login';
import SigninHandler from './components/SigninHandler';
import PrivateRoute from './components/PrivateRoute';
import Protected from './components/Protected';
import './App.css';
import { UserManager } from 'oidc-client';

// tslint:disable-next-line:no-string-literal
window['UserManager'] = UserManager;

const logo = require('./logo.svg');

interface State {
    user?: { username: string; };
    id_token?: string;
}

export default class App extends React.Component<{}, State> {
    
    // userManager should be lazy loaded because we don't get config values until
    // the user clicks on the login option they want.
    private _userManager?: UserManager;
    get userManager(): UserManager {
        if (!this._userManager) {
            const userManagerSettings = sessionStorage.getItem('UserManagerSettings');
            const userManager = new UserManager(userManagerSettings ? JSON.parse(userManagerSettings) : {});
            userManager.events.addUserLoaded(this.updateUserState);
            userManager.events.addUserUnloaded(this.updateUserState);
            return userManager;
        }
        return this._userManager;
    }
    
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
                        <NavLink to="/">
                            <img src={logo} className="App-logo" alt="logo" />
                            <h1 className="App-title">Auth Prototype</h1>
                        </NavLink>
                        <div className="App-menu">
                            
                            <div className="App-nav">
                            <NavLink to="/protected">Protected</NavLink>
                            </div>

                            <div className="App-user">
                            <UserState 
                                user={this.state.user}
                                onCreateSignOutRequest={this.onCreateSignOutRequest}
                            />
                            </div>
                        </div>
                    </header>
                    
                    <div className="Content">
                        <Route exact={true} path="/" component={Home} />
                        <PrivateRoute path="/protected" user={this.state.user} component={Protected} />
                        <Route
                            path="/login" 
                            render={props => <Login onCreateSignInRequest={this.onCreateSignInRequest} {...props} />} 
                        />
                        <Route
                            path="/signinhandler" 
                            render={props => <SigninHandler onSignInResponse={this.onSignInResponse} {...props} />}
                        />
                    </div>
                </div>
            </Router>
        );
    }

    private onCreateSignInRequest = (redirectUrl?: string) => {
        return this.userManager.signinRedirect({ state: redirectUrl });
    }

    private onCreateSignOutRequest = (history: H.History) => {
        return this.userManager.removeUser()
            .then(() => { history.push('/'); });
    }

    private onSignInResponse = (history: H.History) => {
        return this.userManager.signinRedirectCallback()
            .then(user => { history.push(user.state || '/'); });
    }

    private updateUserState = () => {
        return this.userManager.getUser().then(user => {
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
}
