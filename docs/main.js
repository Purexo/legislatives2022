// du plus à gauche au moins à gauche, aussi précis puissent-être les regroupements divers
const CODE_NUANCES = [
  'DXG',
  'RDG',
  'NUP',
  'DVG',
  'ECO',
  'DIV',
  'DVC',
  'ENS',
  'REG',
  'DVD',
  'UDI',
  'LR',
  'DSV',
  'RN',
  'REC',
  'DXD',
];
// 0 <-> 1
// gauche <-> droite
const NUANCES_PRIORITY = new Map(
  CODE_NUANCES.map((code, index, array) => [code, lerp(0, array.length, index)])
);

const DB = await loadDatabase();
const stmt = DB.prepare(`
SELECT
  -- define x and y by radian angle and radius
  0 AS x,
  0 AS y,
  1 AS z, -- same size for each points
  c.label_circonscription AS name,
  -- used for compute colors
  cc.majoritaire_proportion_duel AS color_maj_proportion,
  -- TODO cte with color for nuances and join with n_maj and n_min
  -- AS color_maj
  -- AS color_min

  -- split info
  n_maj.code_nuance AS split_key_series,
  n_maj.code_nuance AS n_maj_nuance,
  n_min.code_nuance AS n_min_nuance,
  
  -- tooltips info
  c_maj.sieges AS c_maj_sieges,
  c_min.sieges AS c_min_sieges,
  c_maj.nom || ' ' || c_maj.prenom AS c_maj_name,
  c_min.nom || ' ' || c_min.prenom AS c_min_name,
  CAST(c_maj.voix AS REAL) / c.exprimes * 100 AS c_maj_pourcentage_exprimes,
  CAST(c_min.voix AS REAL) / c.exprimes * 100 AS c_min_pourcentage_exprimes,
  c_maj.voix AS c_maj_voix,
  c_min.voix AS c_min_voix,
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
`);


Highcharts.chart('container', {
  
  chart: {
    type: 'item'
  },
  
  title: {
    text: 'Highcharts item chart'
  },
  
  subtitle: {
    text: 'Parliament visualization'
  },
  
  legend: {
    labelFormat: '{name} <span style="opacity: 0.4">{y}</span>'
  },
  
  series: [{
    name: 'Representatives',
    keys: ['name', 'y', 'color', 'label'],
    data: [
      ['The Left', 69, '#BE3075', 'DIE LINKE'],
      ['Social Democratic Party', 153, '#EB001F', 'SPD'],
      ['Alliance 90/The Greens', 67, '#64A12D', 'GRÜNE'],
      ['Free Democratic Party', 80, '#FFED00', 'FDP'],
      ['Christian Democratic Union', 200, '#000000', 'CDU'],
      ['Christian Social Union in Bavaria', 46, '#008AC5', 'CSU'],
      ['Alternative for Germany', 94, '#009EE0', 'AfD']
    ],
    dataLabels: {
      enabled: true,
      format: '{point.label}'
    },
    
    // Circular options
    center: ['50%', '88%'],
    size: '170%',
    startAngle: -100,
    endAngle: 100
  }],
  
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

// --- Hoistings Utils Functions --- //

function lerp(start, end, amt){
  return (1-amt)*start+amt*end
}
