VideoDownloader = function(){};

$(function()
{

VideoDownloader = function(options)
{
	let request;
	var DOWNLOAD_ID = 'DOWNLOAD_'+uniqid();
	var html = `<div class="download" id="${DOWNLOAD_ID}">
					<div class="mb-1 text-right">
						<button class="btn-close" id="abortBTN"></button>
					</div>
					<div class="row gx-2 gy-2">
						<div class="col-lg-2 col-md-2 col-sm-12" style="width:11%;">
							<img src="${options.thumbnail}" class="img-02" alt="">
						</div>
						<div class="col-lg col-md col-sm-12">
							<p class="download-name">
								${options.title}
							</p>
						</div>
					</div>
					<div class="download-info mt-1">
						<span class="text-05" id="transferSpeed">N/A</span>
						<span class="text-05" id="timeRemaining">N/A</span>
						<span class="text-05" id="statusMessage">N/A</span>
					</div>
					<div class="progress mt-1">
						<div class="progress-bar progress-bar-striped" id="progressBar" role="progressbar" style="width: 0%;" aria-valuenow="25" aria-valuemin="0" aria-valuemax="100">0%</div>
					</div>
				</div>`;
	// add html to download dialog
	DownloadDialog({html: html});
	var DOWNLOAD_ELEMENT = $('#'+DOWNLOAD_ID);
	var FILENAME = DEFAULT_INI_SETTINGS.Download_Settings.DOWNLOADS_PATH+APP_NAME+'_'+options.title+'.'+options.container;
	// abort download
	DOWNLOAD_ELEMENT.find('#abortBTN').on('click', e =>
	{
		this.abort();
		DOWNLOAD_ELEMENT.remove();
	});
	// Download
	this.download = () =>
	{
		request = $.ajax({
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
		                // Update file html
						DOWNLOAD_ELEMENT.find('#statusMessage').text('Downloading...');
		                DOWNLOAD_ELEMENT.find('#transferSpeed').text( formatTransferBytes(transferSpeed) );
		                DOWNLOAD_ELEMENT.find('#timeRemaining').text( formatTimeRemaining(timeleft.toFixed(0)) );
		                DOWNLOAD_ELEMENT.find('#progressBar').text( percentComplete.toFixed(2)+'%' )
		                .css('width', percentComplete.toFixed(2)+'%');
		            }
				}, false);
		       return xhr;
		    },
		    type: 'GET',
		    url: options.url,
		    data: {},
		    beforeSend: function(e)
		    {
		    	// Set start time
				DOWNLOAD_START_TIME = new Date().getTime();
				//
				DOWNLOAD_ELEMENT.find('#statusMessage').text('Preparing...');
		    }
		});

		return this;
	}
	// Save file
	this.saveFile = () =>
	{
		if ( request == undefined )
			return this;

		request.then(response =>
		{
			var reader = new FileReader();
			DOWNLOAD_ELEMENT.find('#statusMessage').text('Saving file, please wait...');
		    reader.onload = () =>
		    {
		    	var buffer = new Buffer( reader.result );
		    	// check if file exists
				if ( fs.existsSync(FILENAME) )
				{
					FILENAME = DEFAULT_INI_SETTINGS.Download_Settings.DOWNLOADS_PATH+APP_NAME+'_'+uniqid()+'_'+options.title+'.'+options.container;
				}
		    	fs.writeFile( FILENAME, buffer, (err) => 
		    	{
		    		// Delete html after file has been downloaded and created
		    		DOWNLOAD_ELEMENT.find('#progressBar').addClass('bg-success');
		    		DOWNLOAD_ELEMENT.find('#statusMessage').text('Complete.');
		    	});
		    };

		    reader.readAsArrayBuffer( response );
		});

		return this;
	}
	// Abort
	this.abort = () =>
	{
		if ( request != undefined )
			return request.abort();
	}	
}


});

module.exports = VideoDownloader;