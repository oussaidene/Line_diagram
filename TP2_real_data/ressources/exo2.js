var svg_main_width = 980,
    svg_main_height = 500;
    
// Edit this to change the context to focus proportions
var context_scale = 1 / 5;

var margin = {top: 20, right: 20, bottom: 110, left: 40},
margin2 = {top: 430, right: 20, bottom: 30, left: 40};

var width = svg_main_width - margin.left - margin.right,
    height = svg_main_height - margin.top - margin.bottom,
    height2 = svg_main_height - margin2.top - margin2.bottom;

var parseDate = d3.time.format("%Y%m%d").parse;

var x = d3.time.scale().range([0, width]),
    x2 = d3.time.scale().range([0, width]);

var y = d3.scale.linear().range([height, 0]),
    y2 = d3.scale.linear().range([height2, 0]);

var color = d3.scale.category10();

var xAxis = d3.svg.axis()
    .scale(x)
    .orient("bottom");

var yAxis = d3.svg.axis()
    .scale(y)
    .orient("left");

var xAxis2 = d3.svg.axis()
    .scale(x2)
    .orient("bottom");

var brush = d3.svg.brush()
    .x(x2)
    .on("brush", brushed);


var line = d3.svg.line()
    .interpolate("basis")
    .x(function(d) { return x(d.Year); })
    .y(function(d) { return y(d.temperature); });

var line2 = d3.svg.line()
    .interpolate("basis")
    .x(function(d) { return x2(d.Year); })
    .y(function(d) { return y2(d.temperature); });

var svg = d3.select("body").append("svg")
    .attr("class", "chart")
    .attr("width", svg_main_width)
    .attr("height", svg_main_height);

svg.append("defs").append("clipPath")
    .attr("id", "clip")
  .append("rect")
    .attr("width", width)
    .attr("height", height);

var focus = svg.append("g")
    .attr("class", "focus")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

var context = svg.append("g")
    .attr("class", "context")
    .attr("transform", "translate(" + margin2.left + "," +410 + ")");

var legend = svg.append("g")
    .attr("class", "legend")
    .attr("transform", "translate(" + margin2.left + "," + (svg_main_height - margin2.bottom + 5) + ")");

d3.tsv("ressources/data_real.tsv", function(error, data) {
  color.domain(d3.keys(data[0]).filter(function(key) { return key !== "Year"; }));

  data.forEach(function(d) {
    d.Year = parseDate(d.Year);
  });

  var cities = color.domain().map(function(name) {
    return {
      name: name,
      values: data.map(function(d) {
        return {Year: d.Year, temperature: +d[name]};
      })
    };
  });

  x.domain(d3.extent(data, function(d) { return d.Year; }));
  x2.domain(d3.extent(data, function(d) { return d.Year; }));

  y.domain([
    d3.min(cities, function(c) { return d3.min(c.values, function(v) { return v.temperature; }); }),
    d3.max(cities, function(c) { return d3.max(c.values, function(v) { return v.temperature; }); })
  ]);

  y2.domain(y.domain());

  focus.append("g")
      .attr("class", "x axis")
      .attr("transform", "translate(0," + height + ")")
      .call(xAxis);

  focus.append("g")
      .attr("class", "y axis")
      .call(yAxis)
    .append("text")
      .attr("transform", "rotate(-90)")
      .attr("y", 6)
      .attr("dy", ".71em")
      .style("text-anchor", "end")
      .text("Temperature (ºF)");

      context.append("g")
        .attr("class", "x axis")
        .attr("transform", "translate(0," + height2 + ")")
        .call(xAxis2);

  var city = focus.selectAll(".city")
      .data(cities)
    .enter().append("g")
      .attr("class", "city");

  city.append("path")
      .attr("class", "line")
      .attr("clip-path", "url(#clip)")
      .attr("d", function(d) { return line(d.values); })
      .style("stroke", function(d) { return color(d.name); });

  city.append("text")
      .datum(function(d) { return {name: d.name, value: d.values[d.values.length - 1]}; })
      .attr("class", "label")
      .attr("transform", function(d) { return "translate(" + x(d.value.Year) + "," + y(d.value.temperature) + ")"; })
      .attr("x", -45)
      .attr("dy", ".35em")
      .text(function(d) { return d.name; });

  var city2 = context.selectAll(".city")
      .data(cities)
    .enter().append("g")
      .attr("class", "city");

  city2.append("path")
      .attr("class", "line")
      .attr("d", function(d) { return line2(d.values); })
      .style("stroke", function(d) { return color(d.name); });

  context.append("g")
      .attr("class", "x brush") // y bruch
      .call(brush)
    .selectAll("rect")
      .attr("y", 0)
      .attr("height", 60);

  function mouseover(cityName) {
    // class lines to highlight and fadeout selected city
    d3.selectAll('path.line')
        .classed("highlight", function(d) { return d.name === cityName; })
        .classed("fadeout", function(d) { return d.name !== cityName; });

    // focus brush on specific city
    var values = cities.filter(function(d) { return d.name === cityName; })[0].values;
    brush.extent(d3.extent(values.map(function(d) { return d.temperature; })));
    d3.select('.brush').transition().duration(750).call(brush);
    
  }

  // remove highlighting classes
  function mouseout(cityName) {
    d3.selectAll('path.line')
        .classed("highlight", false)
        .classed("fadeout", false);
  }

  legendItem = legend.selectAll('.city')
      .data(cities.map(function(d) { return d.name; }).sort())
    .enter().append("g")
      .attr("transform", function(d, i) { return "translate(" + i*150 + ",0)"; })
      .attr("class", "city legend")
      .on("mouseover", mouseover)
      .on("touchstart", mouseover)
      .on("mouseout", mouseout)
      .on("touchend", mouseout);

  legendItem.append("rect")
      .attr("width", 25)
      .attr("height", 25)
      .attr("fill", function(d) { return color(d); });

      legendItem.append("text")
      .attr("x", 30)
      .attr("y", 16)
      .text(function(d) { return d; })
      .attr("font-size", "15px")
      .attr("font-weight", "bold");

});

function brushed(duration) {
  if (!duration) {
    duration = 0;
  }

  if (brush.empty()) {
    duration = 750;
    x.domain(x2.domain());
  } else {
    x.domain(brush.extent());
  }

  focus.selectAll(".city")
    .selectAll("path")
    .transition().duration(duration)
    .attr("d", function(d) { return line(d.values); });
  focus.selectAll(".label")
    .transition().duration(duration)
    .attr("transform", function(d) {
      return "translate(" + y(d.value.Year) + "," + x(d.value.temperature) + ")";
  });
  focus.select(".x.axis")
    .transition().duration(duration)
    .call(xAxis);
}

