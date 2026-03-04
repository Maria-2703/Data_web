// get file input
document.getElementById('CSV Input').addEventListener('change', read_csv);
document.getElementById('API Input').addEventListener('change', read_api);

// Read CSV
function read_csv(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();

    reader.onload = function(e) {
        display_csv(e.target.result);
    };

    reader.readAsText(file);
}

// Display CSV
function display_csv(content) {
    document.getElementById('output').innerText = content;
    console.log(content);
}

// Fetch API
async function read_api(url) {
    try {
        const url = 'https://valencia.opendatasoft.com/api/explore/v2.1/catalog/datasets/valenbisi-disponibilitat-valenbisi-dsiponibilidad/records?limit=5';

        const response = await fetch(url);
        const data = await response.json();

        display_api(data.results);

    } catch (error) {
        console.error("Error:", error);
    }
}

// Display API
function display_api(results) {
    document.getElementById('apiOutput').innerText =
        JSON.stringify(results, null, 2);
}

function createPlot(x, y) {
    const trace = {
        x: x,
        y: y,
        mode: 'markers',  // markers, diamonds
        type: 'bar',  // line, bar, scatter
        marker: { size: 5, color: '#b1e9bd' }
    };

    const layout = {
        title: 'My first Scatter Plot with Plotly!',
        xaxis: { title: 'X-axis' },
        yaxis: { title: 'Y-axis' },
        hovermode: 'closest'
    };

    const config = { responsive: true };

    Plotly.newPlot('plotContainer', [trace], layout, config);
}