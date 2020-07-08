import React, { useState } from 'react';
import 'i18next-browser-languagedetector';
import Main from './components/Main';
import Histograms from './components/Histograms';

export const THRESHOLD = 1200;


function App() {

  const [state, setState] = useState('main')
  return (
    <div  style= {{
        display: 'flex',
        flexFlow: 'column nowrap',
        justifyContent: 'center',
        alignItems: 'center',
        maxWidth: '1280px',
        margin: 'auto',
    }}>
      {/* <nav style={{ display: 'flex', flexFlow: 'row nowrap', justifyContent: 'center', width: '100%', color: 'white', fontSize: '1.2rem'}}>
        <div style={{ marginRight: '16px'}}onClick={() => setState('main')}>main</div>
        <div onClick={() => setState('histograms')}>histograms</div>
      </nav> */}
      <div>
        {state === 'main' && <Main />}
        {state === 'histograms' && <Histograms />}
      </div>

    </div>
  );
}


export default App;


function Switch({onChange}) {
  return (<div className="switch" style={{ }}><input type="checkbox" id="switch" onChange={onChange}/><label htmlFor="switch">per million</label> </div>)
}
