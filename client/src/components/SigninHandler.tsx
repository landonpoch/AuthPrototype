import * as React from 'react';
import { Redirect } from 'react-router-dom';

interface Props {
    onProcessSigninResponse: () => void;
}

export default class SigninHandler extends React.Component<Props, {}> {
    constructor(props: Props) {
        super(props);
    }

    componentWillMount() {
        this.props.onProcessSigninResponse();
    }

    render() {
        return <Redirect to={{ pathname: `/` }} />;
    }
}