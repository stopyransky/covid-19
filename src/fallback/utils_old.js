import * as confirmedSrc from './data/csse_covid_19_data/csse_covid_19_time_series/time_series_covid19_confirmed_global.csv';
import * as deathsSrc from './data/csse_covid_19_data/csse_covid_19_time_series/time_series_covid19_deaths_global.csv';

import * as d3 from 'd3';
import { group, rollup } from 'd3-array';


const countryMap = new Map();
countryMap.set('Mainland China', 'China');
countryMap.set('Korea, South', 'South Korea');
countryMap.set('Hong Kong SAR', 'Hong Kong');
countryMap.set('Taiwan*', 'Taiwan');
countryMap.set('Congo (Brazzaville)', 'Congo');
countryMap.set('Congo (Kinshasa)', 'Congo');
countryMap.set('Viet Nam', 'Vietnam');
countryMap.set('Iran (Islamic Republic of)', 'Iran');

const format = d3.timeFormat('%Y-%m-%d');

function stripUnused(obj, prop) {
  const { [prop]: none, ...rest} = obj;
  return rest;
}

function prepareData() {

  return Promise.all([d3.dsv(';', confirmedSrc), d3.dsv(';', deathsSrc)])
    .then(files => {
      console.log('files',files);
      const merged = confirmedSrc.map(doc => {
        // console.log(doc)
        return doc;
      });

      return merged;
    })
}

function getData() {

  return prepareData().then( data => {
    const groupByCountry = group(data, d => d['Country/Region'])
    const countries = Array.from(new Set(data.map(d => d['Country/Region'])));
    const days = Array.from(new Set(data.map(d => d['Last Update'])));
    const byCountry = group(data, d => d['Country/Region'], d => d['Last Update']);
    const unwrapped = Array.from(byCountry, ([key, value]) => Array.from(value, (v, k) => {
        const arr = v[1];
        return { ...arr[arr.length-1] }
    }));

    return { data, countries, };
  })


}



export const dates = [
  '01-22-2020',
  '01-23-2020',
  '01-24-2020',
  '01-25-2020',
  '01-26-2020',
  '01-27-2020',
  '01-28-2020',
  '01-29-2020',
  '01-30-2020',
  '01-31-2020',
  '02-01-2020',
  '02-02-2020',
  '02-03-2020',
  '02-04-2020',
  '02-05-2020',
  '02-06-2020',
  '02-07-2020',
  '02-08-2020',
  '02-09-2020',
  '02-10-2020',
  '02-11-2020',
  '02-12-2020',
  '02-13-2020',
  '02-14-2020',
  '02-15-2020',
  '02-16-2020',
  '02-17-2020',
  '02-18-2020',
  '02-19-2020',
  '02-20-2020',
  '02-21-2020',
  '02-22-2020',
  '02-23-2020',
  '02-24-2020',
  '02-25-2020',
  '02-26-2020',
  '02-27-2020',
  '02-28-2020',
  '02-29-2020',
  '03-01-2020',
  '03-01-2020',
  '03-02-2020',
  '03-03-2020',
  '03-04-2020',
  '03-05-2020',
  '03-06-2020',
  '03-07-2020',
  '03-08-2020',
  '03-09-2020',
  '03-10-2020',
  '03-11-2020',
  '03-12-2020',
  '03-13-2020',
  '03-14-2020',
  '03-15-2020',
  '03-16-2020',
  '03-17-2020',
  '03-18-2020',
  '03-19-2020',
  '03-20-2020',
  '03-21-2020',
  '03-22-2020',
  '03-23-2020',
]




export default {
  getData,
}


