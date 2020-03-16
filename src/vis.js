import * as d3 from 'd3';

function init(svg, data) {

    const margin = {
    top: 50,
    bottom: 50,
    left: 50,
    right: 90,
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
  .attr('stroke', (d, i) => d[0]['Country/Region'] === 'Poland' ? 'red': '#ccc')
  .attr('stroke-width', d => d[0]['Country/Region'] === 'Poland' ?  5 : 1)
  .on('mouseover', (d, i, n) => {
    console.log(d)
    d3.select(n[i]).attr('stroke', 'black')
    d3.select('.label')
    .attr('display', null)
    .attr('x', screen.width + screen.margin.left + 3)
    .attr('y', yScale(d[d.length-1]['Confirmed']))
    .text(d[0]['Country/Region'])
  })
  .on('mouseout', (d, i, n) => {
    const isPoland = d[0]['Country/Region'] === 'Poland'
    d3.select(n[i]).attr('stroke', isPoland ? 'red' : '#ccc')
    d3.select('.label').attr('display', 'none')
  });

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

export default {
  init
}
