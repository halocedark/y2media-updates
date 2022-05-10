const {app, BrowserWindow, ipcMain, dialog } = require('electron');
const ejse = require('ejs-electron');
const path = require('path');
const isDev = require('electron-is-dev');
const {autoUpdater} = require('electron-updater');
const {PowerShell} = require('node-powershell');
const IniFile = require(__dirname+'/assets/js/utils/IniFile.js');
const ROOTPATH = require('electron-root-path');
const fs = require('fs');
const OS = require('os');

let win;
let loadingScreen;
let devtools;

// Setup ini settings
function setupDefaultIniSettings()
{
	if ( fs.existsSync(ROOTPATH.rootPath+'/settings.ini') )
		return;
		
	if ( !fs.existsSync(OS.userInfo().homedir+'/Downloads/Y2Media/') )
	{
		fs.mkdirSync(OS.userInfo().homedir+'/Downloads/Y2Media/');
	}
		
	var fini = new IniFile(ROOTPATH.rootPath+'/');
	// Download_Settings
	var settings = {
		DOWNLOADS_PATH: OS.userInfo().homedir+'/Downloads/Y2Media/',
		SOUND_AFTER_DOWNLOAD_FINISH: true,
		DISPLAY_DOWNLOAD_COMPLETE_DIALOG: true
	};
	fini.writeSync('settings', settings, 'Download_Settings');
	// UI_Settings
	settings = {
		DISPLAY_LANG: 'en'
	};
	fini.writeSync('settings', settings, 'UI_Settings');
}
// Read ini file
function loadIniSettings()
{
	var ini = new IniFile(ROOTPATH.rootPath+'/');
	return ini.readSync('settings');
}
// Load language
function loadLang()
{
	// Create default values in settings.ini
	setupDefaultIniSettings();
	//
	var settings = loadIniSettings();
	if ( settings )
	{
		if ( settings.UI_Settings == null )
			return;

		var lang = settings.UI_Settings.DISPLAY_LANG;
		var Translation = require(__dirname+'/src/langs/'+lang);

		var trans = new Translation();
		var UI_DISPLAY_LANG = trans.get();
		UI_DISPLAY_LANG['lang'] = lang;
		// Set Lang variable object
		ejse.data('UI_DISPLAY_LANG', trans.get());
		// Save lang data in external file
		// Create dir if not exists
		var langDir = ROOTPATH.rootPath+'/langs/';
		if ( !fs.existsSync(langDir) )
			fs.mkdirSync(langDir, { recursive: true });

		// Create file
		fs.writeFileSync(langDir+'display-lang.json', JSON.stringify(UI_DISPLAY_LANG));
	}
}
// Main Window
function CreateWindow()
{
	// Create Browser Window
	var winOptions = 
	{
		width: 1200,
		height: 800,
		icon: __dirname+'/assets/ico/main.png',
		webPreferences: { 
			nodeIntegration: true, 
			contextIsolation: false
		},
		show: false
	};
	win = new BrowserWindow(winOptions);
	// Load index.html
	win.loadFile('index.ejs');
	// Open dev tools
	//win.webContents.openDevTools();
	devtools = new BrowserWindow();
	win.webContents.setDevToolsWebContents(devtools.webContents);
    win.webContents.openDevTools({ mode: 'detach' });
	// Set Win to null
	win.on('closed', () =>
	{
		win = null;
	});
	// Delete Default Context menu
	win.setMenu(null);
	return win;
}
// Loading Screen
function CreateLoadingScreen()
{
	// Create Browser Window
	var winOptions = 
	{
		width: 700,
		height: 500,
		icon: __dirname+'/src/assets/ico/main.png',
		webPreferences: { nodeIntegration: true, contextIsolation: false },
		show: true,
		resizable: false,
		frame: false
	};
	loadingScreen = new BrowserWindow(winOptions);
	// Load index.html
	loadingScreen.loadFile('loadingScreen.ejs');
	// Open dev tools
	//loadingScreen.webContents.openDevTools();
	// Set Win to null
	loadingScreen.on('closed', () =>
	{
		loadingScreen = null;
	});
	// Delete Default Context menu
	loadingScreen.setMenu(null);

	return loadingScreen;
}
// Setup auto updater
function setupAutoUpdater()
{
	var updatePromise = undefined;
	// Setup auto updater
	autoUpdater.on('checking-for-update', () =>
	{
		win.webContents.send('checking-for-update');
	});
	autoUpdater.on('update-available', (info) =>
	{
		win.webContents.send('update-available', info);
		win.webContents.send('update-about-to-download', updatePromise);
	});
	autoUpdater.on('update-not-available', (info) =>
	{
		win.webContents.send('update-not-available', info);
	});
	autoUpdater.on('update-downloaded', (info) =>
	{
		win.webContents.send('update-downloaded', info);
	});
	autoUpdater.on('download-progress', (progressInfo) =>
	{
		win.webContents.send('download-update-progress', progressInfo);
	});
	autoUpdater.on('error', (err) =>
	{
		win.webContents.send('update-error', err);
	});
	// Check for updates
	if ( !isDev )
	{
		updatePromise = autoUpdater.checkForUpdates();
	}
}
// Run CreateWindow func
app.whenReady().then(() =>
{
	//CreateLoadingScreen().show();
	// Load language before dom ready
	//loadLang();
	setupDefaultIniSettings();
	CreateWindow().webContents.on('dom-ready', () => // Also 'ready-to-show'
	{
		setTimeout( () => 
		{
			//if ( loadingScreen )
			//{
				//loadingScreen.destroy();
				win.show();
				// Setup auto updater
				setupAutoUpdater();
			//}
		}, 0 );
	});
});
// Quit when all windows closed
app.on('window-all-closed', () =>
{
	if ( process.platform !== 'darwin' )
	{
		app.quit();
	}
});
//
ipcMain.on('show-select-dir-dialog', (e, arg) =>
{
	var options = {
		properties: ['openDirectory']
	};
	dir = dialog.showOpenDialog(win, options);
	dir.then(path =>
	{
		e.sender.send('dialog-dir-selected', path);
	});
});
ipcMain.on('quit-and-install-update', (e, arg) =>
{
	autoUpdater.quitAndInstall();
});
