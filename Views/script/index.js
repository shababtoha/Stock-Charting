var alldata = [];
var chart ;
$(document).ready(function(){
	$("input").hide();
	$.ajax({
		type : 'POST',
		url : '/getall',
		data : { 'data' : 'GOOGL'},
		success : function(data){
			alldata = data;
			for(var i = 0 ; i< data.length;i++){
				$(".stocks").append(make_div(data[i].name));
			}
			//console.log(alldata);
			//createChart();
			$("input").show();
			$("#load").remove();
			$("body").css({ 'background-color': '#EFECE8' });
			highchart.series = alldata;
			chart = new Highcharts.Chart(highchart);
			chart.redraw();
		} 
	});
	//createChart(); 
});

var socket = io.connect('/');

socket.on('change', function(data){
    if(data.status=='added'){
    	console.log(data.data);
    	alldata.push( {name : data.stock, 'data' : data.data} )
    	$(".stocks").append(make_div(data.stock));
    	console.log(alldata);
    }
    else if(data.status=='removed'){
    	var name = data.stock;
    	for(var i = 0 ; i<alldata.length;i++){
			if(alldata[i].name===name){
				alldata.splice(i,1);
				break;
			}
		}
		$("#"+name).remove();
    }
   	highchart.series = alldata;
	chart = new Highcharts.Chart(highchart);
	chart.redraw();
});



function search(val){
	if(event.key==='Enter'){
		var stock = $("#search").val();
		$("#search").val('');	
		stock = stock.toUpperCase();	
		if(check(stock)) return;
		$.ajax({
			type : 'POST',
			url : '/addstock',
			data : { 'data' : stock},
			success : function(data){
				console.log(data);
				if(data !== 'ok'){
					$.toast({
    					heading: 'Error',
    					text: 'Stock Symbol Is Invalid',
    					showHideTransition: 'fade',
    					icon: 'error',
    					position: 'bottom-right',
					});
					return;
				}
			} 
		})
	}
}


 var highchart =  {
   		chart: {
        	renderTo: 'container',
    	},
        rangeSelector: {
            selected: 4
        },
        title: {
            text: 'Stock Chart',
            style: { "color": "blue", "fontSize": "3em", "fontWeight": "bold", "fontFamily": "cursive" }
        },
        subtitle: {
        	text: 'Graph of Historical Prices of stocks'
        },
        yAxis: {
            labels: {
                formatter: function () {
                    return (this.value > 0 ? ' + ' : '') + this.value + '%';
                }
            },
            plotLines: [{
                value: 0,
                width: 2,
                color: 'silver'
            }]
        },
        plotOptions: {
            series: {
                compare: 'percent',
                showInNavigator: true
            }
        },
        tooltip: {
            pointFormat: '<span style="color:{series.color}">{series.name}</span>: <b>{point.y}</b> ({point.change}%)<br/>',
            valueDecimals: 2,
            split: false
        },
        series: alldata
    }


function make_div(name){
	return '<div class="stock" id="'+name+'">\
			<p>'+name+'</p>\
			<i class="fa fa-times fa-2x" onclick=\'remove("'+name+'")\'></i>\
	</div>';
}
function remove(name){
	//console.log(name);
	/*for(var i = 0 ; i<alldata.length;i++){
		if(alldata[i].name===name){
			alldata.splice(i,1);
			break;
		}
	}
	$("#"+name).remove();
	createChart();*/
	$.ajax({
		type : 'POST',
		url : '/removestock',
		data : { 'name' : name },
		success : function(data){

		}
	})

}
function check(name){
	for(var i = 0 ; i<alldata.length;i++){
		if(alldata[i].name===name){
			$.toast({
    			heading: 'Warning',
    			text: 'Symbol Already Exist',
    			showHideTransition: 'plain',
    			icon: 'warning',
    			position: 'bottom-right'
			})
			return true;
		}
	}
	return false;
}