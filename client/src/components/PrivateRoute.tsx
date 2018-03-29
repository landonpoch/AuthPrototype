import * as React from 'react';
import Auth from '../helpers/auth';
import { Route, Redirect, RouteProps } from 'react-router-dom';

interface Props extends RouteProps {
  auth: Auth;
}

export default class PrivateRoute extends React.Component<Props, {}> {
  constructor(props: Props) {
    super(props);
  }

  render() {
    const { auth, component: Component, ...rest } = this.props;
    return (
      <Route 
        {...rest}
        render={props =>
          Component && this.props.auth.isAuthenticated() ?
            <Component token={this.props.auth.getToken()} {...props} /> : 
            <Redirect to={{ pathname: '/login', state: { from: location.pathname }, }}  />}
      />
    );
  }
}
