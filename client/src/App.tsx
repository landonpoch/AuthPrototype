import * as React from 'react';
import { BrowserRouter as Router, Route, Link } from 'react-router-dom';
import Home from './components/Home';
import Login from './components/Login';
import Protected from './components/Protected';
import './App.css';

const logo = require('./logo.svg');

class App extends React.Component {
    constructor(props: {}) {
        super(props);
    }

    render() {
        return (
            <Router>
                <div className="App">
                    <header className="App-header">
                        <img src={logo} className="App-logo" alt="logo" />
                        <h1 className="App-title">Welcome to React</h1>
                    </header>
                    <p className="App-intro">
                        To get started, edit <code>src/App.tsx</code> and save to reload.
                    </p>
                    <ul>
                        <li><Link to="/">Home</Link></li>
                        <li><Link to="/login">Login</Link></li>
                        <li><Link to="/protected">Protected</Link></li>
                    </ul>

                    <Route exact={true} path="/" component={Home} />
                    <Route path="/protected" component={Protected} />
                    <Route path="/login" component={Login} />
                </div>
            </Router>
        );
    }
}

export default App;
