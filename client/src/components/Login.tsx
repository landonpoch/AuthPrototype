import * as React from 'react';
import { RouteComponentProps } from 'react-router-dom';
import AuthHelper from '../helpers/auth';
import { AuthProvider } from '../helpers/interfaces';
import { Link } from 'react-router-dom';

const facebookLoginButton = require('../facebook.png');
const googleLoginButton = require('../btn_google_signin_light_normal_web.png');

interface State {
    email: string;
    password: string;
}

// tslint:disable-next-line:no-any
interface Props extends RouteComponentProps<any> {
    auth: AuthHelper;
}

export default class Login extends React.Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = { email: '', password: '' };
    }

    handleInputChange = (event: React.FormEvent<HTMLInputElement>) => {
        const target = event.currentTarget;
        const name = target.name;
        const value = target.value.trim();
        switch (name) {
            case 'email':
                this.setState({[name]: value});
                break;
            case 'password':
                this.setState({[name]: value});
                break;
            default:
                throw 'Unsupported input name';
        }
    }

    handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        
        fetch(`//localhost:8443/token` +
            `?grant_type=password` +
            `&username=${this.state.email}` +
            `&password=${this.state.password}`)
        .then(response => {
            // 
        });
    }

    render() {
        return (
            <React.Fragment>
                <h3>Google Login</h3>
                <img src={googleLoginButton} onClick={this.googleSignIn} />
                <h3>Facebook Login</h3>
                <img src={facebookLoginButton} onClick={this.facebookLogin} width="192" />
                <h3>Username and Password</h3>
                <form className="signin" onSubmit={this.handleSubmit}>
                    <label>Email:</label>
                    <input
                        type="text"
                        name="email"
                        autoComplete="username email"
                        value={this.state.email}
                        onChange={this.handleInputChange}
                    />
                    
                    <label>Password:</label>
                    <input
                        type="password"
                        name="password"
                        autoComplete="new-password"
                        value={this.state.password}
                        onChange={this.handleInputChange} 
                    />
                    <input type="submit" value="Submit" />
                </form>
                <span>Don't have an account? <Link to="/create-account">Sign Up</Link></span>
            </React.Fragment>
        );
    }

    private googleSignIn = () => {
        const redirectUrl: string = this.props.location && this.props.location.state && this.props.location.state.from;
        return this.props.auth.onCreateSignInRequest(AuthProvider.Google, redirectUrl);
    }

    private facebookLogin = () => {
        const redirectUrl: string = this.props.location && this.props.location.state && this.props.location.state.from;
        return this.props.auth.onCreateSignInRequest(AuthProvider.Facebook, redirectUrl);
    }
}