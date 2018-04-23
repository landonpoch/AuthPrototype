import * as React from 'react';
import { RouteComponentProps } from 'react-router-dom';
import AuthHelper from '../helpers/auth';
import { AuthProvider } from '../helpers/interfaces';

// tslint:disable-next-line:no-any
interface Props extends RouteComponentProps<any> {
    auth: AuthHelper;
}

export default class ConfirmAccount extends React.Component<Props, {}> {
    constructor(props: Props) {
        super(props);
    }
    
    componentDidMount() {
        const params = new URLSearchParams(location.search);
        fetch(`//localhost:8443/account/confirm?id=${params.get('token')}`)
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
                // TODO: look into disabling the redirect for account confirmations
                const redirectUrl: string = this.props.location
                    && this.props.location.state && this.props.location.state.from;
                return this.props.auth.onCreateSignInRequest(AuthProvider.Local, redirectUrl)
                    .then(() => this.props.auth.onSignInResponse(this.props.history));
            });
    }
    
    render() {
        return <h3>Confirm Account</h3>;
    }
}