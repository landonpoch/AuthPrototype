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
                id_token: this.props.auth.getToken() 
            };
        } else {
            this.state = { user: undefined, id_token: undefined };
        }
    }

    loadFbLoginApi() {
        // tslint:disable-next-line:no-string-literal
        window['fbAsyncInit'] = function() {
            FB.init({
                appId      : '174980966636737',
                cookie     : true,  // enable cookies to allow the server to access
                // the session
                xfbml      : true,  // parse social plugins on this page
                version    : 'v2.12' // use version 2.1
            });

            FB.AppEvents.logPageView();
            FB.getLoginStatus(response => {
                // tslint:disable-next-line:no-console
                console.log('Being getLoginStatus');
                // tslint:disable-next-line:no-console
                console.log(response);
                // tslint:disable-next-line:no-console
                console.log('End getLoginStatus');
            });
        };

        // tslint:disable-next-line:no-console
        console.log('Loading fb api');
          // Load the SDK asynchronously
        (function(d: Document, s: string, id: string) {
            var js, fjs = d.getElementsByTagName(s)[0];
            if (d.getElementById(id)) {
                return;
            }
            js = d.createElement(s); js.id = id;
            // tslint:disable-next-line:no-any
            (js as any).src = '//connect.facebook.net/en_US/sdk.js';
            // tslint:disable-next-line:no-any
            (fjs as any).parentNode.insertBefore(js, fjs);
        }(document, 'script', 'facebook-jssdk'));
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

    componentWillMount() {
        // TODO: This sucker takes too long to load
        // https://stackoverflow.com/questions/42847126/script-load-in-react
        this.loadFbLoginApi();
    }
}
