const fs = require('fs');
const ini = require('ini');

let IniFile;

IniFile = function(path = '')
{

	this.INI_PATH = path;

	this.write = (filename, data, section = '') =>
	{
		return new Promise( (resolve, reject) =>
		{
			var oldObject = this.readSync(filename);
			var newData = data;
			if ( oldObject )
			{
				oldObject[section] = data;
				newData = oldObject;
				section = '';
			}

			fs.writeFile(this.INI_PATH+filename+'.ini', ini.stringify(newData, section), (error) =>
			{
				if ( error ) 
				{
					reject(error);
					return;
				}
				resolve(true);
			});
		});
	}

	this.writeSync = (filename, data, section = '') =>
	{
		var oldObject = this.readSync(filename);
		var newData = data;
		if ( oldObject )
		{
			oldObject[section] = data;
			newData = oldObject;
			section = '';
		}

		fs.writeFileSync(this.INI_PATH+filename+'.ini', ini.stringify(newData, section));
	}

	this.read = (filename) =>
	{
		return new Promise((resolve, reject) =>
		{
			if ( !fs.existsSync(this.INI_PATH+filename+'.ini') )
			{
				reject('Error, no such file or directory');
				return;
			}
			fs.readFile(this.INI_PATH+filename+'.ini', 'utf-8', (err, data) =>
			{
				if ( err )
				{
					reject(err);
					return;
				}
				var parsedData = ini.parse(data);
				resolve(parsedData);
			});
		});
	}

	this.readSync = (filename) =>
	{
		if ( !fs.existsSync(this.INI_PATH+filename+'.ini') )
			return false;

		return ini.parse( fs.readFileSync(this.INI_PATH+filename+'.ini', 'utf-8') );
	}
}

module.exports = IniFile;