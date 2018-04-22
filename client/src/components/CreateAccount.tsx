import * as React from 'react';

interface State {
    email: string;
    password: string;
    confirmation: string;
}

export default class CreateAcocunt extends React.Component<{}, State> {
    constructor(props: {}) {
        super(props);
        this.state = { email: '', password: '', confirmation: '' };
    }

    handleInputChange = (event: React.FormEvent<HTMLInputElement>) => {
        const target = event.currentTarget;
        const name = target.name;
        const value = target.value.trim();
        switch (name) {
            case 'email':
                // TODO: email regex validation
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
        .then(response => {
            // 
        });
    }

    render() {
        return (
            <React.Fragment>
                <h3>Create Account</h3>
                <form className="register" onSubmit={this.handleSubmit}>
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
                    
                    <label>Password Confirmation:</label>
                    <input
                        type="password"
                        name="confirmation"
                        autoComplete="new-password"
                        value={this.state.confirmation}
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