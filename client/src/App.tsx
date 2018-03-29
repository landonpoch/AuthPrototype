import * as React from 'react';
import { BrowserRouter as Router, Route, NavLink } from 'react-router-dom';
import Home from './components/Home';
import UserState from './components/UserState';
import Login from './components/Login';
import SigninHandler from './components/SigninHandler';
import PrivateRoute from './components/PrivateRoute';
import Protected from './components/Protected';
import WebsocketState from './components/WebsocketState';
import './App.css';
import Auth from './helpers/auth';

const logo = require('./logo.svg');

interface State {
    user?: { username: string; };
    id_token?: string;
}

export default class App extends React.Component<{}, State> {
    private auth: Auth;
    
    constructor(props: {}) {
        super(props);
        this.state = { user: undefined, id_token: undefined };
        this.auth = new Auth();
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
                            <UserState auth={this.auth} />
                            </div>
                        </div>
                    </header>
                    
                    <div className="Content">
                        <Route exact={true} path="/" component={Home} />
                        <PrivateRoute path="/protected" auth={this.auth} component={Protected} />
                        <Route path="/login" render={props => <Login auth={this.auth} {...props} />} />
                        <Route path="/signinhandler" render={props => <SigninHandler auth={this.auth} {...props} />} />
                    </div>
                    <footer className="App-footer">
                        <WebsocketState auth={this.auth} />
                    </footer>
                </div>
            </Router>
        );
    }
}
