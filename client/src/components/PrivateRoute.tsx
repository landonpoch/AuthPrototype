import * as React from 'react';
import { Route, Redirect } from 'react-router-dom';

// tslint:disable-next-line:no-any
const PrivateRoute: (stuff: any) => JSX.Element = ({ getUser, component: Component, ...rest }) => (
    <Route
      {...rest}
      render={props =>
        getUser() ? (
          <Component {...props} />
        ) : (
          <Redirect
            to={{
                pathname: '/login',
                state: { from: location.pathname },
            }} 
          />
        )
      }
    />
  );

export default PrivateRoute;