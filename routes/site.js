module.exports = function(app, stops, shapes, trips) {

	app.get('/', function(req, res) {
		res.redirect("/map");
	});
	app.get('/map', function(req, res) {
		res.render('container/map', { locals: { pageTitle: "LiveMap", type: "map"}});
	});
	app.get('/about', function(req, res) {
		res.render('container/about', { locals: { pageTitle: "About", type: "about"}});
	});
	app.get('/data/stops', function(req, res){
    res.header('Access-Control-Allow-Origin', '*');
		res.json(stops);
	});
	app.get('/data/shapes', function(req, res){
    res.header('Access-Control-Allow-Origin', '*');
		res.json(shapes);
	});
	app.get('/data/trips', function(req, res){
    res.header('Access-Control-Allow-Origin', '*');
		res.json(trips);
	});
};
