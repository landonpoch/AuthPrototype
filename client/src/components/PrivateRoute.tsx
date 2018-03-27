import * as React from 'react';
import { Route, Redirect, RouteProps } from 'react-router-dom';

interface Props extends RouteProps {
  user?: { username: string };
}

export default class PrivateRoute extends React.Component<Props, {}> {
  constructor(props: Props) {
    super(props);
  }

  render() {
    const { user, component: Component, ...rest } = this.props;
    return (
      <Route 
        {...rest}
        render={props =>
          Component && user ?
            <Component {...props} /> :
            <Redirect to={{ pathname: '/login', state: { from: location.pathname }, }}  />}
      />
    );
  }
}
