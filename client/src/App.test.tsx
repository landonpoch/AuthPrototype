import * as React from 'react';
import * as ReactDOM from 'react-dom';
import App from './App';
import AuthHelper from './helpers/auth';

// const mockFb = (): Promise<fb.FacebookStatic> => {
//   // tslint:disable-next-line:no-any
//   return Promise.resolve(undefined) as any;
// };
const auth = new AuthHelper();

it('renders without crashing', () => {
  const div = document.createElement('div');
  ReactDOM.render(<App auth={auth} />, div);
});
