import React, { useEffect, useRef, useReducer } from 'react';
import './App.css';
import Utils from './utils';
import vis from './vis';
import * as d3 from 'd3';

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
    console.log()
    const data = Utils.prepData();
    vis.init(svgRef.current, data);
    dispatch({ type: 'countries', value : data.countries})
    // }).catch(function(err) {
    //   console.log(err)
    //     // handle error here
    // });
    vis.dispatcher.on('datapointClick', (country) => {
      console.log('clicked!', country)
      dispatch({ type: 'selectedCountry', value: country})
    })
  }, []);

  useEffect(() => {
    state.selectedCountry && vis.handleSelect(state.selectedCountry)
  }, [ state.selectedCountry ])
  return (
    <div className="App">
      <select value={state.selectedCountry} onChange={e => {
        dispatch({ type: 'selectedCountry', value: e.target.value })
      }}>
        <option key={-1} value={''}>Select Country</option>
        {state.countries.map(c => (<option value={c} key={c}>{c}</option>))}
      </select>
      <svg ref={svgRef} width={window.innerWidth} height={window.innerHeight}></svg>
    </div>
  );
}

export default App;
