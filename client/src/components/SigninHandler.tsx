import * as React from 'react';
import * as H from 'history';
import { RouteComponentProps } from 'react-router-dom';

// tslint:disable-next-line:no-any
interface Props extends RouteComponentProps<any> {
    onSignInResponse: (history: H.History) => Promise<void>;
}

export default class SigninHandler extends React.Component<Props, {}> {
    constructor(props: Props) {
        super(props);
    }

    render() { return null; }

    componentWillMount() {
        return this.props.onSignInResponse(this.props.history);
    }
}
