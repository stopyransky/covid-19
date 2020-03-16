import React, { useEffect, useRef, useState, useReducer } from 'react';
import * as d3 from 'd3';

import './App.css';
import Utils from './utils';
import vis from './vis';

const defaultState = { countries: [], selectedCountry: '' }

function reducer(state, action) {
  switch(action.type) {
    case 'countries': return { ...state, countries: action.value };
    case 'selectedCountry' : return { ...state, selectedCountry: action.value};
    default: return state;
  }
}
function App() {
  const svgRef = useRef(null);
  const [ state, dispatch ] = useReducer(reducer, defaultState);
  useEffect(() => {
    Promise.all(Utils.files.map(file => d3.csv(file)))
    .then(function(src) {
      const data = Utils.dataPrep(src);
      vis.init(svgRef.current, data);
      dispatch({ type: 'countries', value : data.countries})
    }).catch(function(err) {
        // handle error here
    });
  }, [])
  return (
    <div className="App">
      <select value={state.selectedCountry} onChange={e => { dispatch({ type: 'selectedDountry', value: e.target.value }) }}>
        {state.countries.map(c => (<option value={c} key={c}>{c}</option>))}
      </select>
      <svg ref={svgRef} width={window.innerWidth} height={window.innerHeight}></svg>
    </div>
  );
}

export default App;
