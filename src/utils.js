
import { group } from 'd3-array';
import * as data from './data.json';
import * as allData from './data.all.json';


function prepData(caseType) {
  // let raw = data.default.locations
  let raw = allData.default.confirmed.locations
    .filter(d => d.country_code !== 'XX');

  const byCountryCodeMap = group(raw, d => d.country);

  const countryDocs = mergeByCountry(byCountryCodeMap)
  const docs = extractHistory(countryDocs)
  const countries = Array.from(new Set(docs.map(d => d.country)))
  return {
    docs,
    countryDocs,
    countries,
  };
}

function extractHistory(countryDocs) {
  const docs = []
  countryDocs.forEach(c => {

    const { history, country, country_code } = c;

    Object.keys(history).forEach(k => {
      const doc = { country, country_code, date: k, confirmed: history[k]}

      docs.push(doc)
    });

  });

  return docs;
}

function mergeByCountry(map) {
  const docs = [];

  map.forEach((arr, key) => {

    const { history, country, country_code } = arr[0];
    const doc = { country, country_code };
    if(arr.length > 1) {

      doc.history = concatenateHistory(arr)

    } else {

      doc.history = history;
    }


    let h = Object.keys(doc.history)
      // .filter(k => doc.history[k] !== 0)
      .map(k => ({ key: k, date: new Date(k), confirmed: doc.history[k]}))
      .sort((a, b) => a.date.getTime() - b.date.getTime());


    doc.historyArray = h;
    docs.push(doc);
  });

  return docs;
}

function concatenateHistory(values) {
  const aggregated = {}
  values.forEach(v => {
    const history = v.history; // obj
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
