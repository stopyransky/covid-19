import * as d3 from 'd3';
import { THRESHOLD } from './App';

d3.selection.prototype.moveToFront = function() {
  return this.each(function() { this.parentNode.appendChild(this); });
};

const dispatcher = d3.dispatch('datapointClick')

const format = d3.timeFormat('%d %b');
const t = d3.transition().duration(1000).ease(d3.easeBack)
const CONFIRMED = 'confirmed';
const CONFIRMED_PER_MILLION = 'confirmedPerMillion';
let isReady = false;
let dataType = CONFIRMED;
const ticks = {
  confirmed: [ 10, 100, 1000, 10000, 100000, 1000000 ],
  deaths: [ 5, 50, 500, 5000 ],
  recovered: [ 5, 50, 500, 5000, 50000 ],

}

const style = {
  fontFamily: 'Playfair Display',
  strokeColor: '#FFC042',
  strokeWidth: 1,
  strokeColorSelected: 'white',
  strokeWidthSelected: 5,
  strokeWidthHover: 2,
  strokeColorHover: 'white',
  textColor: 'white',
  tickTextColor: '#aaa',
  tickLineColor: '#aaa',
  lineStrokeStyle: "1, 1",
  tickLineStyle: '0.5, 5',
  tickTextSize: '1.0rem',
  strokeWidthInteractive: 4,
  markerSize: 2,
  selectedMarkerSize: 6,
  circleStrokeWidth: 0,
}

let selected = '';
let data, screen, caseType, regionFilter;
let svgSel, mainSel, xAxisSel, yAxisSel, circleMarkers, paths, interactivePaths, label, selectLabel, histogramSel;
let xScale, yScale, xDomain, yDomain, lineGen;

function init(svg, _data, _caseType) {
  data = _data;
  caseType = _caseType;
  svgSel = d3.select(svg);

  const w = svgSel.attr('width');
  const h = svgSel.attr('height');

  const margin = {
    top: 50,
    bottom: 200,
    left: 30,
    right: w < THRESHOLD ? 30: 200,
  }

  screen = {
    w, h,
    width: w - margin.left - margin.right,
    height: h - margin.top - margin.bottom,
    margin
  }

  const sampleHistory = data.countryDocs[0].historyArray;
  const endDate = sampleHistory && sampleHistory.length ? sampleHistory[sampleHistory.length-1].date : new Date();

  xDomain = [ new Date('2020-01-22'), endDate]

  mainSel = svgSel.append('g')
    .attr('class', 'main')
    .attr('transform', `translate(${screen.margin.left}, ${screen.margin.top})`);

  xAxisSel = mainSel.append('g')
    .attr('class', 'x-axis')
    .attr('transform', `translate(0, ${screen.height + 150})`)

  yAxisSel = mainSel.append('g')
    .attr('class', 'y-axis')
    .attr('transform', `translate(${screen.width}, 0)`);

  makeScales();
  makeAxes()
  makeCircleMarkers();
  makePaths()
  makeInteractionPaths();
  makeLabel();

  histogramSel = mainSel.append('g')
    .attr('class', 'histogram')
    .attr('transform', `translate(${0}, ${screen.height})`)

  histogramSel.append('g').attr('class', 'histogram-axis');

  mainSel.append('line')
    .attr('x1', 0)
    .attr('x2', screen.width)
    .attr('y1', screen.height + 10)
    .attr('y2', screen.height + 10)
    .attr('stroke', style.tickLineColor)

  histogramSel.append('text')
  .attr('class', 'histogram-caption')
  .attr('fill', style.strokeColor)
  .attr('x', 70)
  .attr('text-anchor', 'start')
  .attr('y', 32)
  .style('font-size', '1rem')
  .style('font-family', style.fontFamily)
  .text('Daily change')

  histogramSel.append('text')
  .attr('class', 'histogram-label')
  .attr('fill', style.tickTextColor)
  .attr('x', 180)
  .attr('text-anchor', 'start')
  .attr('y', 32)
  .style('font-size', '1rem')
  .style('font-family', style.fontFamily)
  .text('Global')

  mainSel.append('line')
    .attr('x1', 0)
    .attr('x2', screen.width)
    .attr('y1', screen.height + 150)
    .attr('y2', screen.height + 150)
    .attr('stroke', style.tickLineColor)

  makeHistogram({ country: 'Global', country_code: 'XXX', historyArray: data.globalHistory })

  dispatcher.on('datapointClick', (d) => {
    handleCountrySelect(d.country_code);
  });

 isReady = true;
}

function getFilteredData() {
  return regionFilter ? data.countryDocs.filter(d => d.region === regionFilter) : data.countryDocs;
}
function makeScales() {
  xScale = d3.scaleTime()
    .range([0, screen.width])
    .domain(xDomain);

  const values = data.countryDocs.reduce((a, c) => {
    const values = c.historyArray.map(h => h[dataType])
    return [...a, ...values];
  }, [])
  yDomain = d3.extent(values);

  yScale = d3.scaleSymlog()
    .range([screen.height, 0])
    .domain(yDomain)

  lineGen = d3.line()
    .curve(d3.curveMonotoneX)
    .x(d => xScale(new Date(d.date)))
    .y(d => yScale(+d[dataType]))
}

function getXTicks() {
  const [ _, ...rest] = xScale.ticks();
  rest.pop();
  return screen.w < THRESHOLD ? xDomain : [...rest, ...xDomain];
}

function getXAxis() {
  const xAxis = d3.axisBottom(xScale)
    .tickPadding(8)
    .tickValues(getXTicks())
    .tickFormat(format)
  return xAxis;
}

function getYAxis(){
  return d3.axisRight(yScale)
    // .tickPadding(6)
    .tickValues(ticks[caseType])
}

function makeAxes() {

  xAxisSel.call(getXAxis());

  xAxisSel.selectAll('.tick')
    .select('text')
    .attr('fill', style.tickTextColor)
    .style('font-size', style.tickTextSize)
    .style('font-family', style.fontFamily);

  xAxisSel.selectAll('.tick')
    .select('line')
    .attr('stroke-dasharray', style.tickLineStyle)
    .attr('stroke', style.tickLineColor)
    .attr('y1', 0)
    .attr('y2', -screen.height-screen.margin.bottom + screen.margin.top)

  if(screen.w >= THRESHOLD) {

    yAxisSel
      // .transition(t)
      .call(getYAxis())

    yAxisSel.selectAll('.tick')
      .select('text')
      .attr('fill', style.tickTextColor)
      .attr('dy', 2)
      .style('font-size', style.tickTextSize)
      .style('font-family', style.fontFamily);

    yAxisSel.selectAll('.tick')
      .select('line')
      .attr('stroke-dasharray', style.tickLineStyle)
      .attr('stroke', style.tickLineColor)
      .attr('x1', -screen.width)
      .attr('x2', 0)
  }

  d3.selectAll('.domain').remove();

}

function makeCircleMarkers() {

  circleMarkers = mainSel
  .selectAll('circle')
  .data(data.countryDocs, d => d.country_code)
  .enter()
  .append('circle')
    .attr('class', d => `${d.country_code}` )
    .attr('cx', d => xScale(getLastDate(d)))
    .attr('cy', d => yScale(getLastValue(d)))
    .attr('r', style.markerSize)
    .attr('fill', d => getPathColor(d))
    .attr('stroke', style.strokeColor)
    .attr('stroke-width', style.circleStrokeWidth)
    .style('pointer-events', 'none')
}

function getPathColor(d, isDeselected) {
  if(!isDeselected && selected === d.country) {
    return style.strokeColorSelected;
  }
  const latest = getLastValue(d);

  const s = yScale(latest)/yScale(yDomain[0]);
  let h = 0;
  let l = 0.5
  if(caseType === 'deaths') {
    h = 300;
    l = 0.3;
  }
  if(caseType === 'recovered') {
    h = 120;
    l = 0.3
  }
  const col = d3.hsl(h, 0.4 + s * 0.3 , l);
  return col;

}

function makePaths() {
  paths = mainSel
  .selectAll('path')
  .data(data.countryDocs, d => d.country_code)
  .enter()
  .append('path')
  .attr('class', d => d.country_code )
  .attr('d', d => lineGen(d.historyArray))
  .attr('stroke', d => getPathColor(d))
  .attr('stroke-width', style.strokeWidth)
  .attr('fill', 'none')
  .style("stroke-linecap", "round")
  .style('pointer-events', 'none')
}

function getLastValue(d) {
  return d.historyArray[d.historyArray.length-1][dataType];
}

function getLastDate(d) {
  return d.historyArray[d.historyArray.length-1].date;
}

function hideLabel() {
  label.attr('display', 'none')
}
function showLabel(d) {
      const lastValue = getLastValue(d);

      label
        .attr('display', null)
        .attr('y', yScale(lastValue) - 6)
        .text(`${d.country}, ${lastValue}`)
        .moveToFront();
}

function makeInteractionPaths() {
  const g = mainSel.append('g').attr('class', 'interactive')

  interactivePaths = g.selectAll('path')
  .data(data.countryDocs, d => d.country_code)
  .enter()
  .append('path')
    .attr('class', d => d.country_code + '_')
    .attr('d', d => lineGen(d.historyArray))
    .attr('fill', 'none')
    .attr('stroke', 'transparent')
    .attr('stroke-width', style.strokeWidthInteractive)
    .on('mouseover', (d, i, n) => {

      if(selected !== d.country) {
        d3.selectAll(`path.${d.country_code}`)
          .attr('stroke', style.strokeColorHover)
          .attr('stroke-width', style.strokeWidthHover)
          .moveToFront()
        d3.select(`circle.${d.country_code}`)
          // .attr('stroke', style.strokeColorHover)
          .attr('fill', style.strokeColorHover)
          // .attr('stroke-width', style.strokeWidthHover)
          .moveToFront()
      }
      showLabel(d);
    })
    .on('mouseout', (d, i, n) => {
      if(selected !== d.country) {
        const strokeColor = getPathColor(d);
        d3.select(`path.${d.country_code}`)
          .attr('stroke', strokeColor)
          .attr('stroke-width', style.strokeWidth)

        d3.select(`circle.${d.country_code}`)
          // .attr('stroke', strokeColor)
          // .attr('stroke-width', style.strokeWidth)
          .attr('fill', strokeColor)

        hideLabel()
      }
      const sel = data.countryDocs.find((d) => d.country === selected )
      sel && d3.select(`.${sel.country_code}`).moveToFront()

      label.moveToFront()
    })
    .on('mouseup', (d, i, n) => {
      dispatcher.call('datapointClick', null, d);
    });
}

function makeLabel() {
  label = mainSel.append('g')
    .append('text')
    .attr('class', 'label')
    .style('font-family', style.fontFamily)
    .attr('display', 'none')
    .attr('text-anchor', screen.w < THRESHOLD ? 'end' : 'start')
    .attr('font-size', '16px')
    .attr('x', screen.w < THRESHOLD ? screen.width - 8 : screen.width + 8)
    .attr('fill', style.textColor)
    .style('z-index', 100)

  selectLabel = mainSel.append('g').append('text')
    .attr('class', 'select-label')
    .style('font-family', style.fontFamily)
    .attr('display', 'none')
    .attr('text-anchor', screen.w < THRESHOLD ? 'end' : 'start')
    .attr('font-size', '16px')
    .attr('x', screen.w < THRESHOLD ? screen.width - 8 : screen.width + 8)
    .attr('fill', style.textColor)
    .style('z-index', 100)
}

function handleCountrySelect(selectedCountry) {
  const prev = data.countryDocs.find((d) => d.country === selected )
  const next = data.countryDocs.find((d) => d.country === selectedCountry )

  if(prev) {
    const color = getPathColor(prev, true);
    d3.select(`path.${prev.country_code}`)
    .attr('stroke', color)
    .attr('filter', null)
    .attr('stroke-width', style.strokeWidth)
    d3.select(`circle.${prev.country_code}`)
      .attr('r', style.markerSize)
      .attr('fill', color )
      .attr('filter', null)
  }

  if(next) {
    const lastValue = getLastValue(next);
    d3.select(`path.${next.country_code}`)
    .attr('stroke', style.strokeColorSelected)
    .attr('stroke-width', style.strokeWidthSelected)

    d3.select(`circle.${next.country_code}`)
      .attr('r', style.selectedMarkerSize)
      .attr('fill', style.strokeColorSelected)

    d3.selectAll(`.${next.country_code}`)
      .attr('filter', 'url(#white-glow)')
      .moveToFront();

    selectLabel
      .attr('display', null)
      .attr('y', yScale(lastValue) - 6)
      .text(`${next.country}, ${lastValue}`).moveToFront();


    makeHistogram(next)
  }

  selected = selectedCountry;
}

function handleRegionFilter(selectedRegion) {
  regionFilter = selectedRegion;

}

function makeHistogram(next) {

  const hDomain = d3.extent(next.historyArray.map(d => d[`${caseType}Change`]));

  const hScale = d3.scaleLinear().domain(hDomain).range([150, 20]);
  const [first, ...ticks] = hScale.ticks(4);

    const hAxis = d3.axisRight(hScale).tickValues(ticks);
    const axis = d3.select('.histogram-axis')
      .attr('transform', screen.w >= THRESHOLD ? `translate(${screen.width}, 0)`: null)
      .call(hAxis)

    axis.select('.domain')
      .remove();

    axis.selectAll('.tick')
      .select('text')
      .attr('fill', style.tickTextColor)
      .style('font-size', style.tickTextSize)
      .style('font-family', style.fontFamily);

  d3.select('.histogram-label').text(`${next.country}, ${next.historyArray[next.historyArray.length - 1][`${caseType}Change`]}`)
  const dataSel = histogramSel.selectAll('line')
    .data(next.historyArray, d => d.key);

  const enterSelection = dataSel.enter()
    .append('line')
    .attr('class', 'hist-line')
    .attr('stroke-width', 2)
    .attr('fill', 'white')
    .attr('stroke', 'white')

  enterSelection.merge(dataSel)
    .transition().duration(500).ease(d3.easeCircle)
    .attr('x1', d => xScale(d.date))
    .attr('y1', hScale(0))
    .attr('x2', d => xScale(d.date))
    .attr('y2', d => hScale(d[`${caseType}Change`]))

}

function handleCaseType(_caseType, _data) {
  caseType = _caseType;
  data = _data;

  hideLabel()
  updatePaths();
  updateInteractivePaths();
  updateCircleMarkers();
  updateSelectLabel();
}

function updateSelectLabel() {
    if(selected) {
    const item = data.countryDocs.find(d => d.country === selected);
    const lastValue = getLastValue(item);
    selectLabel
      .attr('display', null)
      .text(`${item.country}, ${lastValue}`).moveToFront();

    selectLabel.transition(t).attr('y', yScale(lastValue) - 6);

    makeHistogram(item)
  }
}
function updatePaths() {
  paths.data(data.countryDocs, d => d.country_code)
  paths.exit().remove();
  const enterSelection = paths.enter()
  paths.merge(enterSelection)
    .transition(t)
    .attr('stroke', d => getPathColor(d))
    .attr('d', d => lineGen(d.historyArray))
}

function updateInteractivePaths() {
  interactivePaths.data(data.countryDocs, d => d.country_code)

  interactivePaths.exit().remove();

  const enterSelection = interactivePaths.enter()

  interactivePaths.merge(enterSelection)
    .attr('d', d => lineGen(d.historyArray))
}

function updateCircleMarkers() {
  circleMarkers.data(data.countryDocs, d => d.country_code)

  circleMarkers.exit().remove()
  const circleEnterSelection = circleMarkers.enter();
  circleMarkers.merge(circleEnterSelection)
    .attr('class', d => d.country_code )
    .transition(t)
    .attr('fill', d => getPathColor(d))
    .attr('cx', d => xScale(getLastDate(d)))
    .attr('cy', d => yScale(getLastValue(d)))
}

function handleDataType(perMillion) {
  if(isReady) {
    dataType = perMillion ? CONFIRMED_PER_MILLION : CONFIRMED;
    updatePaths();
    updateInteractivePaths();
    updateCircleMarkers();
    updateSelectLabel();
  }

}
const vis = {
  init,
  handleCountrySelect,
  handleRegionFilter,
  handleCaseType,
  handleDataType,
  style,
  dispatcher
}

Object.defineProperty(vis, 'screen', {
  get: function() {
    return screen;
  }
});

export default vis;

