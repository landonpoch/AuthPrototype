import * as React from 'react';
import { Redirect } from 'react-router-dom';

interface Props {
    onProcessSignoutResponse: () => void;
}

export default class SignoutHandler extends React.Component<Props, {}> {
    constructor(props: Props) {
        super(props);
    }

    componentWillMount() {
        this.props.onProcessSignoutResponse();
    }

    render() {
        return <Redirect to={{ pathname: `/` }} />;
    }
}