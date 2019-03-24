
export default class ChartComponent {
    lines = new Array();
    x;
    index;
    thumbClicked;

    modes = [{ color: '#ffffff', text: "Switch to night mode" }, { color: '#204060', text: "Switch to day mode" }];

    switchModeNodeId = "switchModeNode";
    mainCanvasId = "mainCanvas";
    longCanvasId = "longCanvas";
    pointsCanvasId = "pointsCanvas";
    containerId = "container";
    margin = 10;
    mainWidth = 800;
    mainHeight = 300;
    longChartHeight = 100;
    superLightGrayColor = '#e6e6e6';
    lightGrayColor = 'lightgray';

    scaledGridX;
    scaledGridXEnd;
    scaledMax;
    currXValue;

    constructor(chartElement, index) {
        this.parseColumns(chartElement.types, chartElement.columns, chartElement.colors, chartElement.names);
        this.index = index;
        this.switchModeNodeId += index;
        this.mainCanvasId += index;
        this.longCanvasId += index;
        this.containerId += index;
        this.pointsCanvasId += index;
    }

    createContainer() {
        let chartDiv = document.createElement("div");
        chartDiv.id = this.containerId;
        return chartDiv;
    }

    createThumbArea(context, xPos, width, height) {
        context.clearRect(xPos, 0, width, height);
        context.fillStyle = 'rgba(0,0,0,0.1)';
        context.fillRect(xPos, 0, width, height);
    }

    createChartComponent() {
        let chartDiv = document.getElementById(this.containerId);
        chartDiv.className = 'chart';
        let scaledChart = document.createElement('canvas');
        scaledChart.width = chartDiv.offsetWidth;
        scaledChart.height = this.mainHeight;
        scaledChart.id = this.mainCanvasId;
        const ctx = scaledChart.getContext('2d');
        ctx.fillStyle = this.modes[0].color;
        ctx.fillRect(0, 0, scaledChart.width, scaledChart.height);
        this.createScaledArea(scaledChart, this.x.length * 0.75, this.x.length, this.lines);

        const pointArea = document.createElement('canvas');
        pointArea.width = scaledChart.width;
        pointArea.height = this.mainHeight;
        pointArea.style.position = 'absolute';
        pointArea.style.left = (chartDiv.offsetLeft).toString();
        pointArea.style.top = chartDiv.offsetTop.toString();

        pointArea.addEventListener("mousemove", (e) => {
            this.createPoints(e.offsetX + 1, pointArea);//figure out why i need to +1 here
        });
        chartDiv.appendChild(pointArea);
        chartDiv.appendChild(scaledChart);

        const longDiv = document.createElement('div');
        longDiv.style.height = '100px';
        longDiv.style.width = '800px';
        longDiv.style.position = 'relative';
        longDiv.style.backgroundColor = this.superLightGrayColor;

        const longCanvas = document.createElement('canvas');
        longCanvas.height = this.longChartHeight;
        longCanvas.style.position = 'relative';
        longCanvas.width = this.mainWidth;
        longCanvas.id = this.longCanvasId;
        const ctx2 = longCanvas.getContext('2d');
        this.createChart(longCanvas, 0, this.x.length, this.lines, 1, false);

        const thumbArea = document.createElement('canvas');
        const thumbContext = thumbArea.getContext('2d');

        thumbArea.width = this.mainWidth;
        thumbArea.height = this.longChartHeight;
        thumbArea.style.position = 'absolute';
        thumbArea.style.left = '0';
        thumbArea.style.top = '0';

        longDiv.appendChild(thumbArea);

        this.createThumbArea(thumbContext, 650, 150, scaledChart.height)
        thumbArea.addEventListener("mousedown", (ev) => {this.isClicked(true)});
        thumbArea.addEventListener("mouseup", (ev) => this.isClicked(false));
        thumbArea.addEventListener("mousemove", (e) => {
            if (this.thumbClicked) {
                thumbContext.clearRect(0, 0, scaledChart.width, scaledChart.height);
                this.createThumbArea(thumbContext, e.offsetX, 150, scaledChart.height)
            }
        });
        longDiv.insertAdjacentElement('afterbegin', longCanvas);
        chartDiv.appendChild(longDiv);

        chartDiv.appendChild(this.createIncludePanel());
        let switchModeNode = document.createElement('p');
        switchModeNode.textContent = this.modes[0].text;
        switchModeNode.id = this.switchModeNodeId;
        switchModeNode.addEventListener("click", () => this.clickSwitchMode(this.switchModeNodeId, this.mainCanvasId, this.modes));
        chartDiv.appendChild(switchModeNode);
    }

    createScaledArea(canvas, from, to, arr) {
        this.scaledGridX = from;
        this.scaledGridXEnd = to;
        this.createGrid(canvas); //for what purpose do u pass properties
        this.createChart(canvas, from, to, arr);
    }

    createPoints(x, canvas) { //why this there is normal //
        let scale = canvas.width / (this.scaledGridXEnd - this.scaledGridX - 1); //x/scale is index of value
        let valueX = Math.round(x / scale);
        let pointX = valueX * scale;
        if (valueX == this.currXValue) { //speed economy//check it
            return;
        }
        this.currXValue = valueX;
        let arrIndX = valueX + this.scaledGridX;
        let scaleY = canvas.height / this.scaledMax;

        this.clearCanvas(canvas);//cleaning up previous resxult : optimixe by not passing when not in scale
        const ctx = canvas.getContext('2d');

        //createline
        ctx.beginPath();
        ctx.moveTo(pointX, 0);
        ctx.lineTo(pointX, canvas.height);
        ctx.strokeStyle = this.superLightGrayColor;
        ctx.lineWidth = 1.5;
        ctx.stroke();
        ctx.closePath();
        let yPositions = new Array();
        //createline
        //createpoints
        for (let i = 0; i < this.lines.length; i++) {
            if (this.lines[i].active) {
                ctx.beginPath();
                let yPos = canvas.height - (this.lines[i].array[arrIndX] * scaleY);
                ctx.arc(pointX, yPos, 5, 0, 2 * Math.PI);
                yPositions.push(yPos);
                ctx.fillStyle = 'white';
                ctx.fill();

                ctx.strokeStyle = this.lines[i].color;
                ctx.lineWidth = 2; //2 def for chart
                ctx.stroke();

                ctx.closePath();
            }
        }
        //createrect
        ctx.beginPath();
        let tabHalfWidth = 10 + yPositions.length*25, tabHeight = 50;
        let pi = Math.Pi;
        //ctx.arc(pointX - tabWidth / 2, 0 + 20, 5, 0, 2 * Math.PI);
        let offsetY = 10;
        offsetY = this.FindOptimalOffset(offsetY, tabHeight, yPositions);
        ctx.moveTo(pointX - tabHalfWidth, offsetY);
        ctx.lineTo(pointX + tabHalfWidth, offsetY);
        ctx.arcTo(pointX + tabHalfWidth + 5, offsetY, pointX + tabHalfWidth + 5, offsetY + 5, 5);
        ctx.lineTo(pointX + tabHalfWidth + 5, offsetY + tabHeight);
        ctx.arcTo(pointX + tabHalfWidth + 5, tabHeight + offsetY + 5, pointX + tabHalfWidth, tabHeight + offsetY + 5, 5);
        ctx.lineTo(pointX - tabHalfWidth, tabHeight + offsetY + 5);
        ctx.arcTo(pointX - tabHalfWidth - 5, tabHeight + offsetY + 5, pointX - tabHalfWidth - 5, tabHeight + offsetY, 5);
        ctx.lineTo(pointX - tabHalfWidth - 5, offsetY + 5);
        ctx.arcTo(pointX - tabHalfWidth - 5, offsetY, pointX - tabHalfWidth, offsetY, 5);

        ctx.strokeStyle = this.superLightGrayColor;
        ctx.lineWidth = 1.5; //2 def for chart
        ctx.stroke();
        ctx.fillStyle = 'white';
        ctx.fill();
        ctx.closePath();
        ctx.beginPath();
        ctx.fillStyle = 'black';
        ctx.font = "14px Arial";
        let xInd = this.scaledGridX+valueX;
        var dateData = this.x[xInd].toDateString().split(' ');
        ctx.textAlign = 'center';
        ctx.fillText(dateData[0]+', '+ dateData[1]+' '+dateData[2], pointX, offsetY+12);
        ctx.fill();
        ctx.closePath();
        this.lines.map((el)=>{
            if(el.active){
            ctx.beginPath();
            ctx.fillStyle = el.color;
            ctx.font = "bold 16px Arial";
            ctx.textAlign = 'left';
            let num = this.GetFormattedNum(el.array[arrIndX]);
            ctx.fillText(num,pointX-tabHalfWidth+2,offsetY+35);
            ctx.font = "14px Arial";
            ctx.fillText(el.name, pointX-tabHalfWidth+2,offsetY+50)
            pointX +=56;
            ctx.fill();
            ctx.closePath();
            }
        });
    }
    GetFormattedNum(num){
        if(num>999999){
            num *=0.000001;
            let numFract = 3 - Math.round(num).toString().length;
            num = num.toFixed(numFract<0?0:numFract);
            return num.toString()+'M';
        }
        if(num>999){
            num*=0.001;
            let numFract = 3 - Math.round(num).toString().length;
            num = num.toFixed(numFract<0?0:numFract);
            return num.toString()+'K';
        }
        return num;
    }
    FindOptimalOffset(startOffset, height, yArr) {
        for (let i = startOffset; i < this.mainHeight; i++) {
            let broken = false;
            for (let j = 0; j < yArr.length; j++) {
                if (yArr[j] > i - 15 && yArr[j] < i + height + 15) {
                    broken = true;
                    break;
                }
            }
            if (!broken) { return i; }
        }
        return startOffset;
    }

    createChart(canvas, from, to, array, lineWidth = 2, isScaled = true) { //isscaled to dlt

        const ctx = canvas.getContext('2d');
        let width = canvas.width;
        let height = canvas.height;
        let count = to - from;
        let step = width / (count - 1);

        let nArr = new Array();
        for (let i = 0; i < array.length; i++) { // make max of all active // slice arr use func
            if (!array[i].active) { //double ckeck for active, fix it
                continue;
            }
            let tArr = array[i].array.slice(from, to);
            nArr.push({ array: tArr, max: Math.max.apply(null, tArr), color: array[i].color, active: array[i].active });
        }
        let max = this.GetAbsoluteMax(nArr);
        if (isScaled)//make it in norm meyhod
            this.scaledMax = max;
        for (let i = 0; i < nArr.length; i++) {
            let xPoint = 0;
            let normHeight = height / max;
            ctx.beginPath();
            ctx.moveTo(xPoint, height - nArr[i].array[0] * normHeight);
            for (let j = 1; j < count; j++) {
                xPoint += step;
                ctx.lineTo(xPoint, height - nArr[i].array[j] * normHeight);
            }
            ctx.strokeStyle = nArr[i].color;
            ctx.lineWidth = lineWidth;
            ctx.stroke();
            ctx.closePath();
        }
    }

    sliceArr(arr, from, to) {
        let nArr = new Array();
        for (let i = 0; i < arr.length; i++) { // make max of all active
            if (!arr[i].active) { //double ckeck for active, fix it
                continue;
            }
            let tArr = arr[i].array.slice(from, to);
            nArr.push({ array: tArr, max: Math.max.apply(null, tArr), color: arr[i].color, active: arr[i].active });
        }
        return nArr;
    }

    GetAbsoluteMax(nArr) { //take int o account max can be -, also u can have a min
        let max = Number.MIN_SAFE_INTEGER;
        for (let i = 0; i < nArr.length; i++) {
            if (nArr[i].active && nArr[i].max > max) {
                max = nArr[i].max;
            }
        }
        return max;
    }

    GetCountOfActive(nArr) { //take int o account max can be -, also u can have a min
        let count = 0;
        for (let i = 0; i < nArr.length; i++) {
            if (nArr[i].active) {
                count++;
            }
        }
        return count;
    }

    createIncludePanel() {
        let includePanel = document.createElement("div");
        includePanel.style.display = 'flex';
        includePanel.style.flexDirection = 'row';
        for (let i = 0; i < this.lines.length; i++) {
            let include = this.createIncludeComponent(this.lines[i].name, this.lines[i].color);
            includePanel.appendChild(include);
        }
        return includePanel;
    }

    includeClick(lines, name, longCanvasId, mainCanvasId) {
        for (let i = 0; i < lines.length; i++) {
            if (lines[i].name == name) {
                if (lines[i].active) {
                    let count = this.GetCountOfActive(lines);
                    if (count <= 1) {
                        return; //check it;
                    }
                }
                lines[i].active = !lines[i].active;
            }
        }
        let longCanvas = document.getElementById(longCanvasId);
        let mainCanvas = document.getElementById(mainCanvasId);

        this.clearCanvas(longCanvas);
        this.createChart(longCanvas, 0, this.lines[0].array.length, this.lines, 1);//make 'to' normal
        this.clearCanvas(mainCanvas);
        this.createScaledArea(mainCanvas, this.lines[0].array.length * 0.75, this.lines[0].array.length, this.lines);
    }

    clearCanvas(canvas) {
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);
    }

    createIncludeComponent(name, color) {
        let canvas = document.createElement('canvas');
        canvas.addEventListener("click", () => this.includeClick(this.lines, name, this.longCanvasId, this.mainCanvasId));
        canvas.width = 100;
        canvas.height = 50;
        const ctx = canvas.getContext('2d');
        ctx.beginPath();
        //frame
        ctx.arc(30, 30, 15, 0.5 * Math.PI, 1.5 * Math.PI);
        ctx.arc(70, 30, 15, 1.5 * Math.PI, 0.5 * Math.PI);
        ctx.arc(30, 30, 15, 0.5 * Math.PI, 1.5 * Math.PI);
        ctx.strokeStyle = this.lightGrayColor;
        ctx.stroke();
        ctx.closePath();
        ctx.beginPath();
        ctx.arc(33, 30, 11, 0, 2 * Math.PI);
        ctx.fillStyle = color;
        ctx.fill();
        ctx.closePath();
        ctx.beginPath();
        ctx.moveTo(26, 32);
        ctx.lineTo(32, 37);
        ctx.lineTo(40, 26);
        ctx.strokeStyle = 'white';
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.closePath();
        ctx.beginPath();
        ctx.fillStyle = 'black';
        ctx.font = "14px Arial";
        ctx.fillText(name, 55, 35);
        ctx.fill();
        ctx.closePath();
        return canvas;
    }

    clickLongCanvas(e) {
        this.thumbClicked = true;
    }

    isClicked(bool) {
        this.thumbClicked = bool;
    }

    createGrid(canvas) {
        let max = this.GetAbsoluteMax(this.sliceArr(this.lines, this.scaledGridX, this.scaledGridXEnd));
        this.scaledMax = max;
        let count = 6;
        let valueStep = max / (count);
        let valueJ = 0;
        const ctx = canvas.getContext('2d');
        let width = canvas.width;
        let height = canvas.height;
        let i = 0;
        let step = height / count;
        let j = height;

        do {
            ctx.beginPath();
            ctx.fillStyle = 'gray';
            ctx.font = '10px Arial';
            ctx.fillText(Math.round(valueJ), 0, j - 2);
            ctx.moveTo(0, j);
            ctx.lineTo(width, j);
            ctx.closePath();
            ctx.strokeStyle = this.lightGrayColor;
            ctx.lineWidth = 0.3;
            ctx.stroke();
            ctx.closePath();
            j -= step;
            i++;
            valueJ += valueStep;
        } while (i < count);
    }
    clearLongChart(ctx, height, width) {
        ctx.clearRect(0, 0, 400, 100);
    }

    clickSwitchMode = (switchModeNodeId, canvasId, modes) => {
        let canvas = document.getElementById(canvasId);
        let switchModeNode = document.getElementById(switchModeNodeId);
        const ctx = canvas.getContext('2d');
        if (ctx.fillStyle == modes[0].color) {
            ctx.fillStyle = modes[1].color;
            ctx.fillRect(0, 0, this.mainWidth, this.mainHeight);
            switchModeNode.textContent = modes[1].text;
        }
        else {
            ctx.fillStyle = modes[0].color;
            ctx.fillRect(0, 0, this.mainWidth, this.mainHeight);
            switchModeNode.textContent = modes[0].text;
        }
        this.createGrid(ctx, 300, 200);
    }

    parseColumns(types, columns, colors, names) {
        let columnName = Object.keys(types);
        let type = Object.values(types);
        for (let i = 0; i < columnName.length; i++) {
            if (type[i] == "line") {
                let arr = this.getArrayByColumnName(columns, columnName[i]);
                this.lines.push({ active: true, color: colors[columnName[i]], name: names[columnName[i]], array: arr, max: Math.max.apply(null, arr) });
            }
            if (type[i] == "x") {
                this.x = this.convertArrayToDateArray(this.getArrayByColumnName(columns, columnName[i]));
            }
        }
    }

    convertArrayToDateArray(array) {
        let dateArray = new Array();
        for (let i = 0; i < array.length; i++) {
            dateArray.push(this.getDateFromUnix(array[i]));
        }
        return dateArray;
    }

    getDateFromUnix(unix) {
        return new Date(unix);
    }

    getArrayByColumnName(columns, columnName) {
        for (let i = 0; i < columns.length; i++) {
            if (columns[i][0] == columnName) {
                return columns[i].splice(1);
            }
        }
        return new Array();
    }

}
