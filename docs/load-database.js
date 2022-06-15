async function loadDatabase() {
  const sqlPromise = initSqlJs({locateFile: file => `./${file}`});
  const dataPromise = fetch("./resultats-legislatives-premier-tour.sqlite3").then(res => res.arrayBuffer());

  const [SQL, buf] = await Promise.all([sqlPromise, dataPromise]);

  return new SQL.Database(new Uint8Array(buf));
}
