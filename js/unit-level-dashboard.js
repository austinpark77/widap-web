const zlib = require('zlib')
const renderGenerationTimeSeries = require('./generation-time-series.js')
const renderEmissionsTimeSeries = require('./emissions-time-series.js')

// TODO: Find a way to coordinate div id's between JS and HTML
const GENERATION_TIME_SERIES = 'generation-time-series'
const EMISSIONS_TIME_SERIES = 'emissions-time-series'

function htmlOption(label, value) {
  return `<option label="${label}" value="${value}"></option>`
}

function addPlants(data, plantsUnits) {
  data.forEach(row => {
    plantsUnits[row.orispl_code] = {
      name: row.name,
      unitIds: row.unit_ids.split('/')
    }
    $('#plant-selector').append(htmlOption(row.name, row.orispl_code))
  })
}

function updateUnitOptions(plantsUnits) {
  $('#unit-selector').empty()
  plantsUnits[$('#plant-selector').val()].unitIds.forEach(
    unitId => {
      const cleaned = unitId.replace('*', '')
      $('#unit-selector').append(htmlOption(cleaned, cleaned))
    })
}

function clearPlots() {
  updatePlots([])
}

function updatePlots(data) {
  renderGenerationTimeSeries(GENERATION_TIME_SERIES, data);
  renderEmissionsTimeSeries(EMISSIONS_TIME_SERIES, data);
}

function parseTimeSeriesRow(row) {
  return {
    datetime: new Date(row.datetime),
    gen: +row.gen,
    co2_mass: +row.co2_mass,
    so2_mass: +row.so2_mass,
    nox_mass: +row.nox_mass,
    heat_input: +row.heat_input,
  }
}

function loadData() {
  const orisplCode = $('#plant-selector').val()
  const unitId = $('#unit-selector').val()
  if (orisplCode && unitId) {
    clearPlots();
    const sanitizedUnitId = unitId.replace('*', '')
    const dataUri = `unitlevel/${orisplCode}_${sanitizedUnitId}.csv.gz`
    fetch(dataUri, {acceptEncoding: "gzip, deflate"}).then(response => {
      response.arrayBuffer().then(buf => {
        const unzipped = zlib.gunzipSync(Buffer.from(buf))
        updatePlots(d3.csvParse(unzipped.toString(), parseTimeSeriesRow))
      })
    })
  }
}

$(document).ready(function() {
  clearPlots()
  var plantsUnits = {}
  d3.csv(`csv/plants_overview.csv`)
    .then(data => addPlants(data, plantsUnits)) // .forEach(addPlant))
  $('#plant-selector').change(e => updateUnitOptions(plantsUnits))
  $('#load-plant-unit-data-button').click(loadData)
})
