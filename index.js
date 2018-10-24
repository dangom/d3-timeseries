const d3Node = require("d3-node")
const commandLineArgs = require("command-line-args")
var fs = require("fs")

const [width, height] = [964, 400]

const optionDefinitions = [
    { name: "input", type: String},
    { name: "output", type: String}
]

const d3n = new d3Node()
const d3 = d3n.d3

const overlap = 14
const margin = ({top: 60, right: 10, bottom: 20, left: 10})

function transpose (m) {
    return m[0].map((x,i) => m.map(x => x[i]))
}

function loadData (fname) {
    var csvdata = []
    var fileContents = fs.readFileSync(fname)
    var lines = fileContents.toString().split("\n")

    for (var i = 0; i < lines.length; i++) {
        let numbers = lines[i].toString().split(" ").map(Number)
        csvdata.push(numbers)
    }
    return transpose(csvdata)
}


function drawChart (data) {

    const svg = d3n.createSVG(width, height)

    const x = d3.scaleLinear()
          .domain([0, data[0].length - 1])
          .range([margin.left, width - margin.right])

    const y = d3.scalePoint()
          .domain(data.map((d, i) => i))
          .range([margin.top, height - margin.bottom])

    const z = d3.scaleLinear()
          .domain([
              d3.min(data, d => 7*d3.min(d)/2),
              d3.max(data, d => 7*d3.max(d)/2)
          ])
          .range([0, -overlap * y.step()])

    const xAxis = g => g
          .attr("transform", `translate(0,${height - margin.bottom})`)
          .call(d3.axisBottom(x.copy().domain([0, 4096*0.158/60])).ticks(width / 80))
          .call(g => g.select(".domain").remove())
          .call(g => g.select(".tick:first-of-type text").append("tspan").attr("x", 23).text(" minutes"))

    const area = d3.area()
          .defined(d => !isNaN(d))
          .x((d, i) => x(i))
          .y0(0)
          .y1(z)

    const line = area.lineY1()

    const serie = svg.append("g")
          .selectAll("g")
          .data(data)
          .enter().append("g")
          .attr("transform", (d, i) => `translate(0,${y(i) + 90})`)

    serie.append("path")
        .attr("fill", "#fff")
        .attr("d", area)

    serie.append("path")
        .attr("fill", "none")
        .attr("stroke", (d, i) => { return i % 2 === 0 ? "#103a6a" : "#ddd"})
        .attr("d", line)

    svg.append("g")
        .call(xAxis)

    return d3n.svgString()

}


const main = function(){
    const options = commandLineArgs(optionDefinitions)
    const data = loadData(options.input)
    const chart = drawChart(data)
    fs.writeFileSync(options.output, chart)
}

if (require.main === module) {
    main()
}
