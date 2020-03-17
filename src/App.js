import React, { useEffect, useRef, useReducer } from 'react';
import './App.css';
import Utils from './utils';
import vis from './vis';

const defaultState = { countries: [], selectedCountry: '' }

function reducer(state, action) {
  switch(action.type) {
    case 'countries': return { ...state, countries: action.value };
    case 'selectedCountry' : {
      return { ...state, selectedCountry: action.value};
    }
    default: return state;
  }
}
function App() {
  const svgRef = useRef(null);
  const [ state, dispatch ] = useReducer(reducer, defaultState);

  useEffect(() => {
      let data = Utils.prepData();
      vis.init(svgRef.current, data);
      dispatch({ type: 'countries', value : data.countries})
      vis.dispatcher.on('datapointClick', (country) => {
        console.log('clicked!', country)
        dispatch({ type: 'selectedCountry', value: country})
      })
    // const data = Utils.prepData();

  }, []);

  useEffect(() => {
    state.selectedCountry && vis.handleSelect(state.selectedCountry)
  }, [ state.selectedCountry ]);

  const w = window.innerWidth;
  if(w < 1024) {
    document.body.style.overflow = 'auto';
  }
  return (
    <div className="app">

      <div style={{
        position: w < 1024 ? 'relative' : 'absolute',
        left: w < 1024 ? null : '120px',
        top: w < 1024 ? null : '220px',
        margin: w < 1024 ? '10px': null,
      }}>
        <h1 className={'display'} style={{
          fontWeight: 900,
          color: 'white',
          margin: 0,
          fontSize: '48px'
        }}>Flattening the curve.</h1>
        <h3 className={'display'} style={{
          fontWeight: 700,
          margin: '10px 0px',
          color: vis.style.strokeColor
        }}>Confirmed coronavirus cases per country over time.</h3>
        <h3 className={'display'} style={{
          fontWeight: 700,
          fontSize: '12px',
          margin: '10px 0px',
          color: vis.style.strokeColor
        }}>(select or hover over a line to see details)</h3>
      <select
        style={{ color: w < 1024 ? 'white': 'black', width: '200px', marginBottom: '5px'}}
        value={state.selectedCountry} onChange={e => {
          dispatch({ type: 'selectedCountry', value: e.target.value })
        }}>
        <option key={-1} value={''}>Select Country</option>
        {state.countries.map(c => (<option value={c} key={c}>{c}</option>))}
      </select>
      <p style={{ zIndex: 999, margin: '10px 0px', color: vis.style.strokeColor, fontSize: '12px' }}>
        <span>source: <a style={{
          color: 'white',
        }} noreferer='true' noopener='true' target='blank' href='https://github.com/Omaroid/Covid-19-API'>Covid-19 API, based on WHO data</a></span>
        </p>
      </div>
      <svg
        ref={svgRef}
        width={Math.min(1024, window.innerWidth)}
        height={window.innerHeight}>
      </svg>
    </div>
  );
}

export default App;
