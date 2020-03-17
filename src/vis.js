import * as d3 from 'd3';

let selected = '';
const dispatcher = d3.dispatch('datapointClick')
let data;
function init(svg, _data) {

    data = _data;
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

  const confirmed = data.docs.map(d => d.confirmed);
  const yDomain = d3.extent(confirmed);

  const yScale = d3.scaleSymlog()
    .range([screen.height+screen.margin.top, screen.margin.top])
    .domain(yDomain)

  const lineGen = d3.line()
    .x(function(d) {
      return xScale(new Date(d.date));
    })
    .y(function(d) {

      return yScale(+d.confirmed) || 0;
    })

  main.append('g').append('text')
    .attr('text', 'wat')
    .attr('class', 'label')
    .attr('display', 'none');


  main
  .selectAll('path')
  .data(data.countryDocs, d => d.country_code)
  .enter()
  .append('path')
    .attr('class', d => d.country_code)
    .attr('d', d => lineGen(d.historyArray))
    .attr('fill', 'none')
    .attr('stroke', '#ccc')
    .style("stroke-linecap", "round")
    .attr('stroke-width', 1)
    .on('mouseover', (d, i, n) => {
      // const country = d.country;
      if(selected !== d.country) {
        d3.select(n[i]).attr('stroke', 'black').attr('stroke-width', 3)
      }

      console.log(d);
      d3.select('.label')
      .attr('display', null)
      .attr('text-anchor', 'middle')
      .attr('x', screen.width)
      .attr('y', yScale(d.confirmed))
      .text(d.country)
    })
    .on('mouseout', (d, i, n) => {
      if(selected !== d.country) {
        d3.select(n[i]).attr('stroke', '#ccc').attr('stroke-width', 1)
      }
      d3.select('.label').attr('display', 'none')
    })
    .on('mouseup', (d, i, n) => {
      // const country = d.country;
      handleSelect(d.country_code);
      dispatcher.call('datapointClick', null, d.country)
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
  const d = data.countryDocs.find((d) => d.country === selectedCountry )
  d3.selectAll('path').attr('stroke', '#ccc').attr('stroke-width', 1)
  d && d3.select(`path.${d.country_code}`).attr('stroke', 'red').attr('stroke-width', 5)
}

export default {
  init,
  handleSelect,
  dispatcher,
}
