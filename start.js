import ChartComponent from './chart-component/chart-component.js'

let charts = new Array;

function pageLoad() {
    let chartsData = JSON.parse(readTextFile('./chart_data.json'));
    if (chartsData.length) {
        chartsData.forEach(function (chartElement) {
            charts.push(new ChartComponent(chartElement, charts.length));
        }, this);
    }
    charts.forEach(function(chart){
        document.getElementById("container").appendChild(chart.createContainer());
        chart.createChartComponent();
    });
}

function readTextFile(file) {
    let chartJson;
    let rawFile = new XMLHttpRequest();
    rawFile.open("GET", file, false);
    rawFile.onreadystatechange = function () {
        if (rawFile.readyState === 4) {
            if (rawFile.status === 200 || rawFile.status == 0) {
                chartJson = rawFile.responseText;
            }
        }
    }
    rawFile.send(null);
    return chartJson;
}
pageLoad(); 