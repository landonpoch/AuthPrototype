import * as React from 'react';
import * as ReactDOM from 'react-dom';
import App from './App';
import registerServiceWorker from './registerServiceWorker';
import './index.css';
import Auth from './helpers/auth';

const auth = new Auth();
auth.init()
  .then(() => {
    ReactDOM.render(
      <App auth={auth} />,
      document.getElementById('root') as HTMLElement
    );
    registerServiceWorker();    
  });