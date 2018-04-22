import * as React from 'react';
import { RouteComponentProps } from 'react-router-dom';
import AuthHelper from '../helpers/auth';
import { AuthProvider } from '../helpers/interfaces';

// tslint:disable-next-line:no-any
interface Props extends RouteComponentProps<any> {
    auth: AuthHelper;
}

interface State {
    email: string;
    invalidEmailMsg?: string;
    password: string;
    invalidPasswordMsg?: string;
    confirmation: string;
    invalidConfirmationMsg?: string;
}

export default class CreateAcocunt extends React.Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = { email: '', password: '', confirmation: '' };
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
            case 'confirmation':
                this.setState({[name]: value});
                break;
            default:
                throw 'Unsupported input name';
        }
    }

    validateEmail = (email: string) => {
        // tslint:disable-next-line:max-line-length
        var re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
        return re.test(String(email).toLowerCase());
    }

    validatePassword = (password: string) => {
        var re = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[$@$!%*?&])[A-Za-z\d$@$!%*?&]{8,}/;
        return re.test(String(password));
    }

    handleValidation = (event: React.FormEvent<HTMLInputElement>) => {
        const target = event.currentTarget;
        const name = target.name;
        // const value = target.value.trim();
        switch (name) {
            case 'email':
                if (!this.state.email) {
                    this.setState({invalidEmailMsg: 'Email is required'});
                } else if (!this.validateEmail(this.state.email)) {
                    this.setState({invalidEmailMsg: 'Must be a valid email'});
                } else {
                    this.setState({invalidEmailMsg: undefined});
                }
                break;
            case 'password':
                if (!this.state.password) {
                    this.setState({invalidPasswordMsg: 'Password is required'});
                } else if (!this.validatePassword(this.state.password)) {
                    // tslint:disable-next-line:max-line-length
                    this.setState({invalidPasswordMsg: 'Password must be at least 8 characters long, alphanumeric and contain at least one special character'});
                } else {
                    this.setState({invalidPasswordMsg: undefined});
                }
                break;
            case 'confirmation':
                if (this.state.password !== this.state.confirmation) {
                    this.setState({invalidConfirmationMsg: 'Passwords must match'});
                } else {
                    this.setState({invalidConfirmationMsg: undefined});
                }
                break;
            default:
                throw 'Unsupported input name';
        }
    }

    handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        
        fetch('https://localhost:8443/account/create', {
            headers: {'Content-Type': 'application/json'},
            method: 'PUT',
            body: JSON.stringify({
                username: this.state.email,
                password: this.state.password,
            }),
        })
        .then(r => {
            if (r.status === 200) {
                return r.json();
            } else if (r.status === 401) {
                throw 'unauthorized';
            } else {
                throw 'unexpected http status code';
            }
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
            if (err === 'unauthorized') {
                // TODO: Handle
            } else {
                // TODO: Handle
            }
        });
    }

    render() {
        return (
            <React.Fragment>
                <h3>Create Account</h3>
                <form className="register" onSubmit={this.handleSubmit}>
                    <label className={this.state.invalidEmailMsg ? 'invalid' : ''}>
                        Email{this.state.invalidEmailMsg ? ` - ${this.state.invalidEmailMsg}` : ''}
                    </label>
                    <input
                        type="text"
                        name="email"
                        className={this.state.invalidEmailMsg ? 'invalid' : ''}
                        autoComplete="username email"
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
                        className={this.state.invalidPasswordMsg ? 'invalid' : ''}
                        autoComplete="new-password"
                        value={this.state.password}
                        onBlur={this.handleValidation}
                        onChange={this.handleInputChange} 
                    />
                    
                    <label className={this.state.invalidConfirmationMsg ? 'invalid' : ''}>
                        Password Confirmation
                        {this.state.invalidConfirmationMsg ? ` - ${this.state.invalidConfirmationMsg}` : ''}
                    </label>
                    <input
                        type="password"
                        name="confirmation"
                        className={this.state.invalidConfirmationMsg ? 'invalid' : ''}
                        autoComplete="new-password"
                        value={this.state.confirmation}
                        onBlur={this.handleValidation}
                        onChange={this.handleInputChange}
                    />
                    
                    <input type="submit" value="Submit" />
                </form>
                {/* <h3>Values</h3>
                <textarea
                    readOnly={true}
                    rows={5}
                    cols={50}
                    value={JSON.stringify(this.state, undefined, 4)}
                /> */}
            </React.Fragment>
        );
    }
}