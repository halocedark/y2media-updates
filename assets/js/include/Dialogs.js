
let SelectDirDialog;
let DownloadDialog;

$(function()
{

// Download Dialog
DownloadDialog = (options) =>
{
	var dialogContainer = $('#downloadDialogContainer');
	var closeBTN = dialogContainer.find('#closeBTN');
	var minimizeBTN = dialogContainer.find('#minimizeBTN');
	var dialogBody = dialogContainer.find('#dialogBody');

	var downloadDialogMinimized = $('#downloadDialogMinimized');

	minimize();
	// add download
	dialogBody.append(options.html);
	// close
	closeBTN.off('click');
	closeBTN.on('click', e =>
	{
		hide();
	});
	// minimize
	minimizeBTN.off('click');
	minimizeBTN.on('click', e =>
	{
		minimize();
	});
	// maximize
	downloadDialogMinimized.off('click');
	downloadDialogMinimized.on('click', e =>
	{
		restore();
	});
	// show
	function show()
	{
		dialogContainer.addClass('active');
	}
	// hide
	function hide()
	{
		dialogContainer.removeClass('active');
		downloadDialogMinimized.removeClass('active');
	}
	// minimize
	function minimize()
	{
		dialogContainer.removeClass('active');
		downloadDialogMinimized.addClass('active');
	}
	// restore
	function restore()
	{
		dialogContainer.addClass('active');
		downloadDialogMinimized.removeClass('active');
	}
}
// Select directory dialog
SelectDirDialog = () =>
{
	return new Promise((resolve, reject) =>
	{
		ipcIndexRenderer.send('show-select-dir-dialog');
		ipcIndexRenderer.removeAllListeners('dialog-dir-selected');
		ipcIndexRenderer.on('dialog-dir-selected', (e, arg) =>
		{
			if ( arg.canceled )
			{
				reject(arg);
				return;
			}
			resolve(arg);
		});
	});
}


});
