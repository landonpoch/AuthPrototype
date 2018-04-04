import * as React from 'react';
import * as ReactDOM from 'react-dom';
import App from './App';
import registerServiceWorker from './registerServiceWorker';
import './index.css';
import AuthHelper from './helpers/auth';

const authHelper = new AuthHelper();
authHelper.init().then(() => {
    ReactDOM.render(<App auth={authHelper} />, document.getElementById('root') as HTMLElement);
    registerServiceWorker();
});
