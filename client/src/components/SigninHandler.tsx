import * as React from 'react';
import AuthHelper from '../helpers/auth';
import { RouteComponentProps } from 'react-router-dom';

// tslint:disable-next-line:no-any
interface Props extends RouteComponentProps<any> {
    auth: AuthHelper;
}

export default class SigninHandler extends React.Component<Props, {}> {
    constructor(props: Props) {
        super(props);
    }

    render() { return null; }
    
    componentDidMount() {
        return this.props.auth.onSignInResponse(this.props.history);
    }
}
