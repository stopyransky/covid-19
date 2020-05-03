import React, { useEffect, useRef, useReducer, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import 'i18next-browser-languagedetector';

// import './App.css';
import Utils from './utils';

import vis from './vis';

export const THRESHOLD = 1200;
const IS_FALLBACK = false;


function Radio ({ type, value, label, onChange, isChecked }) {
  const isMobile = window.innerWidth < THRESHOLD;
  return (
    <div style={{ color: 'white', marginRight: '8px', display: 'flex', justifyContent: 'center' }}>
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
        style={{
          marginLeft: isMobile ? '2px' :  '4px',
          color: isChecked ? vis.style.strokeColor: 'white',
          fontSize: isMobile ? '0.8rem' : '1rem'
        }}
        htmlFor={value}>{label}</label>
    </div>
  );
}

function DatasetSelection({ onChange, selected })  {
  const [ t ] = useTranslation();
  return (
    <div style={{ display: 'flex' }}>
      <Radio
        type="caseType"
        value="confirmed"
        label={t('confirmed')}
        isChecked={selected === 'confirmed'}
        onChange={onChange}
      />
      <Radio
        type="caseType"
        value="deaths"
        label={t('deaths')}
        isChecked={selected === 'deaths'}
        onChange={onChange}
      />
    </div>
  );
}

function LinkItem({url, name}) {

  return (
    <span className={'display'} style={{ zIndex: 999, padding: '0px 5px ', color: vis.style.strokeColor, fontSize: '12px' }}>
      <a style={{ color: '#aaa', textDecoration: 'none' }} noreferer='true' noopener='true' target='blank' href={url}>{name}</a>
    </span>
  )
}

function Switch({onChange}) {
  return (<div className="switch" style={{ }}><input type="checkbox" id="switch" onChange={onChange}/><label htmlFor="switch">per million</label> </div>)
}

const defaultState = { countries: [], regions: [], selectedRegion: '', selectedCountry: '', caseType: 'confirmed', perMillion: false }

function reducer(state, action) {
  switch(action.type) {
    case 'countries': {
      return { ...state, countries: action.value };
    }
    case 'regions': {
      return { ...state, regions: action.value };
    }
    case 'selectedCountry' : {
      return { ...state, selectedCountry: action.value};
    }
    case 'selectedRegion' : {
      return { ...state, selectedRegion: action.value};
    }
    case 'caseType': {
      return { ...state, caseType: action.value }
    }
    case 'perMillion': {
      return { ...state, perMillion: !state.perMillion }
    }
    default: return state;
  }
}

function App() {
  const svgRef = useRef(null);
  const [ t, i18n ] = useTranslation();
  const [ state, dispatch ] = useReducer(reducer, defaultState);
  const setState = (type, value = null) => dispatch({ type, value });

  useEffect(useCallback(() => {
    Utils.prepData(state.caseType, IS_FALLBACK).then(data => {

      vis.init(svgRef.current, data, state.caseType);
      setState('countries', data.countries);
      setState('regions', data.regions)
      vis.dispatcher.on('datapointClick', (d) => {
        setState('selectedCountry', d.country)
      });
    })


    return () => {
      vis.dispatcher.on('datapointClick', null);
    }

  }, [state.caseType]), []);

  useEffect(useCallback(()=> {
    vis && vis.handleDataType(state.perMillion);
  }, [state.perMillion]), [state.perMillion]);


  useEffect(() => {

    let resizeTimer;
    const handleResize = () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(function() {
        // TODO
        window.location.reload();
      }, 300);
    };

    window.addEventListener('resize', handleResize)
    return () => {
      window.removeEventListener(handleResize)
    }
  }, []);

  useEffect(useCallback(() => {
    Utils.prepData(state.caseType, IS_FALLBACK).then(data => {
      vis.handleCaseType(state.caseType, data);
    });

  }, [state.caseType]), [state.caseType]);

  useEffect(() => {
    state.selectedCountry && vis.handleCountrySelect(state.selectedCountry);
  }, [ state.selectedCountry ]);

  useEffect(() => {
    state.selectedRegion && vis.handleRegionFilter(state.selectedRegion);
  }, [ state.selectedRegion ]);

  const w = window.innerWidth;

  if(w < THRESHOLD) {
    document.body.style.overflowY = 'auto';
  }

  function CountrySelection() {
    return (
      <div style={{ display: 'flex', flexFlow: 'column nowrap', justifyContent: 'center'}}>
        <h3 className={'display'} style={{
            fontWeight: 700,
            fontSize: '12px',
            margin: '10px 0px',
            color: vis.style.strokeColor
          }}>{t('Select below or hover over a line to see details.')}
        </h3>
          <select className={'select'}
            style={{ color: w < THRESHOLD ? 'white': 'black', width: '200px', margin: '5px 0px'}}
            value={state.selectedCountry} onChange={e => {
              setState('selectedCountry', e.target.value)
            }}>
            {!state.selectedCountry && <option value={''} key={-1} >{t('Select Country')}</option>}
            {state.countries.map(c => (<option value={c} key={c}>{c}</option>))}
        </select>
      </div>
    )
  }
  function RegionFilter() {
    return (
      <div style={{ display: 'flex', flexFlow: 'column nowrap', justifyContent: 'center'}}>
        <h3 className={'display'} style={{
            fontWeight: 700,
            fontSize: '12px',
            margin: '10px 0px',
            color: vis.style.strokeColor
          }}>{t('Filter by region')}
        </h3>
          <select className={'select'}
            style={{ color: w < THRESHOLD ? 'white': 'black', width: '200px', margin: '5px 0px'}}
            value={state.selectedRegion} onChange={e => {
              setState('selectedRegion', e.target.value)
            }}>
            {!state.selectedRegion && <option value={''} key={-1} >{t('Region Filters')}</option>}
            {state.regions.map(c => (<option value={c} key={c}>{c}</option>))}
        </select>
      </div>
    )
  }
  function Title() {
    return (
      <h1 className={'display'} style={{
          fontWeight: 900,
          color: 'white',
          margin: 0,
          fontSize: w < THRESHOLD ? '1.5rem' : '3rem',
        }}>{t('Flattening the curve.')}
      </h1>
    )
  }

  function Subtitle() {
    return (
      <h3 className={'display'} style={{
          fontWeight: 700,
          margin: '10px 0px',
          color: vis.style.strokeColor,
          fontSize: w < THRESHOLD ? '1rem' : '2rem',
        }}>{t('Coronavirus cases per country over time.')}
      </h3>
    )
  }

  function Settings() {
    return (
      <div className={'display'} style={{display: 'flex', alignItems: 'center'}}>
        <div style={{ color: '#aaa', fontSize: '12px' }}>
          <span style={{
            padding: '0px 5px ',
            cursor: 'pointer',
            textDecoration: i18n.language === 'pl' ? 'underline' : null }}
            onClick={() => i18n.changeLanguage('pl')}>PL</span>
          <span style={{ padding: '0px 2px '}}>/</span>
          <span style={{
            padding: '0px 5px ',
            cursor: 'pointer',
            textDecoration: i18n.language === 'en' ? 'underline' : null}}
            onClick={() => i18n.changeLanguage('en')}>EN
          </span>
        </div>
        <LinkItem key={0} url={'https://github.com/Omaroid/Covid-19-API'} name={t('data source')} />
        <LinkItem key={1} url={'https://twitter.com/stopyransky'} name={t('author')} />
      </div>
    )
  }

  return (
    <div  style= {{
        display: 'flex',
        justifyContent: 'center',
    }}>
      <div style={{ position: 'relative', }}>
      <div style={{
        position: w < THRESHOLD ? 'relative' : 'absolute',
        transform: w < THRESHOLD ? 'translate(-50%, 50px)' : null,
        left: w < THRESHOLD ? '50%' : '100px',
        top: w < THRESHOLD ? '0%' : '100px',
        width: w < THRESHOLD ? '100%': null,
        display: 'flex',
        flexFlow: 'column nowrap',
        alignItems: w < THRESHOLD ? 'center' : null,
      }}>
        <Title />
        <Subtitle />
        <DatasetSelection selected={state.caseType} onChange={v => setState('caseType', v)}/>
        <CountrySelection />
        {/* <RegionFilter /> */}
        {/* <Switch onChange={() => setState('perMillion') }/> */}
        {w >= THRESHOLD && <Settings />}
      </div>
      <svg
        ref={svgRef}
        width={Math.min(THRESHOLD, window.innerWidth)}
        height={window.innerHeight}>
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
      {w < THRESHOLD &&
        <div style={{display: 'flex', justifyContent: 'center', marginBottom: '10px' }}>
          <Settings />
        </div>
      }
      </div>
    </div>
  );
}

export default App;
