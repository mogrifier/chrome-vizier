/**
 * Get content from a URL using AJAX. Return data as JSON.
 */



var DATAREADER = {
		
//url to parse http://services.swpc.noaa.gov/text/goes-magnetospheric-particle-flux-ts3-secondary.txt
goodLines : [],
//very specific parser initially		
parseDataFromGoes: function(url, callback) {
	//download data from url
	var xhr = new XMLHttpRequest();
	xhr.open('GET', url);
	
	//parse data after GET returns (this is asynchronous)
	xhr.onload = function(e) {
		
		var data = this.response;
		//need to read a line at a time. this makes a line per array entry
		var allTextLines = data.split(/\r\n|\n/);
		//var goodLines = [];
		var line;
		
		while (allTextLines.length > 0)
		{
			line = allTextLines.shift();
			if (!line.startsWith('#') && !line.startsWith(':') )
				{
					//keep the good data line but as an array of values split on whitespace
					//skip first 5 values (date stuff)
					temp = line.split(/[ ]+/).slice(6);
					//also found -1.00e+05 is a bad value indicating sensor problem so skip row				
					if (temp[0] != '-1.00e+05' && temp.length > 0)
					{
						DATAREADER.goodLines.push(temp);		
					}	
				}
		}
		
		//execute callback to return data
		callback(DATAREADER.goodLines);
	}
	
	//execute the GET request
	xhr.send();
}
		
		
		
		
}