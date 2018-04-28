import * as React from 'react';

interface State {
    email: string;
    invalidEmailMsg?: string;
    errorMsg?: string;
}

export default class ForgotPassword extends React.Component<{}, State> {
    constructor(props: {}) {
        super(props);
        this.state = { email: '' };
    }
    
    handleInputChange = (event: React.FormEvent<HTMLInputElement>) => {
        const target = event.currentTarget;
        const name = target.name;
        const value = target.value.trim();
        switch (name) {
            case 'email':
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

    handleValidation = (event: React.FormEvent<HTMLInputElement>) => {
        const target = event.currentTarget;
        const name = target.name;
        switch (name) {
            case 'email':
                this.validateEmail(this.state.email);
                break;
            default:
                throw 'Unsupported input name';
        }
    }

    isValidForm = () => {
        return this.validateEmail(this.state.email);
    }

    render() {
        return (
            <React.Fragment>
                <h3>Forgot Password</h3>
                <form className="forgot" onSubmit={this.resetPassword}>
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
                    <input type="submit" value="Send Reset Email" />
                </form>
            </React.Fragment>
        );
    }

    private resetPassword = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        if (!this.isValidForm()) {
            this.setState({ errorMsg: 'Please correct errors and try again.' });
            return Promise.resolve();
        }

        return fetch('//localhost:8443/account/forgot-password', {
            headers: {'Content-Type': 'application/json'},
            method: 'POST',
            body: JSON.stringify({ email: this.state.email }),
        })
        .then(r => r.json())
        .then(console.log)
        .catch(console.log);
    }
}