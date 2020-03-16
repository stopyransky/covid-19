import * as d3 from 'd3';

let selected = '';
const dispatcher = d3.dispatch('datapointClick')

function init(svg, data) {

    const margin = {
    top: 50,
    bottom: 50,
    left: 50,
    right: 50,
  }

  const screen = {
    width: window.innerWidth - margin.left - margin.right,
    height: window.innerHeight - margin.top - margin.bottom,
    margin
  }



  const svgSelection = d3.select(svg);
  const main = svgSelection.append('g')
  .attr('class', 'main');

  const xScale = d3.scaleTime()
    .range([screen.margin.left, screen.width])
    .domain([ new Date('2020-01-22'), new Date('2020-03-16')]);

  const confirmed = data.raw.map(d => +d['Confirmed']);
  const yDomain = d3.extent(confirmed);

  const yScale = d3.scaleSymlog()
    .range([screen.height+screen.margin.top, screen.margin.top])
    .domain(yDomain)

  const lineGen = d3.line()
    .x(function(d) {
      return xScale(new Date(d['Last Update']));
    })
    .y(function(d) {

      return yScale(+d['Confirmed']) || 0;
    })

  main.append('g').append('text')
    .attr('text', 'wat')
    .attr('class', 'label')
    .attr('display', 'none');


  main
  .selectAll('path')
  .data(data.unwrapped, d => d[0]['Country/Region'])
  .enter()
  .append('path')
    .attr('class', d => d[0]['Country/Region'])
    .attr('d', d => lineGen(d))
    .attr('fill', 'none')
    .attr('stroke', '#ccc')
    .attr('stroke-width', 1)
    .on('mouseover', (d, i, n) => {
      const country = d[0]['Country/Region'];
      if(selected !== country) {
        d3.select(n[i]).attr('stroke', 'black').attr('stroke-width', 3)
      }
      d3.select('.label')
      .attr('display', null)
      .attr('text-anchor', 'middle')
      .attr('x', screen.width)
      .attr('y', yScale(d[d.length-1]['Confirmed']))
      .text(country)
    })
    .on('mouseout', (d, i, n) => {
      if(selected !== d[0]['Country/Region']) {
        d3.select(n[i]).attr('stroke', '#ccc').attr('stroke-width', 1)
      }
      d3.select('.label').attr('display', 'none')
    })
    .on('mouseup', (d, i, n) => {
      const country =d[0]['Country/Region']
      handleSelect(country);
      dispatcher.call('datapointClick', null, country)
    })

  const xAxis = d3.axisBottom(xScale);

  svgSelection.append('g')
    .attr('class', 'x-axis')
    .attr('transform', `translate(0, ${screen.height + screen.margin.top})`)
    .call(xAxis);

  const yAxis = d3.axisRight(yScale).tickValues([
    1, 2, 5, 10,
    20, 50, 100,
    200, 500, 1000,
    2000, 5000, 10000,
    15000, 20000, 30000, 40000, 50000, ...yDomain])

    svgSelection.append('g')
    .attr('class', 'y-axis')
    .attr('transform', `translate(${screen.width}, ${0})`)
    .call(yAxis);


}


function handleSelect(selectedCountry) {
  selected = selectedCountry;
  d3.selectAll('path').attr('stroke', '#ccc').attr('stroke-width', 1)
  d3.select(`path.${selectedCountry}`).attr('stroke', 'red').attr('stroke-width', 5)
}

export default {
  init,
  handleSelect,
  dispatcher,
}
