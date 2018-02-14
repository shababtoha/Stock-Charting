var express= require('express');
var app = express();
var mongo = require('mongodb').MongoClient;
var dotenv = require('dotenv');
var mongourl =  'mongodb://shabab:shabab@ds155577.mlab.com:55577/toogle';

var goo = require('google-finance');
var socket = require('socket.io');


var bodyParser = require('body-parser');
app.use(bodyParser.urlencoded({ extended: false }));
dotenv.config({verbose:true});
var port = process.env.PORT || 8080;
var server = app.listen(port, function(){
	console.log('Port is listening');
});

app.use(express.static('Views'));

function getcurrentdate()
{
	var today = new Date();
	var date = today.getDate();
	if(date < 10) date = '0'+date;
	var month = today.getMonth()+1;
	if(month < 10 ) month= '0'+month;
	var year = today.getFullYear();
	var x = year+'-'+month+'-'+date;
	return x;
}


app.post('/addstock', function(req, res){
	var stock = req.body.data;
	if(!stock){
		res.send("MARA KHAO");
		return;
	}
	else {
		goo.historical({ symbol: stock, from: '2017-01-01', to:getcurrentdate() }, function (err, quotes) {
			if (err)	res.send({error : err});
			if (quotes.length==0){
				res.send('invalid');
			}
			else {
				var stocks = [];
				for (var i=0; i<quotes.length; i++){
					var date = new Date(quotes[i].date);
					date = date.getTime();
					stocks.push([ date, quotes[i].high ]);
				}
				res.send("ok");;
				io.sockets.emit('change', { 'stock':stock, 'status' : 'added','data' : stocks  });

				mongo.connect(mongourl,function(err,db){
					var collection = db.collection('stock');
					collection.update( {'symbol' : stock},{'symbol' : stock},{upsert : true},function(err,documents){

					});
				});
			}
		});	
	}
});

app.post('/getall',function(req,res){
	mongo.connect(mongourl,function(err,db){
		var collection = db.collection('stock');
			collection.find( {},{_id : false}).toArray(function(err,documents){
				var len = documents.length;
				if(len == 0) res.send([]);
				var data = [];; 
				for(var i = 0 ; i<documents.length;i++){
					goo.historical( { symbol: documents[i].symbol, from: '2017-01-01', to:getcurrentdate() }, function (err, quotes) {
						var stocks = [];
						//console.log(quotes);
						for (var i=0; i<quotes.length; i++){
							var date = new Date(quotes[i].date);
							date = date.getTime();
							stocks.push([ date, quotes[i].high ]);
						}
						data.push( { name : quotes[0].symbol ,  data :stocks });
						if(data.length == len){
							res.send(data);
						}
					});
				}
			})
	});
})



app.post('/removestock',function(req,res){
	var name =  req.body.name;
	if(!name){
		res.send("Mara Kao");
		return;
	}

	io.sockets.emit('change', { 'stock':name, 'status' : 'removed'  });
	res.send("OK");

	mongo.connect(mongourl,function(err,db){
			var collection = db.collection('stock');
			collection.remove( {'symbol' : name},function(err,documents){
		});
	});
});


app.get('/',function(req,res){
	res.sendFile(process.cwd()+'/Views/index.html');
});

var io = socket(server);
io.on('connection', function(socket){
	console.log('made socket connection with '+socket.id);
});