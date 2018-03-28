import * as React from 'react';

interface Props {
    token: string;
}

interface State {
    text?: string;
}

export default class Protected extends React.Component<Props, State> {
    public state: State = {};
    componentDidMount() {
        return fetch('https://localhost:8443/token/test', {
            headers: {'Authorization': `Bearer ${this.props.token}`}
        })
        .then(response => response.text())
        .then(text => { this.setState({ text: text }); })
        .catch(err => { this.setState({ text: err.toString() }); });
    }

    render() {
        return (
            <React.Fragment>
                <h3>Protected</h3>
                <span>{this.state.text}</span>
            </React.Fragment>
        );
    }
}