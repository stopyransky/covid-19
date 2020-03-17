import * as d3 from 'd3';

const dispatcher = d3.dispatch('datapointClick')
let selected = '';
let data;
let svgSelection, screen;
let main, xScale, yScale, yDomain, lineGen;

const style = {
  strokeColor: '#FFC042',
  strokeWidth: 1,
  strokeColorSelected: 'white',
  strokeWidthSelected: 5,
  strokeWidthHover: 3,
  strokeColorHover: '#EFD28B',
  textColor: 'white',
  tickTextColor: 'white',
  tickLineColor: '#aaa',
  tickLineStyle: '0.5, 5',
  tickTextSize: '0.8rem',
  strokeWidthInteractive: 8,
  markerSize: 2,
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
    left: 20,
    right: w < 1024 ? 40: 150,
  }
  screen = {
    w, h,
    width: w - margin.left - margin.right,
    height: h - margin.top - margin.bottom,
    margin
  }

  main = svgSelection.append('g')
  .attr('class', 'main');

  xScale = d3.scaleTime()
    .range([screen.margin.left, screen.width])
    .domain([ new Date('2020-01-22'), new Date('2020-03-16')]);

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
  drawInteractionPaths()
}

function drawAxes() {
  const xAxis = d3.axisBottom(xScale);

  const defaultXTicks = xScale.ticks();

  xAxis.tickValues(screen.w < 1024 ? [defaultXTicks[0], defaultXTicks[defaultXTicks.length-1]] : defaultXTicks)
  const xAxisSel = main.append('g')
    .attr('class', 'x-axis')
    .attr('transform', `translate(0, ${screen.height + screen.margin.top})`)
    .call(xAxis);

  xAxisSel.selectAll('.tick').select('text')
    .attr('fill', style.tickTextColor)
    .style('font-size', style.tickTextSize)
    .style('font-family', '"Playfair Display", serif');

  xAxisSel.selectAll('.tick')
    .select('line')
    .attr('stroke', style.tickLineColor);

  const yAxis = d3.axisRight(yScale).tickValues([
    5, 50, 500, 5000, 50000,  ...yDomain
  ])

    const yAxiSel = main.append('g')
    .attr('class', 'y-axis')
    .attr('transform', `translate(${screen.width}, ${0})`)
    .call(yAxis)

    yAxiSel.selectAll('.tick')
      .select('text')
      .attr('fill', style.tickTextColor)
      .style('font-size', style.tickTextSize)
      .style('font-family', '"Playfair Display", serif');
    yAxiSel.selectAll('.tick')
      .select('line')
      .attr('x1', 0)
      .attr('x2', -screen.width + screen.margin.left)
      .attr('stroke-dasharray', style.tickLineStyle)
      .attr('stroke', style.tickLineColor);


    d3.selectAll('.domain').remove();

}

function drawCircleMarkers() {

  main
  .selectAll('circle')
  .data(data.countryDocs, d => d.country_code)
  .enter()
  .append('circle')
    .attr('class', 'end-circle' )
    .attr('cx', d => xScale(d.historyArray[d.historyArray.length-1].date))
    .attr('cy', d => yScale(d.historyArray[d.historyArray.length-1].confirmed))
    .attr('r', style.markerSize)
    .attr('fill', style.strokeColor)
    .attr('stroke', style.strokeColor)
    // .style("stroke-linecap", "round")
    .attr('stroke-width', style.circleStrokeWidth)
    .style('pointer-events', 'none')
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
    .attr('stroke', style.strokeColor)
    .style("stroke-linecap", "round")
    .attr('stroke-width', style.strokeWidth)
    .style('pointer-events', 'none')
}
function drawInteractionPaths() {


  const g = main.append('g').attr('class', 'interactive')
  g.append('g')
  .append('text')
  .attr('class', 'label')
  .style('font-family', 'Playfair Display')
  .attr('font-weight', 'bold')
  .attr('display', 'none');

  g.selectAll('path')
  .data(data.countryDocs, d => d.country_code)
  .enter()
  .append('path')
    .attr('class', d => d.country_code + '_')
    .attr('d', d => lineGen(d.historyArray))
    .attr('fill', 'none')
    .attr('stroke', 'transparent')
    .style("stroke-linecap", "round")
    .attr('stroke-width', style.strokeWidthInteractive)
    .on('mouseover', (d, i, n) => {
      // const country = d.country;
      if(selected !== d.country) {
        d3.select(`.${d.country_code}`)
          .attr('stroke', style.strokeColorHover)
          .attr('stroke-width', style.strokeWidthHover)
      }

      const lastValue = d.historyArray[d.historyArray.length-1].confirmed;

      const w = svgSelection.attr('width');
      d3.select('.label')
      .attr('display', null)
      .attr('text-anchor', w < 1024 ? 'end' : 'start')
      .attr('font-size', '16px')

      .attr('x', w < 1024 ? screen.width - 8 : screen.width + 8)
      .attr('y', yScale(lastValue) - 4)
      .attr('fill', style.textColor)
      .text(`${d.country}, ${lastValue}`)
      .style('z-index', 100);
    })
    .on('mouseout', (d, i, n) => {
      if(selected !== d.country) {
        d3.select(`.${d.country_code}`)
          .attr('stroke', style.strokeColor)
          .attr('stroke-width', style.strokeWidth)
      }
      d3.select('.label').attr('display', 'none')
    })
    .on('mouseup', (d, i, n) => {
      // const country = d.country;
      handleSelect(d.country_code);
      dispatcher.call('datapointClick', null, d.country)
    })
}





function handleSelect(selectedCountry) {
  const s = data.countryDocs.find((d) => d.country === selectedCountry )
  const p = data.countryDocs.find((d) => d.country === selected )
  p && d3.select(`path.${p.country_code}`)
    .attr('stroke', style.strokeColor)
    .attr('stroke-width', style.strokeWidth)
  s && d3.select(`path.${s.country_code}`)
    .attr('stroke', style.strokeColorSelected)
    .attr('stroke-width', style.strokeWidthSelected)
  selected = selectedCountry;
}

const vis = {
  init,
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

