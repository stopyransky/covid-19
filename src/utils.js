// import * as confirmedSrc from './fallback/data/csse_covid_19_data/csse_covid_19_time_series/time_series_covid19_confirmed_global.csv';
// import * as deathsSrc from './fallback/data/csse_covid_19_data/csse_covid_19_time_series/time_series_covid19_deaths_global.csv';
// import * as wdvpSrc from './data/wdvp.data.csv';
// import * as d3 from 'd3';

import { group } from 'd3-array';

import * as jsonData from './data/data.all.json';

const caseTypes = [ 'confirmed', 'deaths' ];


// function getCSVData(caseType) {

//   switch(caseType) {
//     case 'deaths': return d3.dsv(',', deathsSrc)
//     default: return d3.dsv(',', confirmedSrc)

//   }

// }

// function getWDVPData() {
//   return d3.dsv(';', wdvpSrc)
// }

async function prepData(caseType) {
  // let wdvp = await getWDVPData();
  let raw;
  let byCountryMap;
  let countryDocs;
  let countries;
  let globalHistory;

  raw = getJsonData(caseType);
  byCountryMap = group(raw, d => d.country);
  countryDocs = mergeHistoryByCountry(byCountryMap);

  globalHistory = countryDocs.reduce((acc, curr) => {
    const history = curr.historyArray;

    history.forEach(h => {
      const existing = acc.find(d => d.key === h.key);
      if(existing) {
        existing.confirmed += h.confirmed;
        existing.confirmedChange += h.confirmedChange;
        existing.deaths += h.deaths;
        existing.deathsChange += h.deathsChange;
      } else {
        acc.push({ ...h})
      }
    });

    return acc;
  }, [ { key: '1/21/20', date: new Date('1/21/20'), confirmed: 0, confirmedChange: 0, deaths: 0, deathsChange: 0 }]);

  countries = Array.from(new Set(countryDocs.map(d => d.country)))
    .sort((a, b) => {
      if(a > b) return 1;
      if(a < b) return -1;
      return 0
    });

  return {
    countryDocs,
    countries,
    globalHistory,
  }

}

function getJsonData(caseType) {
  if(caseTypes.includes(caseType)){

    return jsonData.default[caseType].locations.filter(d => d.country_code !== 'XX');
  }
  return jsonData.default['confirmed'].locations.filter(d => d.country_code !== 'XX');
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

  map.forEach(arr => {

    const { country, country_code } = arr[0];

    const historyArray = concatenateHistory(arr)
      .sort((a, b) => a.date.getTime() - b.date.getTime())
      .map((item, index, items) => ({
        ...item,
        confirmedChange: index ? item.confirmed - items[index - 1].confirmed : 0,
        deathsChange: index ? item.deaths - items[index - 1].deaths : 0,
      }));

    docs.push({ country, country_code, historyArray });
  });

  return docs;
}

function concatenateHistory(values) {

  const aggregated = values.reduce((acc, curr) => {
    const history = curr.history;
    const histories = getCountryData(curr.country);

    Object.keys(history).forEach((k, i) => {
      const existing = acc.find(d => d.key === k);
      if(existing) {
        existing.confirmed += history[k];
      } else {
        acc.push({
          key: k,
          date: new Date(k),
          confirmed: history[k],
          deaths: histories.deaths[k]
        });
      }
    });
    return acc;
  }, []);

  return aggregated;
}

export default {
  prepData
}
