import React, { useRef, useEffect, useState } from 'react';
import { THRESHOLD } from '../App';
import { makeHistogram, style } from '../vis';
import utils from '../utils';

function Histogram({ countryName }) {
  const [ state, setData ] = useState(null);

  useEffect(() => {
    utils.prepData('confirmed', false).then(data => {
      console.log(data);
      const { country, country_code, historyArray } = data.countryDocs.find(d=> d.country === countryName);
      setData({ country, country_code, historyArray })
      makeHistogram({ country, country_code, historyArray });
    })

  }, [countryName]);

  return (
    <g className="histogram">
      <g className="histogram-axis"></g>
      <text
        x={70}
        y={32}
        fontFamily={style.fontFamily}
        fill={style.strokeColor}
        textAnchor='start'
        className="histogram-caption">Daily Change</text>
      <text
        x={180}
        y={32}
        className="histogram-label"
        fontFamily={style.fontFamily}
        fill={style.tickTextColor}
        textAnchor='start'
      >{state.country}
      </text>
    </g>
  )
}

const countries = ['Poland', 'Brazil', 'US', 'Germany', ]
export default function Histograms() {
  const svgRef = useRef();
  useEffect(() => {
    utils.prepData('confirmed', false).then(data => {
      makeHistogram({ country: 'Global', country_code: 'XXX', historyArray: data.globalHistory });
    })

  }, []);
  return (<div>
    <svg
      ref={svgRef}
      width={Math.min(THRESHOLD, window.innerWidth)}
      height={window.innerHeight}>
        <g className="histogram">
          <g className="histogram-axis"></g>
          <text
            x={70}
            y={32}
            fontFamily={style.fontFamily}
            fill={style.strokeColor}
            textAnchor='start'
            className="histogram-caption">Daily Change</text>
          <text
            x={180}
            y={32}
            className="histogram-label"
            fontFamily={style.fontFamily}
            fill={style.tickTextColor}
            textAnchor='start'
          >Global
          </text>
        </g>
        {/* {countries.map((c, i) => {
          return (
            <g key={i} style={{transform: `translate3d(0, ${i * 200}px, 0)`}}>
              <Histogram countryName={c}/>
            </g>
          )
        })} */}
    </svg>
  </div>)
}
