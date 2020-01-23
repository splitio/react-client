import React from 'react'

export default function HomePage() {
  return (
    <main>
      <div className="App-intro">
        This example showcases Splitio-React functions.
      </div>
      <div className="App-intro">
        All pages render the same HTML output, but using different approaches for accessing features (i.e. splits) and flags (i.e. treatments).
      </div>
      <div className="App-intro">
        Take a look at the source code for more guidance. Change the SDK config at <i>sdkConfig.js</i> and watch the list of splits updated when navigating between pages.
      </div>
    </main>
  )
}
