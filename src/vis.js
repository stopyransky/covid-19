import * as d3 from 'd3';
import { THRESHOLD } from './App';

const dispatcher = d3.dispatch('datapointClick')
const format = d3.timeFormat('%d %b');

const xDomain = [ new Date('2020-01-22'), new Date('2020-03-19')]

let selected = '';

let data, caseType;
let svgSelection, screen;
let main, xScale, yScale, yDomain, lineGen, xAxisSel, yAxisSel;
let circleMarkers, paths, interactivePaths, label;

const t = d3.transition().duration(1000).ease(d3.easeBack)

d3.selection.prototype.moveToFront = function() {
  return this.each(function() { this.parentNode.appendChild(this); });
};

const ticks = {
  confirmed: [ 5, 50, 500, 5000, 50000 ],
  deaths: [ 5, 50, 500, 3000 ],
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

function init(svg, _data, _caseType) {
  data = _data;
  caseType = _caseType;

  svgSelection = d3.select(svg);
  const w = svgSelection.attr('width');
  const h = svgSelection.attr('height');

  const margin = {
    top: 50,
    bottom: 50,
    left: 30,
    right: w < THRESHOLD ? 30: 200,
  }

  screen = {
    w, h,
    width: w - margin.left - margin.right,
    height: h - margin.top - margin.bottom,
    margin
  }

  main = svgSelection.append('g')
    .attr('class', 'main')
    .attr('transform', `translate(${screen.margin.left}, ${screen.margin.top})`);

  xAxisSel = main.append('g')
    .attr('class', 'x-axis')
    .attr('transform', `translate(0, ${screen.height})`)

  yAxisSel = main.append('g')
    .attr('class', 'y-axis')
    .attr('transform', `translate(${screen.width}, 0)`);

  makeScales();
  makeAxes()
  makeCircleMarkers();
  makePaths()
  makeInteractionPaths();
  makeLabel();
}

function makeScales() {
  xScale = d3.scaleTime()
    .range([0, screen.width])
    .domain(xDomain);

  const confirmed = data.docs.map(d => d.confirmed);

  yDomain = d3.extent(confirmed);

  yScale = d3.scaleSymlog()
    .range([screen.height, 0])
    .domain(yDomain)

  lineGen = d3.line()
    .curve(d3.curveMonotoneX)
    .x(d => xScale(new Date(d.date)))
    .y(d => yScale(+d.confirmed))
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

  xAxisSel

    .call(getXAxis());

  xAxisSel.selectAll('.tick')
    .select('text')
    .attr('fill', style.tickTextColor)
    .style('font-size', style.tickTextSize)
    .style('font-family', style.fontFamily);

  xAxisSel.selectAll('.tick')
    .select('line')
    .attr('stroke', style.tickLineColor);

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
      .attr('x1', -screen.width)
      .attr('x2', 0)
      .attr('stroke-dasharray', style.tickLineStyle)
      .attr('stroke', style.tickLineColor);
  }

  d3.selectAll('.domain').remove();

}

function makeCircleMarkers() {

  circleMarkers = main
  .selectAll('circle')
  .data(data.countryDocs, d => d.country_code)
  .enter()
  .append('circle')
    .attr('class', d => `${d.country_code}` )
    .attr('cx', d => xScale(d.historyArray[d.historyArray.length-1].date))
    .attr('cy', d => yScale(d.historyArray[d.historyArray.length-1].confirmed))
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
  const latest = d.historyArray[d.historyArray.length-1].confirmed;

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
  paths = main
  .selectAll('path')
  .data(data.countryDocs, d => d.country_code)
  .enter()
  .append('path')
    .attr('class', d => d.country_code )
    .attr('d', d => lineGen(d.historyArray))
    .attr('fill', 'none')
    .attr('stroke', d => getPathColor(d))
    .style("stroke-linecap", "round")
    .attr('stroke-width', style.strokeWidth)
    .style('pointer-events', 'none')
}

function makeInteractionPaths() {
  const g = main.append('g').attr('class', 'interactive')

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
      const lastValue = d.historyArray[d.historyArray.length-1].confirmed;

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


      label
        .attr('display', null)
        .attr('y', yScale(lastValue) - 6)
        .text(`${d.country}, ${lastValue}`)
        .moveToFront()
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
        // label.moveToFront()
        label.attr('display', 'none')
      }
      const sel = data.countryDocs.find((d) => d.country === selected )
      sel && d3.select(`.${sel.country_code}`).moveToFront()

      label.moveToFront()
    })
    .on('mouseup', (d, i, n) => {

      handleCountrySelect(d.country_code);

      dispatcher.call('datapointClick', null, d.country);
    });
}

function makeLabel() {
  label = main.append('g')
    .append('text')
    .attr('class', 'label')
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
      // .attr('stroke', color)
      // .attr('stroke-width', style.strokeWidth)
      .attr('fill', color )
      .attr('filter', null)
  }

  if(next) {
    const lastValue = next.historyArray[next.historyArray.length-1].confirmed
    d3.select(`path.${next.country_code}`)
    .attr('stroke', style.strokeColorSelected)
    .attr('stroke-width', style.strokeWidthSelected)

    d3.select(`circle.${next.country_code}`)
      .attr('r', style.selectedMarkerSize)
      .attr('fill', style.strokeColorSelected)
      // .attr('stroke', style.strokeColorSelected)

    d3.selectAll(`.${next.country_code}`)
      .attr('filter', 'url(#white-glow)')
      .moveToFront();

    label
      .attr('display', null)
      .attr('y', yScale(lastValue) - 6)
      .text(`${next.country}, ${lastValue}`).moveToFront()
  }

  selected = selectedCountry;
}

function handleCaseType(_caseType, _data) {
  caseType = _caseType;
  data = _data;

  label.attr('display', 'none')
  // makeScales();
  // makeAxes();
  updatePaths();
  updateInteractivePaths();
  updateCircleMarkers();

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
    .attr('cx', d => xScale(d.historyArray[d.historyArray.length-1].date))
    .attr('cy', d => yScale(d.historyArray[d.historyArray.length-1].confirmed))
}
const vis = {
  init,
  handleCountrySelect,
  handleCaseType,
  style,
  dispatcher
}

Object.defineProperty(vis, 'screen', {
  get: function() {
    return screen;
  }
});

export default vis;

