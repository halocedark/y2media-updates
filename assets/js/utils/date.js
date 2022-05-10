
TheDate = function()
{

	this.now = () =>
	{
		let date_ob = new Date();
		var day = ("0" + date_ob.getDate()).slice(-2);
		var month = ("0" + (date_ob.getMonth() + 1)).slice(-2);
		var year = date_ob.getFullYear();

		return year+'-'+month+'-'+day;
	}

}

module.exports = TheDate;