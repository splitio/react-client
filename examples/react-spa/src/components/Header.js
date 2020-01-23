import React from 'react';
import logo from '../logo.svg';

export default () => {
  return (
    <header className="App-header">
      <img src={logo} className="App-logo" alt="logo" />
      <h1 className="App-title">Splitio-React SDK example</h1>
      <a
        className="App-link"
        href="https://www.split.io/"
        target="_blank"
        rel="noopener noreferrer"
      >
        Split.io
      </a>
    </header>
  );
}
