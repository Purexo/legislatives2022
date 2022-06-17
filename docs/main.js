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
    ORDER BY n_maj.rowid, c_maj.sieges DESC, cc.majoritaire_proportion_duel DESC
    -- du plus à gauche au plus à droite, puis du plus victorieux au moins victorieux
  `;
  
  const circonscriptions = []
  DB.each(CIRCONSCRIPTION_RESULTS, {}, circonscription => {
    circonscription.color = JSON.parse(circonscription.color);
    circonscriptions.push(circonscription);
  });
  genCoordinatesOnHemidiscInPlace(circonscriptions);
  console.log(circonscriptions);
  
  const series = [];
  let current_serie = null
  let current_serie_identifier = null;
  let current_serie_data = null;
  
  for (const circonscription of circonscriptions) {
    circonscription.z = 1;
    if (circonscription.c_maj_sieges > 0) {
      circonscription.className = 'highcharts-siege-obtenu'
    }
  
    if (circonscription.split_key_series !== current_serie_identifier) {
      current_serie && series.push(current_serie);
    
      current_serie_identifier = circonscription.split_key_series;
      current_serie = {
        name: circonscription.n_maj_label,
        color: circonscription.n_maj_color,
        data: [],
      };
      current_serie_data = current_serie.data;
    }
  
    current_serie_data.push(circonscription);
  }
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
      headerFormat: '<p>',
      pointFormat: `
        <b>{point.name} :</b> <br/>
        {point.n_maj_code} <b>{point.c_maj_name}</b> - {point.c_maj_pourcentage_exprimes} <br/>
        Contre
        {point.n_min_code} <b>{point.c_min_name}</b> - {point.c_min_pourcentage_exprimes} <br/>
      `,
      footerFormat: '</p>',
      followPointer: true,
    },
    
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
  });
}

main().catch(console.error)

// --- Hoistings Utils Functions --- //

function easeOutQuart(x) {
  return 1 - Math.pow(1 - x, 4);
}

function genCoordinatesOnHemidiscInPlace(array, options = {}) {
  const {
    ox = 0, oy = 0,
    tip_angle = Math.PI / 8,
    radius_amount = 15,
    radius_start = 10,
    radius_offset = 10,
  } = options;
  
  const range_angle = Math.PI + tip_angle * 2
  
  const radiusses = Array(radius_amount);
  { // [ 8, 12, 16, 22, 30, 42, 59, 85, 121, 173 ] for 577 input
    let to_dispatch_on_radiusses = array.length;
    for (let idx = radius_amount - 1; idx >= 0; idx--) {
      const rangee = Math.ceil(
        to_dispatch_on_radiusses / radius_amount * 3
        * (1 + 1 - easeOutQuart((idx + 1) / radius_amount))
      );
      to_dispatch_on_radiusses -= rangee;
      radiusses[idx] = rangee;
    }
    radiusses[Math.ceil(radiusses.length / 2)] += to_dispatch_on_radiusses
  }

  const parts = radiusses.map(amount => range_angle / amount)
  const tracks = Array(parts.length).fill(0);
  
  const start_angle = Math.PI + tip_angle;
  let angle = start_angle;
  let index = 0;
  let points_on_angle = parts.map((_, idx) => idx);
  
  loop: while (true) {
    // consume radius_index from points_on_angle
    for (const radius_index of points_on_angle) {
      const point = array[index];
      
      const radius = radius_start + radius_offset * radius_index;
      const x = ox + radius * Math.cos(angle);
      const y = oy + radius * Math.sin(angle);
      
      Object.assign(point, {x, y});
  
      // increment and stop iteration if all points have coordinates
      index++;
      if (index >= array.length) break loop;
    }
    
    // track angles for comparaison
    // find next angle - start at minimum possible angle
    angle = -tip_angle;
    for (const [index, spacing_angle] of parts.entries()) {
      const next_angle = start_angle - spacing_angle * tracks[index];
      
      if (next_angle < angle) continue;
      
      angle = next_angle;
    }
    
    // find all points corresponding to angle and store for next iteration
    points_on_angle = [];
    for (const [index, spacing_angle] of parts.entries()) {
      const next_angle = start_angle - spacing_angle * tracks[index];
    
      if (next_angle !== angle) continue;
  
      points_on_angle.push(index);
      // track angles for comparaison
      tracks[index]++;
    }
    
    // debugger
  }
}
