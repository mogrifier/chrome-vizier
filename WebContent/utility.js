/**
 * Utility functions
 */

var UTILITY = {
		
	lastValue: 0,
		
	makeNumber: function(value)
	{
		//make value a number for sure
		
		if (isNaN(value) || value ===undefined)
		{
			return UTILITY.lastValue;
		}
		else
		{
			UTILITY.lastValue = value;
		}

		return Number(Math.abs(value));
	},
		
		//map a value from one range to another
	rangemap:	function (value, r1, r2, newr1, newr2)
		{
			//allows function to process numbers in scientific notation format
			value = Number(value);
			percent = (value - r1)/(r2 - r1);
			//return values with no more than 2 decimal places
			
			newValue = (percent * (newr2 - newr1) + newr1).toFixed(0);		
			
			//do max/min range checks. having problems when not doing this.
			if (newValue > newr2)
			{
				newValue = newr2;
			}
			
			if (newValue < newr1)
			{
				newValue = newr1;
			}
			
			if (isNaN(newValue))
				{
					newValue = newr1;
				}
			
			return newValue;		
		}
		
}
