import * as React from 'react';
import * as ReactDOM from 'react-dom';
import App from './App';
import registerServiceWorker from './registerServiceWorker';
import './index.css';
import AuthHelper from './helpers/auth';

// var outerResolve: (value?: fb.FacebookStatic | PromiseLike<fb.FacebookStatic> | undefined) => void;

// // TODO: Handle script load failure
// // tslint:disable-next-line:no-any
// var outerReject: (reason?: any) => void;

// const fbLoader = (): Promise<fb.FacebookStatic> => {
//     return new Promise<fb.FacebookStatic>((resolve, reject) => {
//         outerResolve = resolve; 
//         outerReject = reject;
//     });
// };

// // tslint:disable-next-line:no-string-literal
// window['fbAsyncInit'] = function() { outerResolve(FB); };

const authHelper = new AuthHelper();
authHelper.init().then(() => {
    ReactDOM.render(<App auth={authHelper} />, document.getElementById('root') as HTMLElement);
    registerServiceWorker();
});
