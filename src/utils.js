import * as confirmedSrc from './fallback/data/csse_covid_19_data/csse_covid_19_time_series/time_series_covid19_confirmed_global.csv';
import * as deathsSrc from './fallback/data/csse_covid_19_data/csse_covid_19_time_series/time_series_covid19_deaths_global.csv';
import * as wdvpSrc from './data/wdvp.data.csv';
import * as d3 from 'd3';

import { group, rollup } from 'd3-array';

import * as jsonData from './data/data.all.json';

const caseTypes = [ 'confirmed', 'deaths' ];

function getWDVPData() {
  return d3.dsv(';', wdvpSrc)
}

async function prepData(caseType, fallback = false) {
  let wdvp = await getWDVPData();
  let raw;
  let byCountryMap;
  let countryDocs;
  let countries;

  if(fallback) {
    raw = await getCSVData(caseType)
    byCountryMap = group(raw, d => d['Country/Region']);
    countries = Array.from(new Set(raw.map(d => d['Country/Region'])));
    // const days = Array.from(new Set(data.map(d => d['Last Update'])));

    countryDocs = countries.map(c => {

      const arr = byCountryMap.get(c);

      const history = arr.reduce((acc, curr) => {
        const { ['Province/State']: _pe, ['Country/Region']: _cy, Lat, Long, ...currHistory } = curr;

        Object.keys(currHistory).forEach(k => {
          if(acc[k]) {
            acc[k] += +currHistory[k]
          } else {
            acc[k] = +currHistory[k]
          }
        })

        return acc;
      }, { '1/21/20': 0 })


      const historyArray = Object.keys(history)
          .map(k => ({
            key: k,
            date: new Date(k),
            confirmed: history[k],
            // recovered: histories.recovered[k],
            // deaths: histories.deaths[k]
          }))
          .sort((a, b) => a.date.getTime() - b.date.getTime());

      const wdvpItem = wdvp.find(d => d.country === c) ;
      let country_code = wdvpItem ? wdvpItem.ISO2 : 'XX' ;

      return {
        country: c,
        country_code,
        historyArray
      };
    })
    // Array.from(byCountryMap).forEach(([countryName, arr]) => {

    //   const item = {
    //     country: countryName,

    //   }
    // });

  } else {
    raw = getJsonData(caseType);
    byCountryMap = group(raw, d => d.country);
    countryDocs = mergeHistoryByCountry(byCountryMap);
    countries = Array.from(new Set(countryDocs.map(d => d.country)))
      .sort((a, b) => {
        if(a > b) return 1;
        if(a < b) return -1;
        return 0
      });
  }
    return {
      countryDocs,
      countries,
    }

}

function getJsonData(caseType) {
  if(caseTypes.includes(caseType)){

    return jsonData.default[caseType].locations.filter(d => d.country_code !== 'XX');
  }
  return jsonData.default['confirmed'].locations.filter(d => d.country_code !== 'XX');
}

function getCSVData(caseType) {

  switch(caseType) {
    case 'deaths': return d3.dsv(',', deathsSrc)
    default: return d3.dsv(',', confirmedSrc)

  }

}

function getValue(caseType, countryName, date) {
  const d = getJsonData(caseType).filter(d => d.country === countryName)
  if(d && d.length > 0) {
    if(date) {
      const value = d[0].history[date];
      if(value) {
        return value
      }
      return null;
    } else {
      return d[0].history;
    }

  }
  return null;
}

function getCountryData(countryName, key) {
  return {
    confirmed: getValue('confirmed', countryName, key),
    recovered: getValue('recovered', countryName, key),
    deaths: getValue('deaths', countryName, key),
  }
}

function mergeHistoryByCountry(map) {
  const docs = [];

  map.forEach((arr, key) => {

    const { history, country, country_code } = arr[0];

    let tempHistory = history;

    if(arr.length > 1) {

      tempHistory = concatenateHistory(arr)

    }

    const histories = getCountryData(country);

    const historyArray = Object.keys(tempHistory)
      .map(k => ({
        key: k,
        date: new Date(k),
        confirmed: tempHistory[k],
        recovered: histories.recovered[k],
        deaths: histories.deaths[k]
      }))
      .sort((a, b) => a.date.getTime() - b.date.getTime());

    docs.push({ country, country_code, historyArray });
  });

  return docs;
}

function concatenateHistory(values) {
  const aggregated = {}
  values.forEach(v => {
    const history = v.history;
    Object.keys(history).forEach((k, i) => {
      if(typeof aggregated[k] === 'undefined') {
        aggregated[k] = history[k];
      } else {
        aggregated[k] += history[k]
      }
    })
  });

  return aggregated;
}

export default {
  prepData
}
