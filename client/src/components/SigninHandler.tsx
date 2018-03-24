import * as React from 'react';

interface Props {
    onSignInResponse: () => Promise<void>;
}

export default class SigninHandler extends React.Component<Props, {}> {
    constructor(props: Props) {
        super(props);
    }

    render() { return null; }

    componentDidMount() {
        return this.props.onSignInResponse();
    }
}