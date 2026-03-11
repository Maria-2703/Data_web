// global variables
let csv_content = "";
let api_content = "";
let lines = [];
let headers = [];

// read file
document.getElementById("csvInput").addEventListener("change", function(event){

    const file = event.target.files[0];
    if(!file) return;

    const reader = new FileReader();
    reader.onload = function(e){
        csv_content = e.target.result;
    };
    reader.readAsText(file);

});

// read csv data 
function displayCSV(){

    if(!csv_content){
        alert("No CSV loaded yet.");
        return;
    }

    // get lines and column names
    lines = csv_content.trim().split(/\r?\n/);
    headers = lines[0].split(',');
    lines = lines.slice(1);  // remove headers

    // show table and dropdown for dep and indp veriable
    renderTable(headers, lines);
    createVariableSelectors(headers);
}

// get y and x values and their stats
function getStats() {

    // get index for x and y
    const xIndex = document.getElementById("indSelect").value;
    const yIndex = document.getElementById("depSelect").value;
    
    // get variables in those indexes
    const data = extractVariables(xIndex, yIndex);
    
    // get the stats
    const results = calculateFullStats(data.xData, data.yData);

    document.getElementById("stat-cases").innerText = results.n;
    document.getElementById("stat-xmean").innerText = results.means.x.toFixed(2);
    document.getElementById("stat-ymean").innerText = results.means.y.toFixed(2);
    document.getElementById("stat-ssx").innerText = results.variations.ssX.toFixed(2);
    document.getElementById("stat-ssy").innerText = results.variations.ssY.toFixed(2);
    document.getElementById("stat-spxy").innerText = results.variations.spXY.toFixed(2);
    document.getElementById("stat-slope").innerText = results.coefficients.unstdB.toFixed(2);
    document.getElementById("stat-intercept").innerText = results.coefficients.intercept.toFixed(2);
    document.getElementById("stat-rsq").innerText = results.modelSummary.rSquared.toFixed(4);
    document.getElementById("stat-ssbetween").innerText = results.anova.ssBetween.toFixed(2);
    document.getElementById("stat-sswithin").innerText = results.anova.ssWithin.toFixed(2);
    drawRegressionChart(data.xData, data.yData, results.coefficients.unstdB, results.coefficients.intercept);

}

// extract selected ind and dep variables
function extractVariables(xIndex,yIndex){
    const xData = [];
    const yData = [];

    // get every variables according to the ind and dep index
    for(let i=0; i<lines.length; i++){
        const cells = lines[i].split(',');

        // add x and y values to their array
        if(cells.length === headers.length){
            const x = Number(cells[xIndex]);
            const y = Number(cells[yIndex]);

            if(!isNaN(x) && !isNaN(y)){
                xData.push(x);
                yData.push(y);
            }
        }
    }
    return {xData,yData};
}

// calculate the stats for each ind and dep variable
function calculateFullStats(xData, yData) {

    // define size, x and y 
    const n = xData.length;
    const x = xData.map(Number);
    const y = yData.map(Number);

    // formulas
    const mean = (arr) => arr.reduce((a, b) => a + b, 0) / arr.length;
    const getSS = (arr, mean) => arr.reduce((sum, val) => sum + (val - mean) ** 2, 0);
    const getSP = (xArr, xMean, yArr, yMean) => xArr.reduce((sum, x, i) => sum + (x - xMean) * (yArr[i] - yMean), 0);

    // get mean
    const xMean = mean(x);
    const yMean = mean(y);

    // sum of squares
    const ssX = getSS(x, xMean);
    const ssY = getSS(y, yMean);

    // sum of products
    const spXY = getSP(x, xMean, y, yMean); 

    // regression line (y = A + Bx)
    const B = spXY / ssX;  // slope
    const A = yMean - B * xMean;  // intercept

    // R-squared 
    const rSq = (spXY ** 2) / (ssX * ssY);

    // ANOVA 
    const ssBetween = rSq * ssY;
    const ssWithin = ssY - ssBetween;

    return {
        n: n,
        means: { x: xMean, y: yMean },
        variations: { ssX, ssY, spXY },
        coefficients: { unstdB: B, intercept: A },
        anova: { ssBetween, ssWithin },
        modelSummary: { rSquared: rSq }
    };
}

// read API
async function displayAPI(){

    const url = document.getElementById("apiInput").value;

    if(!url){
        alert("Please enter an API URL.");
        return;
    }

    try{
        // get the data
        const response = await fetch(url);
        const data = await response.json();
        const records = data.results;
    
        // get headers
        headers = Object.keys(records[0]);

        // obj -> rows
        lines = records.map(obj => 
            headers.map(h => obj[h]).join(",")
        );

        renderTable(headers, lines);
        createVariableSelectors(headers);
    }
    catch(error){

        console.error(error);
        alert("Failed to fetch API");
    }
}

//------------- FRONTEND FUNCTIONS------------------------------------------------------------------------------------------------------

// create table to display csv
function renderTable(headers, lines){

    let html = '<table border="1">';
    html += "<thead><tr>";

    for(let i=0; i<headers.length; i++){
        html += `<th>${headers[i]}</th>`;
    }

    html += "</tr></thead>";
    html += "<tbody>";

    for(let i=0;i<lines.length;i++){
        const cells = lines[i].split(',');

        if(cells.length === headers.length){
            html += "<tr>";

            for(let j=0;j<cells.length;j++){
                html += `<td>${cells[j]}</td>`;
            }
            html += "</tr>";
        }
    }

    html += "</tbody></table>";
    document.getElementById("output").innerHTML = html;
}


// stats button
function createVariableSelectors(headers){

    // dropdown option for indp and dep variable
    createDropdown("indVar","indSelect","Independent Variable (X):",headers);
    createDropdown("depVar","depSelect","Dependent Variable (Y):",headers);

    // create section
    const container = document.getElementById("variableSelectors");

    // if it doesn't exist yet
    if(!document.getElementById("statBtn")){
        const btn = document.createElement("button");
        btn.id = "statBtn";
        btn.textContent = "Get Statistics";
        btn.onclick = getStats;  // when it clicks -> getStats function
        container.appendChild(btn);
    }

}

// function for the dropdowns
function createDropdown(containerId,selectId,labelText,options){

    // section
    const container = document.getElementById(containerId);
    container.innerHTML = "";
    
    // create label
    const label = document.createElement("label");
    label.textContent = labelText;

    // slect option
    const select = document.createElement("select");
    select.id = selectId;

    // create an option for every variable
    for(let i=0; i<options.length; i++){
        const option = document.createElement("option");
        option.value = i;
        option.textContent = options[i];
        select.appendChild(option);
    }

    // append to section
    container.appendChild(label);
    container.appendChild(select);
}

function drawRegressionChart(xData, yData, slope, intercept){

    // Create points for scatter plot
    const points = xData.map((x,i) => ({x:x, y:yData[i]}));

    // Create two points for the regression line (from min to max x)
    const minX = Math.min(...xData);
    const maxX = Math.max(...xData);
    const line = [
        {x:minX, y: intercept + slope*minX},
        {x:maxX, y: intercept + slope*maxX}
    ];

    const ctx = document.getElementById("regressionChart").getContext("2d");

    // Destroy previous chart if exists (so multiple clicks don’t stack)
    if(window.regressionChartInstance) window.regressionChartInstance.destroy();

    // Create the chart
    window.regressionChartInstance = new Chart(ctx,{
        type:"scatter",
        data:{
            datasets:[
                {
                    label:"Data Points",
                    data:points,
                    backgroundColor:"#7ed6df"
                },
                {
                    label:"Regression Line",
                    data:line,
                    type:"line",
                    borderColor:"#ff6b81",
                    borderWidth:2,
                    fill:false,
                    tension:0.2
                }
            ]
        },
        options:{
            responsive:true,
            plugins:{
                legend:{display:true}
            },
            scales:{
                x:{type:"linear", position:"bottom"},
                y:{beginAtZero:false}
            }
        }
    });
}