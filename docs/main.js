async function main() {
  
  const DB = await loadDatabase();
  
  const CIRCONSCRIPTION_RESULTS = `
SELECT
  d.code_departement  || '-' || c.code_circonscription AS id,
  d.code_departement || ' ' || d.label_departement || ' ' || c.label_circonscription AS name,
  -- used for compute colors
  json_object(
    'linearGradient', json_object(
      'x1', 0,
      'y1', 0,
      'x2', 1,
      'y2', 0
    ),
    'stops', json_array(
      json_array(0, n_maj.color_nuance),
      json_array(cc.majoritaire_proportion_duel / 100 - 0.0000001, n_maj.color_nuance),
      json_array(cc.majoritaire_proportion_duel / 100 + 0.0000001, n_min.color_nuance),
      json_array(0, n_min.color_nuance)
    )
  ) AS color,
  n_maj.color_nuance AS n_maj_color,
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
INNER JOIN departements d ON c.code_departement = d.code_departement
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
  
  const coordinates = [
    ...genPointsOnHemicycle(0, 0, 10, 10),
    ...genPointsOnHemicycle(0, 0, 20, 20),
    ...genPointsOnHemicycle(0, 0, 30, 30),
    ...genPointsOnHemicycle(0, 0, 40, 40),
    ...genPointsOnHemicycle(0, 0, 50, 50),
    ...genPointsOnHemicycle(0, 0, 60, 60),
    ...genPointsOnHemicycle(0, 0, 70, 70),
    ...genPointsOnHemicycle(0, 0, 80, 80),
    ...genPointsOnHemicycle(0, 0, 90, 90),
    ...genPointsOnHemicycle(0, 0, 100, 100),
    ...genPointsOnHemicycle(0, 0, 110, 110),
    ...genPointsOnHemicycle(0, 0, 120, 27),
  ];
  const series = [];
  let current_serie = null
  let current_serie_identifier = null;
  let current_serie_data = null;
  let index = 0;
  
  DB.each(CIRCONSCRIPTION_RESULTS, {}, row => {
    const {x, y} = coordinates[index++];
    row.x = x;
    row.y = -y;
    row.z = 1;
    row.color = JSON.parse(row.color);
    
    if (row.split_key_series !== current_serie_identifier) {
      current_serie && series.push(current_serie);
      
      current_serie_identifier = row.split_key_series;
      current_serie = {
        name: row.n_maj_label,
        color: row.n_maj_color,
        data: [],
      };
      current_serie_data = current_serie.data;
    }
    
    current_serie_data.push(row);
  });
  current_serie && series.push(current_serie);
  
  Highcharts.chart('chart-quantique-assemble', {
    chart: {
      type: 'bubble',
      plotBorderWidth: 1,
      zoomType: 'xy',
      height: 800,
    },
    
    title: {
      text: 'Parlement au premier tour',
    },
    
    subtitle: {
      text: 'une vision quantique',
    },
    
    legend: {
      enabled: false
    },
    
    tooltip: {
      useHTML: true,
      headerFormat: '<table>',
      // pointFormat: '<tr><th colspan="2"><h3>{point.country}</h3></th></tr>' +
      //   '<tr><th>Fat intake:</th><td>{point.x}g</td></tr>' +
      //   '<tr><th>Sugar intake:</th><td>{point.y}g</td></tr>' +
      //   '<tr><th>Obesity (adults):</th><td>{point.z}%</td></tr>',
      pointFormat: `
        <b>{point.name} :</b> <br/>
        {point.n_maj_code} <b>{point.c_maj_name}</b> - {point.c_maj_pourcentage_exprimes} <br/>
        Contre
        {point.n_min_code} <b>{point.c_min_name}</b> - {point.c_min_pourcentage_exprimes} <br/>
      `,
      
      // pointFormatter: (point) => {
      //   if (point.c_maj_sieges > 0) return `
      //   <b>${point.name} :</b> <br/>
      //   ${point.n_maj_code} <b>${point.c_maj_name}</b> <br/>
      //   %exprimés : ${point.c_maj_pourcentage_exprimes}
      // `;
      //
      //   return `
      //   <b>${point.name} :</b> <br/>
      //   ${point.n_maj_code} <b>${point.c_maj_name}</b> - ${point.c_maj_pourcentage_exprimes} <br/>
      //   Contre
      //   ${point.n_min_code} <b>${point.c_min_name}</b> - ${point.c_min_pourcentage_exprimes} <br/>
      // `;
      // },
      footerFormat: '</table>',
      followPointer: true,
    },
    
    // plotOptions: {
    //   packedbubble: {
    //     minSize: '20%',
    //     maxSize: '100%',
    //     zMin: 0,
    //     zMax: 1000,
    //     layoutAlgorithm: {
    //       enableSimulation: false,
    //       maxSpeed: 25,
    //       maxIterations: 10,
    //       gravitationalConstant: 0.05,
    //       splitSeries: true,
    //       seriesInteraction: false,
    //       dragBetweenSeries: true,
    //       parentNodeLimit: true
    //     },
    //     dataLabels: {
    //       enabled: false,
    //       format: '{point.name}',
    //       filter: {
    //         property: 'y',
    //         operator: '>',
    //         value: 250
    //       },
    //       style: {
    //         color: 'black',
    //         textOutline: 'none',
    //         fontWeight: 'normal'
    //       }
    //     }
    //   }
    // },
    
    plotOptions: {
      series: {
        dataLabels: {
          enabled: false,
          format: '{point.name}',
        },
      },
      bubble: {
        maxSize: '20',
      },
    },
    
    series: series,
    
    // responsive: {
    //   rules: [{
    //     condition: {
    //       maxWidth: 600
    //     },
    //     chartOptions: {
    //       series: [{
    //         dataLabels: {
    //           distance: -30
    //         }
    //       }]
    //     }
    //   }]
    // }
  });
}

main().catch(console.error)

// --- Hoistings Utils Functions --- //

function lerp(start, end, amt) {
  return (1 - amt) * start + amt * end
}

function genPointsOnHemicycle(x, y, radius, amounts) {
  return Array.from({length: amounts}, (_, i) => {
    const angle = i * (Math.PI / (amounts - 1)) + Math.PI;
    return {
      x: x + Math.cos(angle) * radius,
      y: y + Math.sin(angle) * radius
    };
  });
}
