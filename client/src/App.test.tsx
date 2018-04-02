import * as React from 'react';
import * as ReactDOM from 'react-dom';
import App from './App';
import AuthHelper from './helpers/auth';

const auth = new AuthHelper();
it('renders without crashing', () => {
  const div = document.createElement('div');
  ReactDOM.render(<App auth={auth} />, div);
});
