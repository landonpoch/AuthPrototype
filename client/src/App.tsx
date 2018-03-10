import * as React from 'react';
import './App.css';
import { OidcClient } from 'oidc-client';

// tslint:disable-next-line:no-string-literal
window['OidcClient'] = OidcClient;

const logo = require('./logo.svg');

class App extends React.Component {
  client: OidcClient;

  constructor(props: {}) {
    super(props);
    this.client = new OidcClient({
      authority: 'https://accounts.google.com',
      client_id: '832067986394-it9obigmu3qnemg0em02pocq4q4e1gd8.apps.googleusercontent.com',
      redirect_uri: 'http://localhost:3000/',
      post_logout_redirect_uri: '',
      response_type: 'id_token token',
      scope: 'openid https://www.googleapis.com/auth/plus.login profile',
      filterProtocolClaims: true,
      loadUserInfo: true,
    });
    // tslint:disable-next-line:no-console
    console.log(this.client);

    if (window.location.href.indexOf('#') >= 0) {
      this.processSigninResponse();
    }
  }

  login = () => {
    this.client.createSigninRequest({ state: { bar: 15 } })
      .then(req => {
        location.assign(req.url);
      }).catch(err => {
        // tslint:disable-next-line:no-console
        console.log(err);
      });
  }

  processSigninResponse = () => {
    this.client.processSigninResponse()
      .then(response => {
          const signinResponse = response;
          // tslint:disable-next-line:no-console
          console.log(signinResponse);
      }).catch(err => {
          // tslint:disable-next-line:no-console
          console.log(err);
      });
  }

  render() {
    return (
      <div className="App">
        <header className="App-header">
          <img src={logo} className="App-logo" alt="logo" />
          <h1 className="App-title">Welcome to React</h1>
        </header>
        <p className="App-intro">
          To get started, edit <code>src/App.tsx</code> and save to reload.
        </p>
        <button onClick={this.login}>Login!</button>
      </div>
    );
  }
}

export default App;
