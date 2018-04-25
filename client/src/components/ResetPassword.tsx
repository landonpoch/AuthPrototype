import * as React from 'react';

interface State {
    password: string;
    invalidPasswordMsg?: string;
    confirmation: string;
    invalidConfirmationMsg?: string;
    errorMsg?: string;
}

export default class ResetPassword extends React.Component<{}, State> {
    constructor(props: {}) {
        super(props);
        this.state = { password: '', confirmation: '' };
    }

    validatePassword = (password: string) => {
        const validatePasswordFormat = () => {
            return /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[$@$!%*?&])[A-Za-z\d$@$!%*?&]{8,}/
                .test(String(password));
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

    validatePasswordConfirmation = (confirmation: string) => {
        let isValid = false;
        if (!confirmation) {
            this.setState({invalidConfirmationMsg: 'Password Confirmation is required'});
        } else if (this.state.password !== confirmation) {
            this.setState({invalidConfirmationMsg: 'Passwords must match'});
        } else {
            this.setState({invalidConfirmationMsg: undefined});
            isValid = true;
        }
        return isValid;
    }

    handleValidation = (event: React.FormEvent<HTMLInputElement>) => {
        const target = event.currentTarget;
        const name = target.name;
        // const value = target.value.trim();
        switch (name) {
            case 'password':
                this.validatePassword(this.state.password);
                break;
            case 'confirmation':
                this.validatePasswordConfirmation(this.state.confirmation);
                break;
            default:
                throw 'Unsupported input name';
        }
    }

    isValidForm = () => {
        return [
            this.validatePassword(this.state.password),
            this.validatePasswordConfirmation(this.state.confirmation),
        ].every(Boolean);
    }

    handleInputChange = (event: React.FormEvent<HTMLInputElement>) => {
        const target = event.currentTarget;
        const name = target.name;
        const value = target.value.trim();
        switch (name) {
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

    resetPassword = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        if (!this.isValidForm()) {
            this.setState({ errorMsg: 'Please correct errors and try again.' });
            return Promise.resolve();
        }

        const params = new URLSearchParams(location.search);
        return fetch('https://localhost:8443/account/confirm-reset', {
            headers: {'Content-Type': 'application/json'},
            method: 'POST',
            body: JSON.stringify({
                email: params.get('email'),
                token: params.get('token'),
                password: this.state.password,
            }),
        })
        .then(r => {
            if (r.status === 200) {
                return r.json();
            }

            throw r.status;
        })
        .then(json => {
            // tslint:disable-next-line:no-console
            console.log(json);
        })
        .catch(console.log);
    }
    
    render() {
        return (
            <React.Fragment>
                <h3>Reset Password</h3>
                <form className="reset" onSubmit={this.resetPassword}>
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
            </React.Fragment>
        );
    }
}