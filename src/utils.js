import * as d3 from 'd3';
import { group, rollup } from 'd3-array';
import * as data from './data.json';

const format = d3.timeFormat('%Y-%m-%d');

export function getData() {
  return data.default.locations;
}

function prepData() {
  let raw = data.default.locations.filter(d => d.country_code !== 'XX');
  console.log(raw)
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
      // aggregate all items' history into one history object
      doc.history = concatenateHistory(arr)

    } else {

      doc.history = history;
    }

    let h = Object.keys(doc.history)
      .map(k => ({ date: new Date(k), confirmed: doc.history[k]}))
      .sort((a, b) => a.date.getTime() - b.date.getTime())

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
  getData,
  prepData
}
