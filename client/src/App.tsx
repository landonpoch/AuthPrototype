import * as React from 'react';
import { BrowserRouter as Router, Route, NavLink } from 'react-router-dom';
import Home from './components/Home';
import CreateAccount from './components/CreateAccount';
import UserState from './components/UserState';
import Login from './components/Login';
import SigninHandler from './components/SigninHandler';
import PrivateRoute from './components/PrivateRoute';
import Protected from './components/Protected';
import WebsocketState from './components/WebsocketState';
import './App.css';
import AuthHelper from './helpers/auth';

const logo = require('./logo.svg');

interface Props {
    auth: AuthHelper;
}

interface State {
    user?: { username: string; };
    id_token?: string;
}

export default class App extends React.Component<Props, State> {
    constructor(props: Props) {
        super(props);
        if (this.props.auth.isAuthenticated()) {
            this.state = {
                user: { username: this.props.auth.getDisplayName() },
                id_token: this.props.auth.getToken(),
            };
        } else {
            this.state = { user: undefined, id_token: undefined };
        }
    }

    render() {
        return (
            <Router>
                <React.Fragment>
                <header className="header">
                    <NavLink to="/">
                        <img src={logo} className="logo" alt="logo" />
                        <h1 className="title">Auth Prototype</h1>
                    </NavLink>
                    <div className="menu">
                        <div className="nav">
                        <NavLink to="/protected">Protected</NavLink>
                        </div>

                        <div className="user">
                        <UserState auth={this.props.auth} />
                        </div>
                    </div>
                </header>
                
                <section className="content">
                    <div className="content-body">
                        <Route exact={true} path="/" component={Home} />
                        <Route path="/create-account" component={CreateAccount} />
                        <PrivateRoute path="/protected" auth={this.props.auth} component={Protected} />
                        <Route path="/login" render={props => <Login auth={this.props.auth} {...props} />} />
                        <Route
                            path="/signinhandler"
                            render={props => <SigninHandler auth={this.props.auth} {...props} />}
                        />
                    </div>
                </section>

                <footer className="footer">
                    <WebsocketState auth={this.props.auth} />
                </footer>
                </React.Fragment>
            </Router>
        );
    }
}
