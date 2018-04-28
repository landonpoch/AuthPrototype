import * as React from 'react';

interface Props {
    token: string;
}

interface State {
    currentPassword: string;
    invalidCurrentPasswordMsg?: string;
    newPassword: string;
    invalidNewPasswordMsg?: string;
    confirmation: string;
    invalidConfirmationMsg?: string;
    errorMsg?: string;
}

export default class ChangePassword extends React.Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = { currentPassword: '', newPassword: '', confirmation: '' };
    }

    validatePassword = (password: string) => {
        const validatePasswordFormat = () => {
            return /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[$@$!%*?&])[A-Za-z\d$@$!%*?&]{8,}/
                .test(String(password));
        };

        let isValid = false;
        if (!password) {
            this.setState({invalidCurrentPasswordMsg: 'Current Password is required'});
        } else if (!validatePasswordFormat()) {
            // tslint:disable-next-line:max-line-length
            this.setState({invalidCurrentPasswordMsg: 'Current Password must be at least 8 characters long, alphanumeric and contain at least one special character'});
        } else {
            this.setState({invalidCurrentPasswordMsg: undefined});
            isValid = true;
        }
        return isValid;
    }

    validateNewPassword = (password: string) => {
        const validatePasswordFormat = () => {
            return /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[$@$!%*?&])[A-Za-z\d$@$!%*?&]{8,}/
                .test(String(password));
        };

        let isValid = false;
        if (!password) {
            this.setState({invalidNewPasswordMsg: 'New Password is required'});
        } else if (!validatePasswordFormat()) {
            // tslint:disable-next-line:max-line-length
            this.setState({invalidNewPasswordMsg: 'New Password must be at least 8 characters long, alphanumeric and contain at least one special character'});
        } else {
            this.setState({invalidNewPasswordMsg: undefined});
            isValid = true;
        }
        return isValid;
    }

    validatePasswordConfirmation = (confirmation: string) => {
        let isValid = false;
        if (!confirmation) {
            this.setState({invalidConfirmationMsg: 'Password Confirmation is required'});
        } else if (this.state.newPassword !== confirmation) {
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
            case 'currentPassword':
                this.validatePassword(this.state.currentPassword);
                break;
            case 'newPassword':
                this.validateNewPassword(this.state.newPassword);
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
            this.validatePassword(this.state.currentPassword),
            this.validatePasswordConfirmation(this.state.confirmation),
        ].every(Boolean);
    }

    handleInputChange = (event: React.FormEvent<HTMLInputElement>) => {
        const target = event.currentTarget;
        const name = target.name;
        const value = target.value.trim();
        switch (name) {
            case 'currentPassword':
                this.setState({[name]: value});
                break;
            case 'newPassword':
                this.setState({[name]: value});
                break;
            case 'confirmation':
                this.setState({[name]: value});
                break;
            default:
                throw 'Unsupported input name';
        }
    }

    changePassword = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        if (!this.isValidForm()) {
            this.setState({ errorMsg: 'Please correct errors and try again.' });
            return Promise.resolve();
        }

        return fetch('//localhost:8443/account/change-password', {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${this.props.token}`
            },
            method: 'POST',
            body: JSON.stringify({
                password: this.state.currentPassword,
                new_password: this.state.newPassword,
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
            <h3>Change Password</h3>
            <form className="change" onSubmit={this.changePassword}>
                <label className={this.state.invalidCurrentPasswordMsg ? 'invalid' : ''}>
                    Current Password{this.state.invalidCurrentPasswordMsg ?
                        ` - ${this.state.invalidCurrentPasswordMsg}` : ''}
                </label>
                <input
                    type="password"
                    name="currentPassword"
                    className={this.state.invalidCurrentPasswordMsg ? 'invalid' : ''}
                    autoComplete="new-password"
                    value={this.state.currentPassword}
                    onBlur={this.handleValidation}
                    onChange={this.handleInputChange} 
                />

                <label className={this.state.invalidNewPasswordMsg ? 'invalid' : ''}>
                    New Password{this.state.invalidNewPasswordMsg ?
                        ` - ${this.state.invalidNewPasswordMsg}` : ''}
                </label>
                <input
                    type="password"
                    name="newPassword"
                    className={this.state.invalidNewPasswordMsg ? 'invalid' : ''}
                    autoComplete="new-password"
                    value={this.state.newPassword}
                    onBlur={this.handleValidation}
                    onChange={this.handleInputChange} 
                />
                
                <label className={this.state.invalidConfirmationMsg ? 'invalid' : ''}>
                    New Password Confirmation
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