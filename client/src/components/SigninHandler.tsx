import * as React from 'react';
import { UserManager } from 'oidc-client';

interface Props {
    mgr: UserManager;
}

export default class SigninHandler extends React.Component<Props, {}> {
    constructor(props: Props) {
        super(props);
    }

    componentWillMount() {
        return this.props.mgr.signinRedirectCallback()
            .then(user => {
                location.replace(user.state || '/');
            });
    }

    render() {
        return null;
    }
}