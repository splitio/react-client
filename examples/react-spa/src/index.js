import React from 'react';
import ReactDOM from 'react-dom';
import { SplitFactory } from '@splitsoftware/splitio-react';
import './index.css';
import App from './App';
import sdkConfig from './sdkConfig';

ReactDOM.render(
  <SplitFactory config={sdkConfig}>
    <App />
  </SplitFactory>,
  document.getElementById('root')
);