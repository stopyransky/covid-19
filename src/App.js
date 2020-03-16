import React from 'react';
import logo from './logo.svg';
import './App.css';
import * as d3 from 'd3';
const dates = [
  '01-22-2020',
  '01-23-2020',
  '01-24-2020',
  '01-25-2020',
  '01-26-2020',
  '01-27-2020',
  '01-28-2020',
  '01-29-2020',
  '01-30-2020',
  '01-31-2020',
  '02-01-2020',
  '02-02-2020',
  '02-03-2020',
  '02-04-2020',
  '02-05-2020',
  '02-06-2020',
  '02-07-2020',
  '02-08-2020',
  '02-09-2020',
  '02-10-2020',
  '02-11-2020',
  '02-12-2020',
  '02-13-2020',
  '02-14-2020',
  '02-15-2020',
  '02-16-2020',
  '02-17-2020',
  '02-18-2020',
  '02-19-2020',
  '02-20-2020',
  '02-21-2020',
  '02-22-2020',
  '02-23-2020',
  '02-24-2020',
  '02-25-2020',
  '02-26-2020',
  '02-27-2020',
  '02-28-2020',
  '02-29-2020',
  '03-01-2020',
  '03-01-2020',
  '03-02-2020',
  '03-03-2020',
  '03-04-2020',
  '03-05-2020',
  '03-06-2020',
  '03-07-2020',
  '03-08-2020',
  '03-09-2020',
  '03-10-2020',
  '03-11-2020',
  '03-12-2020',
  '03-13-2020',
  '03-14-2020',
  '03-15-2020',
  // '03-16-2020',
]

Promise.all(dates.map( d => d3.csv(`${d}.csv`)))
.then(function(files) {
    console.log(files[0])
    // files[0] will contain file1.csv
    // files[1] will contain file2.csv
}).catch(function(err) {
    // handle error here
});

function App() {
  return (
    <div className="App">
      <header className="App-header">
        <img src={logo} className="App-logo" alt="logo" />
        <p>
          Edit <code>src/App.js</code> and save to reload.
        </p>
        <a
          className="App-link"
          href="https://reactjs.org"
          target="_blank"
          rel="noopener noreferrer"
        >
          Learn React
        </a>
      </header>
    </div>
  );
}

export default App;
