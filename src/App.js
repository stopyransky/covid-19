import React, { useEffect, useRef, useReducer } from 'react';
import './App.css';
import Utils from './utils';
import vis from './vis';

export const THRESHOLD = 1024;
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
  }, []);

  useEffect(() => {
    state.selectedCountry && vis.handleSelect(state.selectedCountry)
  }, [ state.selectedCountry ]);

  const w = window.innerWidth;
  if(w < THRESHOLD) {
    document.body.style.overflowY = 'auto';
  }
  return (
    <div className="app">
      <div style={{
        position: w < THRESHOLD ? 'relative' : 'absolute',
        left: w < THRESHOLD ? null : '120px',
        top: w < THRESHOLD ? null : '220px',
        margin: w < THRESHOLD ? '10px': null,
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
        }}>Select below or hover over a line to see details.</h3>
      <select
        style={{ color: w < THRESHOLD ? 'white': 'black', width: '200px', margin: '5px 0px'}}
        value={state.selectedCountry} onChange={e => {
          dispatch({ type: 'selectedCountry', value: e.target.value })
        }}>
        <option key={-1} value={''}>Select Country</option>
        {state.countries.map(c => (<option value={c} key={c}>{c}</option>))}
      </select>
      <div style={{display: 'flex'}}>
        <p className={'display'} style={{ zIndex: 999, margin: '5px 5px 0px 0px', color: vis.style.strokeColor, fontSize: '12px' }}>
        <a style={{
            color: '#aaa',
          }} noreferer='true' noopener='true' target='blank' href='https://github.com/Omaroid/Covid-19-API'>data source</a>

          </p>
        <p className={'display'} style={{ zIndex: 999,  margin: '5px 0px 0px 5px', color: vis.style.strokeColor, fontSize: '12px' }}>
          <a style={{
            color: '#aaa',
          }} noreferer='true' noopener='true' target='blank' href='https://twitter.com/stopyransky'>author</a>

        </p>
      </div>
      </div>
      <svg
        ref={svgRef}
        width={Math.min(THRESHOLD, window.innerWidth)}
        height={window.innerHeight - 10}>
        <filter id="white-glow" x="-5000%" y="-5000%" width="10000%" height="10000%">
          <feFlood result="flood" floodColor="#ffffff" floodOpacity="1"></feFlood>
          <feComposite in="flood" result="mask" in2="SourceGraphic" operator="in"></feComposite>
          <feMorphology in="mask" result="dilated" operator="dilate" radius="1.0"></feMorphology>
          <feGaussianBlur in="dilated" result="blurred" stdDeviation="5"></feGaussianBlur>
          <feMerge>
              <feMergeNode in="blurred"></feMergeNode>
              <feMergeNode in="SourceGraphic"></feMergeNode>
          </feMerge>
        </filter>
      </svg>
    </div>
  );
}

export default App;
