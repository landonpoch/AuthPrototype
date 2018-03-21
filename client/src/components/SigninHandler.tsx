import * as React from 'react';
import { UserManager } from 'oidc-client';

// tslint:disable-next-line:no-string-literal
window['UserManager'] = UserManager;

export default class SigninHandler extends React.Component<{}, {}> {
    constructor(props: {}) {
        super(props);
    }

    componentWillMount() {
        new UserManager({}).signinPopupCallback();
    }

    render() {
        return null;
    }
}