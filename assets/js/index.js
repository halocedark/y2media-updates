$(function()
{

// Setup app updates
function setupAppUpdates()
{
	var options =
	{
		version: '',
		percent: 0,
		bytesPerSecond: 0,
		transferred: 0,
		total: 0
	};
	ipcIndexRenderer.on('update-about-to-download', (e, info) =>
	{
		console.log(info);
	});
	ipcIndexRenderer.on('checking-for-update', (e, info) =>
	{
		// Translate
		if ( UI_DISPLAY_LANG.lang == 'en' )
		{
			// Display loader
			TopNavLoader('Checking for updates...');
		}
		else if ( UI_DISPLAY_LANG.lang == 'ar' )
		{
			// Display loader
			TopNavLoader('البحث عن تحديثات...');
		}
		else
		{
			// Display loader
			TopNavLoader("Vérification des mises à jour...");
		}
	});
	ipcIndexRenderer.on('update-available', (e, info) =>
	{
		// Hide loader
		TopNavLoader('', false);
		options.version = info.version;
		console.log(info);
	});
	ipcIndexRenderer.on('update-not-available', (e, info) =>
	{
		// Hide loader
		TopNavLoader('', false);
		console.log(info);
	});
	ipcIndexRenderer.on('update-error', (e, info) =>
	{
		// Hide loader
		TopNavLoader('', false);
		console.log(info);
	});
	ipcIndexRenderer.on('update-downloaded', (e, info) =>
	{
		// Save update info
		getLatestUpdateRelease().then(response =>
		{
			saveLatestUpdateReleaseInfo(response);
		});
		// Translate
		if ( UI_DISPLAY_LANG.lang == 'en' )
		{
			PromptConfirmDialog('Confirm install updates', 'Updates downloaded, would you like to quit and install?')
			.then(confirmed =>
			{
				ipcIndexRenderer.send('quit-and-install-update', info);
			});
		}
		else if ( UI_DISPLAY_LANG.lang == 'ar' )
		{
			PromptConfirmDialog('قم بتأكيد تثبيت التحديثات', 'تم تنزيل التحديثات ، هل تريد الإنهاء والتثبيت؟')
			.then(confirmed =>
			{
				ipcIndexRenderer.send('quit-and-install-update', info);
			});
		}
		else
		{
			PromptConfirmDialog("Confirmer l'installation des mises à jour", "Mises à jour téléchargées, souhaitez-vous quitter et installer ?")
			.then(confirmed =>
			{
				ipcIndexRenderer.send('quit-and-install-update', info);
			});
		}
		console.log(info);
	});
	ipcIndexRenderer.on('download-update-progress', (e, info) =>
	{
		// Display update dialog
		options.percent = info.percent;
		options.total = info.total;
		options.transferred = info.transferred;
		options.bytesPerSecond = info.bytesPerSecond;
		UpdateAppDialog(options);
	});
}
// Setup youtube downloads
function setupYoutubeDownloads()
{
	
	var youtubeDownloadsContainer = $('#youtubeDownloadsContainer');
	if ( youtubeDownloadsContainer[0] == undefined )
		return;

	var ERROR_BOX = youtubeDownloadsContainer.find('#ERROR_BOX');
	var SINGLE_VIDEO_WRAPPER = youtubeDownloadsContainer.find('#SINGLE_VIDEO_WRAPPER');
	var SVW_FORM = SINGLE_VIDEO_WRAPPER.find('#SVW_FORM');
	var LOADER_01 = SINGLE_VIDEO_WRAPPER.find('#LOADER_01');
	var VIDEO_LINKS_DIV = SINGLE_VIDEO_WRAPPER.find('#VIDEO_LINKS_DIV');
	var IFRAME_01 = SINGLE_VIDEO_WRAPPER.find('#IFRAME_01');
	var VIDEO_TITLE = SINGLE_VIDEO_WRAPPER.find('#VIDEO_TITLE');
	var USER_THUMBNAIL = SINGLE_VIDEO_WRAPPER.find('#USER_THUMBNAIL');
	var USER = SINGLE_VIDEO_WRAPPER.find('#USER');
	var VERIFIED = SINGLE_VIDEO_WRAPPER.find('#VERIFIED');
	var SUBSCRIBER_COUNT = SINGLE_VIDEO_WRAPPER.find('#SUBSCRIBER_COUNT');
	var DESCRIPTION = SINGLE_VIDEO_WRAPPER.find('#DESCRIPTION');
	var VIDEO_TAB = SINGLE_VIDEO_WRAPPER.find('#VIDEO_TAB');
	var AUDIO_TAB = SINGLE_VIDEO_WRAPPER.find('#AUDIO_TAB');

	var BEST_AUDIO_FORMAT = null;
	SVW_FORM.off('submit');
	SVW_FORM.on('submit', e =>
	{
		e.preventDefault();
		var target = SVW_FORM;
		var url = target.find('#videoURLInput').val();
		displayVideoInfo(url);
	});
	// on input
	SVW_FORM.find('#videoURLInput').off('click');
	SVW_FORM.find('#videoURLInput').on('click', e =>
	{
		navigator.clipboard.readText().then(text =>
		{
			SVW_FORM.find('#videoURLInput').val(text);
			SVW_FORM.trigger('submit');
		});
	});
	// download video
	VIDEO_TAB.off('click');
	VIDEO_TAB.on('click', e =>
	{
		var target = $(e.target);
		if ( target.data('role') == 'DOWNLOAD' )
		{
			var parent = target.closest('[data-role="ROW"]');
			var options = {
				title: parent.data('title'),
				thumbnail: parent.data('thumbnail'),
				url: parent.data('url'),
				container: parent.data('container')
			};
			// check if has audio
			if ( !parent.data('hasaudio') )
			{
				// download video
				var vd = new VideoDownloader(options);
				vd.download().saveFile();
				// download audio
				options.url = BEST_AUDIO_FORMAT;
				options.thumbnail = 'assets/img/utils/audio.png';
				var vd = new VideoDownloader(options);
				vd.download().saveFile();
				return;
			}
			var vd = new VideoDownloader(options);
			vd.download().saveFile();
		}
	});
	// download audio
	AUDIO_TAB.off('click');
	AUDIO_TAB.on('click', e =>
	{
		var target = $(e.target);
		if ( target.data('role') == 'DOWNLOAD' )
		{
			var parent = target.closest('[data-role="ROW"]');
			var options = {
				title: parent.data('title'),
				thumbnail: parent.data('thumbnail'),
				url: parent.data('url'),
				container: parent.data('container')
			};
			var vd = new VideoDownloader(options);
			vd.download().saveFile();
		}
	});
	// init lists
	initLists();
	// display video info
	function displayVideoInfo(url)
	{
		if ( url.length == 0 )
		{
			VIDEO_LINKS_DIV.fadeOut(200);
			return;
		}
		// check if valid youtube video
		if ( !ytdl.validateURL(url) )
		{
			ERROR_BOX.show(0).delay(5000).hide(0)
			.find('#text').text('Please enter a valid youtube video url!');
			return;
		}
		// check if valid youtube video id
		try
		{
			ytdl.getURLVideoID(url);
		}
		catch(e)
		{
			ERROR_BOX.show(0).delay(5000).hide(0)
			.find('#text').text('Could not parse video id!');
			return;
		}
		// get info
		// display loader
		LOADER_01.fadeIn(200);
		getYoutubeVideoLinks(url).then(info =>
		{
			// hide loader
			LOADER_01.fadeOut(200);
			// display info div
			VIDEO_LINKS_DIV.fadeIn(200);
			console.log(info);
			// preview video basic info
			IFRAME_01.attr('src', info.videoDetails.embed.iframeUrl);
			VIDEO_TITLE.text(info.videoDetails.title);
			USER_THUMBNAIL.attr('src', info.videoDetails.author.thumbnails[0].url );
			USER.text(info.videoDetails.author.user);
			SUBSCRIBER_COUNT.text( formatNumberToStr(info.videoDetails.author.subscriber_count)+' subscribers' );
			if ( info.videoDetails.author.verified )
				VERIFIED.html('<i class="fa-solid fa-circle-check"></i>');

			DESCRIPTION.html(info.videoDetails.description);
			// display formats
			var vHTML = '';
			var aHTML = '';
			for (var i = 0; i < info.formats.length; i++) 
			{
				var format = info.formats[i];
				// videos
				if ( format.hasVideo && format.hasAudio )
				{
					var label = (format.quality == 'hd1080' || format.quality == 'hd720') 
								? `${format.qualityLabel} (.${format.container}) <p class="tag-01">full-HD</p>` 
								: `${format.qualityLabel} (.${format.container})`;
					var contentLength = (format.contentLength == null) 
										? 'N/A' : formatBytesToStr( parseInt(format.contentLength) );
					vHTML += `<div class="tr" data-role="ROW" data-url="${format.url}" data-hasvideo="${format.hasVideo}" data-hasaudio="${format.hasAudio}" data-thumbnail="${info.videoDetails.thumbnails[0].url}" data-title="${info.videoDetails.title}" data-container="${format.container}">
								<li class="td text-02">
									${label}
								</li>
								<li class="td text-02">
									${ contentLength }
								</li>
								<li class="td text-02 pointer-events">
									<button class="btn btn-success btn-sm" data-role="DOWNLOAD">
										<span class="nopointer-events"><i class="fa-solid fa-cloud-arrow-down"></i></span>
										Download
									</button>
								</li>
							</div>`;	
				}
				if ( !format.hasVideo && format.hasAudio )
				{
					var label = `.${format.container} (${formatSampleRate(format.bitrate)})`;
					var contentLength = (format.contentLength == null) 
										? 'N/A' : formatBytesToStr( parseInt(format.contentLength) );
					aHTML += `<div class="tr" data-role="ROW" data-url="${format.url}" data-thumbnail="assets/img/utils/audio.png" data-title="${info.videoDetails.title}" data-container="${format.container}">
								<li class="td text-02">
									${label}
								</li>
								<li class="td text-02">
									${ contentLength }
								</li>
								<li class="td text-02 pointer-events">
									<button class="btn btn-success btn-sm" data-role="DOWNLOAD">
										<span class="nopointer-events"><i class="fa-solid fa-cloud-arrow-down"></i></span>
										Download
									</button>
								</li>
							</div>`;	
				}
			}
			// get best audio format
			var audioFormats = ytdl.filterFormats(info.formats, 'audioonly');
			for (var i = 0; i < audioFormats.length; i++) 
			{
				var format = audioFormats[i];
				if ( format.audioQuality == 'AUDIO_QUALITY_MEDIUM' )
				{
					BEST_AUDIO_FORMAT = format.url;
					break;
				}
				//if ( format. )
			}
			// add html
			VIDEO_TAB.find('.tbody').html(vHTML);
			AUDIO_TAB.find('.tbody').html(aHTML);
		});
	}
}
// rebind Events
rebindEvents = () =>
{
	setupYoutubeDownloads();
}
// Call
rebindEvents();
// First UI
getPage(APP_DIR_NAME+'views/pages/youtube-downloads.ejs')
.then(response =>
{
	// add html
	MAIN_CONTENT_CONTAINER.html(response);
	//
	rebindEvents();
});

})


