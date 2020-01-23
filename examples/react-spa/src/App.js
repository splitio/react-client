import React from 'react';
import { Route, Link, BrowserRouter } from 'react-router-dom'
import Header from './components/Header';
import HomePage from './pages/HomePage';
import PageUsingComponents from './pages/PageUsingComponents';
import PageUsingHOCs from './pages/PageUsingHOCs';
import PageUsingHooks from './pages/PageUsingHooks';

const App = () => {
  return (
    <div className="App">
      <BrowserRouter>
        <div>
          <Header />
          <nav className="crumbs">
            <ul>
              <li className="crumb">
                <Link to="/">Home</Link>
              </li>
              <li className="crumb">
                <Link to="/components">Page using components</Link>
              </li>
              <li className="crumb">
                <Link to="/hocs">Page using HOCs</Link>
              </li>
              <li className="crumb">
                <Link to="/hooks">Page using hooks</Link>
              </li>
            </ul>
          </nav>

          <Route path="/" exact component={HomePage} />
          <Route path="/components" component={PageUsingComponents} />
          <Route path="/hocs" component={PageUsingHOCs} />
          <Route path="/hooks" component={PageUsingHooks} />

        </div>
      </BrowserRouter>
    </div>
  );
};

export default App;
