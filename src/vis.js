import * as d3 from 'd3';
import { THRESHOLD } from './App';
import { scryRenderedComponentsWithType } from 'react-dom/test-utils';

const dispatcher = d3.dispatch('datapointClick')
const format = d3.timeFormat('%d %b');
let selected = '';

let data;
let svgSelection, screen;
let main, xScale, xDomain, yScale, yDomain, lineGen;

d3.selection.prototype.moveToFront = function() {
  return this.each(function() { this.parentNode.appendChild(this); });
};

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

function init(svg, _data) {

  data = _data;

  svgSelection = d3.select(svg);
  const w = svgSelection.attr('width');
  const h = svgSelection.attr('height');


  const margin = {
    top: 50,
    bottom: 50,
    left: 30,
    right: w < THRESHOLD ? 30: 150,
  }
  screen = {
    w, h,
    width: w - margin.left - margin.right,
    height: h - margin.top - margin.bottom,
    margin
  }

  main = svgSelection.append('g')
    .attr('class', 'main')
    .attr('transform', `translate(20, 0)`);

  xDomain = [ new Date('2020-01-22'), new Date('2020-03-17')]
  xScale = d3.scaleTime()
    .range([screen.margin.left, screen.width])
    .domain(xDomain);

  const confirmed = data.docs.map(d => d.confirmed);

  yDomain = d3.extent(confirmed);

  yScale = d3.scaleSymlog()
    .range([screen.height+screen.margin.top, screen.margin.top])
    .domain(yDomain)

  lineGen = d3.line()
    .curve(d3.curveMonotoneX)
    .x(d => xScale(new Date(d.date)))
    .y(d => yScale(+d.confirmed))

  drawAxes()
  drawCircleMarkers();
  drawPaths()
  drawInteractionPaths();

  main.append('g')
  .append('text')
  .attr('class', 'label')
  .style('font-family', style.fontFamily)
  // .attr('font-weight', 'bold')
  .attr('display', 'none')
  .attr('text-anchor', w < THRESHOLD ? 'end' : 'start')
  .attr('font-size', '16px')
  .attr('x', w < THRESHOLD ? screen.width - 8 : screen.width + 8)
  .attr('fill', style.textColor)
  .style('z-index', 100)
}

function drawAxes() {
  const xAxis = d3.axisBottom(xScale);

  const [ _, ...rest] = xScale.ticks();
  rest.pop();
  xAxis
    .tickPadding(8)
    .tickValues(screen.w < THRESHOLD ? xDomain : [...rest, ...xDomain]).tickFormat(format)
  const xAxisSel = main.append('g')
    .attr('class', 'x-axis')
    .attr('transform', `translate(0, ${screen.height + screen.margin.top})`)
    .call(xAxis);

  xAxisSel.selectAll('.tick').select('text')
    .attr('fill', style.tickTextColor)
    .style('font-size', style.tickTextSize)
    .style('font-family', style.fontFamily);

  xAxisSel.selectAll('.tick')
    .select('line')
    .attr('stroke', style.tickLineColor);


  if(screen.w >= THRESHOLD) {
    const yAxis = d3.axisRight(yScale).tickValues([ 5, 50, 500, 5000, 50000 ])

    const yAxiSel = main.append('g')
      .attr('class', 'y-axis')
      .attr('transform', `translate(${screen.width}, 0)`)
      .call(yAxis)

    yAxiSel.selectAll('.tick')
      .select('text')
      .attr('fill', style.tickTextColor)
      .style('font-size', style.tickTextSize)
      .attr('dy', 2)
      .style('font-family', style.fontFamily);
    yAxiSel.selectAll('.tick')
      .select('line')
      .attr('x1', 0)
      .attr('x2', -screen.width + screen.margin.left)
      .attr('stroke-dasharray', style.tickLineStyle)
      .attr('stroke', style.tickLineColor);
  }
    d3.selectAll('.domain').remove();

}

function drawCircleMarkers() {

  main
  .selectAll('circle')
  .data(data.countryDocs, d => d.country_code)
  .enter()
  .append('circle')
    .attr('class', d => `${d.country_code}` )
    .attr('cx', d => xScale(d.historyArray[d.historyArray.length-1].date))
    .attr('cy', d => yScale(d.historyArray[d.historyArray.length-1].confirmed))
    .attr('r', style.markerSize)
    .attr('fill', d => getPathStroke(d))
    .attr('stroke', style.strokeColor)
    .attr('stroke-width', style.circleStrokeWidth)
    .style('pointer-events', 'none')
}

function getPathStroke(d, isDeselected) {
  if(!isDeselected && selected === d.country) {
    return style.strokeColorSelected;
  }
  const latest = d.historyArray[d.historyArray.length-1].confirmed;

  const s = yScale(latest)/yScale(yDomain[0]);
  const col = d3.hsl(0, 0.5 + s * 0.2 , 0.5);
  return col;

}
function drawPaths() {
  main
  .selectAll('path')
  .data(data.countryDocs, d => d.country_code)
  .enter()
  .append('path')
    .attr('class', d => d.country_code )
    .attr('d', d => lineGen(d.historyArray))
    .attr('fill', 'none')
    .attr('stroke', d => getPathStroke(d))
    .style("stroke-linecap", "round")
    .attr('stroke-width', style.strokeWidth)
    .style('pointer-events', 'none')
}

function drawInteractionPaths() {
  const g = main.append('g').attr('class', 'interactive')

  g.selectAll('path')
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
          .attr('stroke', style.strokeColorHover)
          .attr('fill', style.strokeColorHover)
          .attr('stroke-width', style.strokeWidthHover)
          .moveToFront()
      }


        d3.select('.label')
        .attr('display', null)
        .attr('y', yScale(lastValue) - 6)
        .text(`${d.country}, ${lastValue}`)
        .moveToFront()



    })
    .on('mouseout', (d, i, n) => {
      if(selected !== d.country) {
        const strokeColor = getPathStroke(d);
        d3.select(`path.${d.country_code}`)
          .attr('stroke', strokeColor)
          .attr('stroke-width', style.strokeWidth)

        d3.select(`circle.${d.country_code}`)
          .attr('stroke', strokeColor)
          .attr('stroke-width', style.strokeWidth)
          .attr('fill', strokeColor)


        d3.select('.label').attr('display', 'none')
      }
      const sel = data.countryDocs.find((d) => d.country === selected )
      sel && d3.select(`.${sel.country_code}`).moveToFront()

      d3.select('.label').moveToFront()
    })
    .on('mouseup', (d, i, n) => {

      handleSelect(d.country_code);

      dispatcher.call('datapointClick', null, d.country);
    })
}

function handleSelect(selectedCountry) {
  const prev = data.countryDocs.find((d) => d.country === selected )
  const next = data.countryDocs.find((d) => d.country === selectedCountry )

  if(prev) {
    const color = getPathStroke(prev, true);
    d3.select(`path.${prev.country_code}`)
    .attr('stroke', color)
    .attr('filter', null)
    .attr('stroke-width', style.strokeWidth)
    d3.select(`circle.${prev.country_code}`)
      .attr('r', style.markerSize)
      .attr('stroke', color)
      .attr('stroke-width', style.strokeWidth)
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
      .attr('stroke', style.strokeColorSelected)

    d3.selectAll(`.${next.country_code}`)
      .attr('filter', 'url(#white-glow)')
      .moveToFront();

    d3.select('.label')
      .attr('display', null)
      .attr('y', yScale(lastValue) - 6)
      .text(`${next.country}, ${lastValue}`).moveToFront()
  }

  selected = selectedCountry;
}

function resize() {
  const w = svgSelection.attr('width');
  const h = svgSelection.attr('height');


  const margin = {
    top: 50,
    bottom: 50,
    left: 30,
    right: w < THRESHOLD ? 30: 150,
  }
  screen = {
    w, h,
    width: w - margin.left - margin.right,
    height: h - margin.top - margin.bottom,
    margin
  }
}

const vis = {
  init,
  resize,
  handleSelect,
  style,
  dispatcher
}

Object.defineProperty(vis, 'screen', {
  get: function() {
    return screen;
  }
});

export default vis;

