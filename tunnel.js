var http = require('http')
  , express = require('express')
  , app = express()
  , server = http.createServer(app)
  , io = require('socket.io')(server)


/*the maximum depth in deviation data*/
const maxDepth=6;

/*deviation data (prototypes), given relative to start points. Y direction is reversed in SVG, so to draw them properly, we need to invert them (i.e. a dev of -6, meaning 6 south, should become + 6 to display properly.*/
var deviations_1_p = [{depth:1, devX:-1, devY:0}, {depth:2, devX:-1, devY:1}, {depth:3, devX:-2, devY:0}, {depth:4, devX:-1, devY:1}, {depth:5, devX:1, devY:-1}, {depth:6, devX:-1, devY:0}];
var deviations_2_p = [{depth:1, devX:-1, devY:1}, {depth:2, devX:-2, devY:2}, {depth:3, devX:-3, devY:3}, {depth:4, devX:-4, devY:4}, {depth:5, devX:-5, devY:5}, {depth:6, devX:-6, devY:6}];
var deviations_3_p = [{depth:1, devX:1, devY:0}, {depth:2, devX:3, devY:-2}, {depth:3, devX:5, devY:-3}, {depth:4, devX:7, devY:-4}, {depth:5, devX:9, devY:-6}, {depth:6, devX:10, devY:-7}];
var deviations_4_p = [{depth:1, devX:0, devY:-1}, {depth:2, devX:2, devY:-1}, {depth:3, devX:6, devY:-4}, {depth:4, devX:9, devY:-6}, {depth:5, devX:11, devY:-7}, {depth:6, devX:13, devY:-9}];
var deviations_5_p = [{depth:1, devX:0, devY:0}, {depth:2, devX:0, devY:-1}, {depth:3, devX:0, devY:0}, {depth:4, devX:1, devY:0}, {depth:5, devX:-1, devY:1}, {depth:6, devX:-1, devY:0}];

//flipping...
flipYDeviations(deviations_1_p);
flipYDeviations(deviations_2_p);
flipYDeviations(deviations_3_p);
flipYDeviations(deviations_4_p);
flipYDeviations(deviations_5_p);

//returns true if val appears to be invalid
function isEmpty(val)
{
	return (val === undefined || val == null || val.length <= 0) ? true : false;
}


/*flips a coordinate (Y) around canvas middle line (0,250->500,250 for y=500, x=500 canvas) to handle svg Y axis reversal*/
function flipCoordinate(YtoFlip)
{
	var maxY = 500;//max Y coordinate
	var max2=maxY/2;
	var flippedY=YtoFlip;//copy here to remain the same for edge case (ytoflip=max2)
	if(YtoFlip>max2)
	{
		flippedY=YtoFlip - (2 * (YtoFlip-max2));
	}
	if(YtoFlip<max2)
	{
		flippedY=YtoFlip + (2 * (max2-YtoFlip));
	}

	return flippedY;
}
/*flips all Y coordinates in drills to handle svg Y axis reversal*/
function flipYCoordinates(drillsArray)
{
	if(isEmpty(drillsArray))
	{
		return;
	}

	var totDrills=drillsArray.length;

	//for all drills.. 
	for(var i=0; i<totDrills; i++)
	{//flip start points Y
		drillsArray[i].cy = flipCoordinate(drillsArray[i].cy);
	}
	
}
//to make sure deviations display properly, we need to flip Y values. This function gets a deviations array and flips all Y deviations.
function flipYDeviations(deviationsArray)
{
	if(isEmpty(deviationsArray))
	{
		return;
	}

	var totDevs=deviationsArray.length;

	//for all deviations... 
	for(var i=0; i<totDevs; i++)
	{
		deviationsArray[i].devY*=-1;// flip Y deviation
	}
	
}

/*deviation data (to be sent). Start empty, fill as needed using data from prototypes*/
var deviations_1 = [];
var deviations_2 = [];
var deviations_3 = [];
var deviations_4 = [];
var deviations_5 = [];

/*drill data. Includes deviations and initial point*/
var HDrill_1 = {cx:250, cy:250, deviations:deviations_1};
var HDrill_2 = {cx:150, cy:250, deviations:deviations_2};
var HDrill_3 = {cx:250, cy:150, deviations:deviations_3};
var HDrill_4 = {cx:350, cy:250, deviations:deviations_4};
var HDrill_5 = {cx:250, cy:350, deviations:deviations_5};

var drills = [HDrill_1, HDrill_2, HDrill_3, HDrill_4, HDrill_5];
//flip y coordinates in drill start points
flipYCoordinates(drills);

app.engine('jade', require('jade').__express) //__
app.set('view engine', 'jade')

app.get('/', function (req, res) {
  res.render('home', {maxsteps:maxDepth+1})

  io.emit("devs", drills);

/*set up static files in dir public*/
app.use(express.static(__dirname + '/public'))


})

io.on('connection', function (socket) {

  socket.on('devs', function (sel_depth) {
	//console.log('Got -' + sel_depth + '-');
	
	//re-set deviations to send
	deviations_1 = [];
	deviations_2 = [];
	deviations_3 = [];
	deviations_4 = [];
	deviations_5 = [];

	//if the slider is in the beginning (0), let the data go with empty deviations. Otherwise...
	if(sel_depth>0)
	  {	//if the slider is in the end (max position), send all deviations to display 
		if(sel_depth>maxDepth)
		{
			deviations_1=deviations_1_p;
			deviations_2=deviations_2_p;
			deviations_3=deviations_3_p;
			deviations_4=deviations_4_p;
			deviations_5=deviations_5_p;
		}
		//we are interested in deviations in specific depth, send only those
		else
		{	//go through all deviations
			for(var k=0; k<maxDepth; k++)
			{//and only include those at selected depth. Must check for all drills separately.
				if(deviations_1_p[k].depth==sel_depth)
				{
					deviations_1.push(deviations_1_p[k]);
				}
				if(deviations_2_p[k].depth==sel_depth)
				{
					deviations_2.push(deviations_2_p[k]);
				}
				if(deviations_3_p[k].depth==sel_depth)
				{
					deviations_3.push(deviations_3_p[k]);
				}
				if(deviations_4_p[k].depth==sel_depth)
				{
					deviations_4.push(deviations_4_p[k]);
				}
				if(deviations_5_p[k].depth==sel_depth)
				{
					deviations_5.push(deviations_5_p[k]);
				}
			}

		}
	  }
	//we've added all deviations we needed to add, now copy them back into the array
	 HDrill_1.deviations=deviations_1;
	 HDrill_2.deviations=deviations_2;
	 HDrill_3.deviations=deviations_3;
	 HDrill_4.deviations=deviations_4;
	 HDrill_5.deviations=deviations_5;

	 drills = [HDrill_1, HDrill_2, HDrill_3, HDrill_4, HDrill_5];


//	io.json.send("devs", drills);
//	console.log("We send" + drills[0].deviations.length )
	io.emit("devs", drills);

  })

})

server.listen(8080, function() {
  console.log('Listening on port 3000...')
})
