const ROOTPATH = require('electron-root-path');
const childProcess = require('child_process');
const {PowerShell} = require('node-powershell');
const OS = require('os');
const path = require('path');
const uuid = require('uuid');
const ipcIndexRenderer = require('electron').ipcRenderer;
window.$ = window.jQuery = require('jquery');
const fs = require('fs');
const fse = require('fs-extra');
const ytdl = require('ytdl-core');

var APP_NAME = 'Y2Media';
var APP_ICON = 'assets/img/logo/logo.png';
var APP_ROOT_PATH = ROOTPATH.rootPath+'/';
var APP_DIR_NAME = __dirname+'/';

const SETTINGS_FILE = 'settings';
const DISPLAY_LANG_FILE = APP_ROOT_PATH+'langs/display-lang.json';
var UI_DISPLAY_LANG = {};
var DEFAULT_INI_SETTINGS = {};

var MAIN_CONTENT_CONTAINER = null;

let loadIniSettings;
let setupAPISettings;
let loadIniSettingsSync;
let getFileInfoFromUrl;
let forceMakeDirSync;
let randomRange;
let getPage;
let extractFileExtension;
let formatSampleRate;
let formatTransferBytes;
let formatBytesToStr;
let formatBytes;
let formatNumberToStr;
let formatTimeRemaining;
let copyLinkToClipboard;
let uniqid;
let loadDisplayLanguage;
let getDisplayLanguage;
let testServerConnection;
let setUIDisplayLang;
let downloadFile;
let initLists;
let getYoutubeVideoLinks;

$(function()
{

MAIN_CONTENT_CONTAINER = $('#MainContentContainer');

// get Youtube Video Links
getYoutubeVideoLinks = async (url) =>
{
	return await ytdl.getInfo(url);
}
// init lists
initLists = () =>
{
	// list 01
	var LIST_01 = $('[data-role="LIST_01"]');
	LIST_01.off('click');
	LIST_01.on('click',e =>
	{
		var target = $(e.target);
		if ( target[0].nodeName == 'LI' )
		{
			target.siblings().removeClass('active');
			$(target.siblings().data('tab')).fadeOut(0);
			target.addClass('active');
			$(target.data('tab')).fadeIn(200);
		}
	});
	// list 02
	var LIST_02 = $('[data-role="LIST_02"]');
	LIST_02.off('click');
	LIST_02.on('click',e =>
	{
		var target = $(e.target);
		if ( target[0].nodeName == 'LI' )
		{
			target.siblings().removeClass('active');
			$(target.siblings().data('tab')).fadeOut(0);
			target.addClass('active');
			$(target.data('tab')).fadeIn(200);
		}
	});
}
// Send Get Request
sendGetRequest = (url, CALLBACK) =>
{
	$.ajax({
		url: url,
		type: 'GET',
		success: function(response)
		{
			CALLBACK(response);
		},
		error: function( jqXHR, textStatus, errorThrown)
		{
			if ( textStatus == 'error' )
			{
				
			}
		}
	});
}
// download file
downloadFile = (url, savepath, progressInfo) =>
{
	var DOWNLOAD_START_TIME = undefined;
	return new Promise((resolve, reject) =>
	{
		$.ajax({
			xhr: function() 
			{
			  var xhr = new XMLHttpRequest();
				xhr.responseType = 'blob';
				xhr.addEventListener('progress', (e) =>
				{
				    if (e.lengthComputable) 
			        {
			            var percentComplete = (e.loaded / e.total) * 100;
			            // Time Remaining
			            var seconds_elapsed = ( new Date().getTime() - DOWNLOAD_START_TIME ) / 1000;
			            bytes_per_second = e.loaded / seconds_elapsed;
			            //var bytes_per_second = seconds_elapsed ? e.loaded / seconds_elapsed : 0 ;
			            var timeleft = (new Date).getTime() - DOWNLOAD_START_TIME;
			            timeleft = e.total - e.loaded;
			            timeleft = timeleft / bytes_per_second;
			            // Upload speed
			            var Kbytes_per_second = bytes_per_second / 1024 ;
			            var transferSpeed = Math.floor(Kbytes_per_second);
			            progressInfo({e: e, timeleft: timeleft.toFixed(0), transferSpeed: transferSpeed, percent: percentComplete});
			        }
				}, false);
			   return xhr;
			},
			type: 'GET',
			url: url,
			data: {},
			beforeSend: function(e)
			{
				// Set start time
				DOWNLOAD_START_TIME = new Date().getTime();
			},
			success: function(response)
			{
				var reader = new FileReader();
				reader.readAsArrayBuffer( response );
				reader.onload = () =>
			    {
			    	var buffer = new Buffer( reader.result );
			    	fs.writeFile( savepath, buffer, (err) => 
			    	{
			    		if ( err )
			    		{
			    			reject(err);
			    			return;
			    		}

			    		resolve(response);
			    	});
			    };
			}
		});
	});
}
// set ui display lang
setUIDisplayLang = (lang) =>
{
	var fini = new IniFile(APP_ROOT_PATH);

	var UI_Settings = {
		DISPLAY_LANG: lang
	};

	return fini.write(SETTINGS_FILE, UI_Settings, 'UI_Settings');
}
// Test server connection
testServerConnection = () =>
{
	url = 'https://www.youtube.com/';
	data = {};
	return new Promise((resolve, reject) =>
	{
		$.ajax({
			url: url,
			type: 'POST',
			data: data,
			success: function(response)
			{
				if ( response.code == 404 )
				{
					reject(response);
					return;
				}
				resolve(response);
			},
			error: function( jqXHR, textStatus, errorThrown)
			{
				if ( textStatus == 'error' )
				{
					reject(errorThrown);
				}
			}
		});
	});
}
// Get display language
getDisplayLanguage = () =>
{
	return UI_DISPLAY_LANG;
}
// Load display language
loadDisplayLanguage = () =>
{
	var data = '';
	if ( fs.existsSync(DISPLAY_LANG_FILE) )
	{
		data = fs.readFileSync(DISPLAY_LANG_FILE);
		UI_DISPLAY_LANG = JSON.parse(data);
	}
}
// Load ini settings
loadIniSettings = (CALLBACK) =>
{
	var fini = new IniFile(APP_ROOT_PATH);
	fini.read(SETTINGS_FILE).then(data =>
	{
		CALLBACK(data);
	});
}
// Load ini settings sync
loadIniSettingsSync = () =>
{
	var fini = new IniFile(APP_ROOT_PATH);
	return fini.readSync(SETTINGS_FILE);
}
// make dir
makeDirSync = (dir) =>
{
	if ( !fs.existsSync(dir) )
		fs.mkdirSync(dir, { recursive: true });
}
// Force make dir
forceMakeDirSync = (dir) =>
{
	fs.mkdirSync(dir, { recursive: true });
}
// Get file info from url
getFileInfoFromUrl = (url) =>
{
	return new Promise((resolve, reject) =>
	{
		var xhr = new XMLHttpRequest;
		xhr.open('GET', url);
		xhr.send();
		xhr.addEventListener('progress', (e) =>
		{
			if ( e.lengthComputable )
			{
				xhr.abort();
				resolve(e);
				return;
			}
			else
			{
				reject(e);
			}
		});
		//
	});
}
// Random range
randomRange = (min, max) => 
{ 
  return Math.floor(Math.random() * (max - min + 1) + min)
}
// Get page
getPage = (page) =>
{
	var promise = new Promise((resolve, reject) =>
	{
		sendGetRequest(page, response =>
		{
			if ( response.length == 0 )
			{
				reject('Error empty response');
				return;
			}
			resolve(response);
		});
	});

	return promise;
}
// Unique id
uniqid = () =>
{
	return uuid.v4();
}
// Copy To Clipboard
copyLinkToClipboard = (element, val) =>
{
	var inputHTML = '<input type="text" id="copyToClipboardHiddenInput" style="display: none;">';
	var input = $(inputHTML).insertAfter(element);
	input = $('#copyToClipboardHiddenInput');
	input.val(val);
	input.focus();
	input.select();
	input[0].setSelectionRange(0, 99999);
	navigator.clipboard.writeText( input.val() );
	input.remove();
}
// Extract file extension
extractFileExtension = (filename) =>
{
	return path.extname(filename).replace('.', '');
}
// Format Transfer speed
formatTransferBytes = (kbps) =>
{
	if ( kbps > 1024 )
	{
		kbps = (kbps / 1024).toFixed(2)+' MB/s';
	}
	else if ( kbps < 1024 )
	{
		kbps = kbps+' KB/s';
	}
	else
	{
		if ( UI_DISPLAY_LANG.lang == 'en' )
			kbps = 'calculating...';
		else
			kbps = 'calculateur...';
	}

	return kbps;
}
// Format Sample rate
formatSampleRate = (bytes) =>
{
	if ( bytes >= 1073741824 )
	{
		bytes = (bytes / 1073741824).toFixed(2)+'gbps';
	}
	else if ( bytes >= 1048576 )
	{
		bytes = (bytes / 1048576).toFixed(2)+'mbps';
	}
	else if ( bytes >= 1024 )
	{
		bytes = (bytes / 1024).toFixed(2)+'kbps';
	}
	else if ( bytes > 1 )
	{
		bytes = bytes+' bps';
	}
	else
	{
		bytes = '0 b/s';
	}

	return bytes;
}
//format Number To Str
formatNumberToStr = (num) =>
{
	if ( num == 1000000 )
	{
		num = (num / 1000000).toFixed(0)+'m';
	}
	else if ( num > 1000000 )
	{
		num = (num / 1000000).toFixed(2)+'m';
	}
	else if ( num == 1000 )
	{
		num = (num / 1000).toFixed(0)+'k';
	}
	else if ( num > 1000 )
	{
		num = (num / 1000).toFixed(2)+'k';
	}

	return num;
}
// Format bytes
formatBytesToStr = (bytes) =>
{
	if ( bytes >= 1073741824 )
	{
		bytes = (bytes / 1073741824).toFixed(2)+' GB';
	}
	else if ( bytes >= 1048576 )
	{
		bytes = (bytes / 1048576).toFixed(2)+' MB';
	}
	else if ( bytes >= 1024 )
	{
		bytes = (bytes / 1024).toFixed(2)+' KB';
	}
	else if ( bytes > 1 )
	{
		bytes = bytes+' byte';
	}
	else
	{
		bytes = '0 bytes';
	}

	return bytes;
}
// Format bytes
formatBytes = (bytes) =>
{
	var unitObject = {
		bytes: 0,
		unit: ''
	};
	if ( bytes >= 1073741824 )
	{
		bytes = (bytes / 1073741824).toFixed(2);
		unitObject.bytes = bytes;
		unitObject.unit = 'GB';
	}
	else if ( bytes >= 1048576 )
	{
		bytes = (bytes / 1048576).toFixed(2);
		unitObject.bytes = bytes;
		unitObject.unit = 'MB';
	}
	else if ( bytes >= 1024 )
	{
		bytes = (bytes / 1024).toFixed(2);
		unitObject.bytes = bytes;
		unitObject.unit = 'byte';
	}
	else if ( bytes > 1 )
	{
		bytes = bytes;
		unitObject.bytes = bytes;
		unitObject.unit = '';
	}
	else
	{
		bytes;
		unitObject.bytes = bytes;
		unitObject.unit = 'byte';
	}

	return unitObject;
}
// Format time remaining
formatTimeRemaining = (time) =>
{
	var timeleft = '';

	if ( time >= 3600 )
		timeleft = (time / 3600).toFixed(0)+' hours '+(time % 3600)+' mins';
	else if ( time > 60 )
		timeleft = (time / 60).toFixed(0)+' mins '+(time % 60)+' secs';
	else if ( time < 60 )
		timeleft = time+' secs';
	else
		'calculating...';

	return timeleft;
}
// Call globally
DEFAULT_INI_SETTINGS = loadIniSettingsSync();


});