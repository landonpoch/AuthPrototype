import * as React from 'react';
import { Route, Redirect, RouteProps } from 'react-router-dom';

interface Props extends RouteProps {
  getUser: () => { username: string } | undefined;
}

export default class PrivateRoute extends React.Component<Props, {}> {
  constructor(props: Props) {
    super(props);
  }

  render() {
    const { getUser, component: Component, ...rest } = this.props;
    return (
      <Route 
        {...rest}
        render={props =>
          Component && getUser() ?
            <Component {...props} /> :
            <Redirect to={{ pathname: '/login', state: { from: location.pathname }, }}  />}
      />
    );
  }
}
