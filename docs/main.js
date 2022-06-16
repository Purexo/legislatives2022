async function main() {

const DB = await loadDatabase();

const CIRCONSCRIPTION_RESULTS = `
SELECT
  -- define x and y by radian angle and radius
  0 AS x,
  1 AS y,
  1 AS z,
  1 AS value,
  -- same size for each points
  c.label_circonscription AS name,
  -- used for compute colors
  json_object(
    'linearGradient', json_object(
      'x1', 0,
      'x2', 0,
      'y1', 0,
      'y2', 1
    ),
    'stops', json_array(
      json_array(0, n_maj.color_nuance),
      json_array(cc.majoritaire_proportion_duel / 100 - 0.0000001, n_maj.color_nuance),
      json_array(cc.majoritaire_proportion_duel / 100 + 0.0000001, n_min.color_nuance),
      json_array(0, n_min.color_nuance)
    )
  ) AS color,
  -- split info
  n_maj.code_nuance AS split_key_series,
  n_maj.code_nuance AS n_maj_code,
  n_min.code_nuance AS n_min_code,
  n_maj.label_nuance AS n_maj_label,
  n_min.label_nuance AS n_min_label,
  -- tooltips info
  c_maj.sieges AS c_maj_sieges,
  c_min.sieges AS c_min_sieges,
  c_maj.nom || ' ' || c_maj.prenom AS c_maj_name,
  c_min.nom || ' ' || c_min.prenom AS c_min_name,
  CAST(
      c_maj.voix AS REAL
  ) / c.exprimes * 100 AS c_maj_pourcentage_exprimes,
  CAST(
      c_min.voix AS REAL
  ) / c.exprimes * 100 AS c_min_pourcentage_exprimes,
  c_maj.voix AS c_maj_voix,
  c_min.voix AS c_min_voix
FROM circonscriptions_consolidees cc
INNER JOIN circonscriptions c ON cc.rowid = c.rowid
INNER JOIN candidats c_maj ON
  cc.code_departement = c_maj.code_departement
  AND cc.code_circonscription = c_maj.code_circonscription
  AND cc.majoritaire_numero_panneau = c_maj.numero_panneau
INNER JOIN candidats c_min ON
  cc.code_departement = c_min.code_departement
  AND cc.code_circonscription = c_min.code_circonscription
  AND cc.minoritaire_numero_panneau = c_min.numero_panneau
INNER JOIN nuances n_maj ON c_maj.code_nuance = n_maj.code_nuance
INNER JOIN nuances n_min ON c_min.code_nuance = n_min.code_nuance
ORDER BY n_maj.rowid, cc.majoritaire_proportion_duel
-- du plus à gauche au plus à droite, puis du plus victorieux au moins victorieux
`;


const series = [];
let current_serie = null
let current_serie_identifier = null;
let current_serie_data = null;
let stmt = DB.each(CIRCONSCRIPTION_RESULTS, {}, row => {
  row.color = JSON.parse(row.color);
  
  if (row.split_key_series !== current_serie_identifier) {
    current_serie && series.push(current_serie);
    
    current_serie_identifier = row.split_key_series;
    current_serie = {
      name: row.n_maj_label,
      data: [],
      dataLabels: {
        enabled: false,
        format: '{point.label}'
      },
      
      // Circular options
      center: ['50%', '88%'],
      size: '170%',
      startAngle: -100,
      endAngle: 100
    };
    current_serie_data = current_serie.data;
  }
  
  current_serie_data.push(row);
});
current_serie && series.push(current_serie);

Highcharts.chart('chart-quantique-assemble', {
  chart: {
    type: 'item',
    // type: 'packedbubble',
  },
  
  title: {
    text: 'Parlement au premier tour'
  },
  
  subtitle: {
    text: 'une vision quantique'
  },
  
  legend: {
    labelFormat: '{name}'
  },
  
  tooltip: {
    useHTML: true,
    pointFormatter: (point) => {
      if (point.c_maj_sieges > 0) return `
        <b>{point.name} :</b> <br/>
        {point.n_maj_code} <b>{point.c_maj_name}</b> <br/>
        %exprimés : {point.c_maj_pourcentage_exprimes}
      `;
      
      return `
        <b>{point.name} :</b> <br/>
        {point.n_maj_code} <b>{point.c_maj_name}</b> - {point.c_maj_pourcentage_exprimes} <br/>
        Contre
        {point.n_min_code} <b>{point.c_min_name}</b> - {point.c_min_pourcentage_exprimes} <br/>
      `;
    }
  },
  
  plotOptions: {
    packedbubble: {
      minSize: '20%',
      maxSize: '100%',
      zMin: 0,
      zMax: 1000,
      layoutAlgorithm: {
        gravitationalConstant: 0.05,
        splitSeries: true,
        seriesInteraction: false,
        dragBetweenSeries: true,
        parentNodeLimit: true
      },
      dataLabels: {
        enabled: false,
        format: '{point.name}',
        filter: {
          property: 'y',
          operator: '>',
          value: 250
        },
        style: {
          color: 'black',
          textOutline: 'none',
          fontWeight: 'normal'
        }
      }
    }
  },
  
  series: series,
  
  responsive: {
    rules: [{
      condition: {
        maxWidth: 600
      },
      chartOptions: {
        series: [{
          dataLabels: {
            distance: -30
          }
        }]
      }
    }]
  }
});
}

main().catch(console.error)

// --- Hoistings Utils Functions --- //

function lerp(start, end, amt) {
  return (1 - amt) * start + amt * end
}
