import * as React from 'react';
import { RouteComponentProps } from 'react-router-dom';
import AuthHelper from '../helpers/auth';
import { AuthProvider } from '../helpers/interfaces';
import { Link } from 'react-router-dom';

const facebookLoginButton = require('../facebook.png');
const googleLoginButton = require('../btn_google_signin_light_normal_web.png');

interface State {
    email: string;
    invalidEmailMsg?: string;
    password: string;
    invalidPasswordMsg?: string;
    errorMsg?: string;
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

    validateEmail = (email: string) => {
        const validateEmailFormat = () => {
            // tslint:disable-next-line:max-line-length
            var re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
            return re.test(String(email).toLowerCase());
        };
        
        let isValid = false;
        if (!email) {
            this.setState({invalidEmailMsg: 'Email is required'});
        } else if (!validateEmailFormat()) {
            this.setState({invalidEmailMsg: 'Must be a valid email'});
        } else {
            this.setState({invalidEmailMsg: undefined});
            isValid = true;
        }
        return isValid;
    }

    validatePassword = (password: string) => {
        const validatePasswordFormat = () => {
            var re = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[$@$!%*?&])[A-Za-z\d$@$!%*?&]{8,}/;
            return re.test(String(password));
        };
        
        let isValid = false;
        if (!password) {
            this.setState({invalidPasswordMsg: 'Password is required'});
        } else if (!validatePasswordFormat()) {
            // tslint:disable-next-line:max-line-length
            this.setState({invalidPasswordMsg: 'Password must be at least 8 characters long, alphanumeric and contain at least one special character'});
        } else {
            this.setState({invalidPasswordMsg: undefined});
            isValid = true;
        }
        return isValid;
    }

    handleValidation = (event: React.FormEvent<HTMLInputElement>) => {
        const target = event.currentTarget;
        const name = target.name;
        switch (name) {
            case 'email':
                this.validateEmail(this.state.email);
                break;
            case 'password':
                this.validatePassword(this.state.password);
                break;
            default:
                throw 'Unsupported input name';
        }
    }

    isValidForm = () => {
        return [
            this.validateEmail(this.state.email),
            this.validatePassword(this.state.password),
        ].every(Boolean);
    }

    render() {
        return (
            <React.Fragment>
                <h3>Google Login</h3>
                <img src={googleLoginButton} onClick={this.googleSignIn} />
                <h3>Facebook Login</h3>
                <img src={facebookLoginButton} onClick={this.facebookLogin} width="192" />
                <h3>Username and Password</h3>
                <form className="signin" onSubmit={this.localLogin}>
                    {this.state.errorMsg ? <span className="error-msg">{this.state.errorMsg}</span> : ''}
                    <label className={this.state.invalidEmailMsg ? 'invalid' : ''}>
                        Email{this.state.invalidEmailMsg ? ` - ${this.state.invalidEmailMsg}` : ''}
                    </label>
                    <input
                        type="text"
                        name="email"
                        autoComplete="username email"
                        className={this.state.invalidEmailMsg ? 'invalid' : ''}
                        value={this.state.email}
                        onBlur={this.handleValidation}
                        onChange={this.handleInputChange}
                    />
                    
                    <label className={this.state.invalidPasswordMsg ? 'invalid' : ''}>
                        Password{this.state.invalidPasswordMsg ? ` - ${this.state.invalidPasswordMsg}` : ''}
                    </label>
                    <input
                        type="password"
                        name="password"
                        autoComplete="new-password"
                        className={this.state.invalidPasswordMsg ? 'invalid' : ''}
                        value={this.state.password}
                        onBlur={this.handleValidation}
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

    private localLogin = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        if (!this.isValidForm()) {
            this.setState({ errorMsg: 'Please correct errors and try again.' });
            return Promise.resolve();
        }
        
        return fetch(`//localhost:8443/token` +
            `?grant_type=password` +
            `&username=${this.state.email}` +
            `&password=${this.state.password}`)
        .then(r => {
            if (r.status === 200) {
                return r.json();
            }

            throw r.status;
        })
        .then(json => {
            const userDetails = JSON.parse(atob(json.access_token.split('.')[1]));
            const user = { displayName: userDetails.name, email: userDetails.email, idToken: json.access_token, };
            sessionStorage.setItem('LocalUser', JSON.stringify(user));
            const redirectUrl: string = this.props.location
                && this.props.location.state && this.props.location.state.from;
            return this.props.auth.onCreateSignInRequest(AuthProvider.Local, redirectUrl)
                .then(() => this.props.auth.onSignInResponse(this.props.history));
        })
        .catch(err => {
            if (err === 401) {
                this.setState({ errorMsg: 'Invalid credentials, please try again.' });
            } else if (err === 429) {
                this.setState({ errorMsg: 'Too many failed attempts, please try again later.' });
            } else {
                this.setState({ errorMsg: 'An unknown error occurred, please try again later.' });
            }
        });
    }
}