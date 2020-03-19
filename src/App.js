import React, { useEffect, useRef, useReducer, useCallback } from 'react';
import './App.css';
import Utils from './utils';
import vis from './vis';

export const THRESHOLD = 1200;

function Radio ({ type, value, onChange, isChecked }) {
  return (
    <div style={{ color: 'white', marginRight: '8px' }}>
      <input
        type="radio"
        id={value}
        name={type}
        value={value}
        checked={isChecked}
        onChange={e => onChange(e.target.value)}
      />
      <label
        className={'display'}
        style={{ marginLeft: '4px', color: isChecked ? vis.style.strokeColor: 'white' }}
        htmlFor={value}>{value}</label>
    </div>
  )
}

function DatasetSelection({ onChange, selected })  {
  return (
    <div style={{ display: 'flex' }}>
      <Radio type="caseType" value="confirmed" isChecked={selected === 'confirmed'} onChange={onChange}/>
      <Radio type="caseType" value="deaths" isChecked={selected === 'deaths'} onChange={onChange}/>
      <Radio type="caseType" value="recovered" isChecked={selected === 'recovered'} onChange={onChange} />
    </div>
  )
}

const defaultState = { countries: [], selectedCountry: '', caseType: 'confirmed' }

function reducer(state, action) {
  switch(action.type) {
    case 'countries': return { ...state, countries: action.value };
    case 'selectedCountry' : {
      return { ...state, selectedCountry: action.value};
    }
    case 'caseType': {
      return { ...state, caseType: action.value }
    }
    default: return state;
  }
}

function App() {
  const svgRef = useRef(null);
  const [ state, dispatch ] = useReducer(reducer, defaultState);
  const setState = (type, value) => dispatch({ type, value });

  useEffect(useCallback(() => {
    let data = Utils.prepData(state.caseType);
    vis.init(svgRef.current, data, state.caseType);
    setState('countries', data.countries)
    vis.dispatcher.on('datapointClick', (country) => {
      setState('selectedCountry', country)
    });
  }, [state.caseType]), []);

  useEffect(() => {
    function onResize() {
      window.location.reload()
    }

    window.addEventListener('resize', onResize)
    return () => {
      window.removeEventListener(onResize)
    }
  }, []);

  const updateData = useCallback(() => {
    let data = Utils.prepData(state.caseType);
    vis.handleCaseType(state.caseType, data);

  }, [state.caseType])

  useEffect(updateData, [state.caseType]);

  useEffect(() => {
    state.selectedCountry && vis.handleCountrySelect(state.selectedCountry)
  }, [ state.selectedCountry ]);

  const w = window.innerWidth;
  if(w < THRESHOLD) {
    document.body.style.overflowY = 'auto';
  }
  return (
    <div  style= {{
       display: 'flex',
      justifyContent: 'center',

    }}>
      <div style={{
        position: 'relative',
        maxWidth: 1400,

      }}>
      <div style={{
        position: w < THRESHOLD ? 'relative' : 'absolute',
        left: w < THRESHOLD ? null : '170px',
        top: w < THRESHOLD ? null : '240px',
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
        }}>Coronavirus cases per country over time.</h3>
        <DatasetSelection selected={state.caseType} onChange={v => setState('caseType', v)}/>
        <h3 className={'display'} style={{
          fontWeight: 700,
          fontSize: '12px',
          margin: '10px 0px',
          color: vis.style.strokeColor
        }}>Select below or hover over a line to see details.</h3>
      <select
        style={{ color: w < THRESHOLD ? 'white': 'black', width: '200px', margin: '5px 0px'}}
        value={state.selectedCountry} onChange={e => {
          setState('selectedCountry', e.target.value)
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
    </div>
  );
}

export default App;
