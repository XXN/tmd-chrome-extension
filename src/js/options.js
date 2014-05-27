
var manifest = {
	name: $getMessage('extName')+ ' ' + $getMessage('Settings'),
	icon: 'icons/icon32.png',
	version: 0.1,
	initialTab: 'About',
	settings:
	[
		{
			"Forum": [{
				"Action": [{
						type: 'checkbox',
						name: 'likeMyPosts',
						label: $getMessage('Like on your own posts'),
						initial: true
					}
				]
			}, {
				"Censored Post": [
					{
						type: 'checkbox',
						name: 'showUncensoreButton',
						label: $getMessage('Show `uncensore` button'),
						initial: true
					}
					,{
						type: 'checkbox',
						name: 'showUncensoreAllButton',
						label: $getMessage('Show `uncensore all` button'),
						initial: true
					}
					,{
						type: 'checkbox',
						name: 'autoResolveAllCensoredPost',
						label: $getMessage('(may freeze your browser) Auto resolve all censored posts'),
						initial: false
					}
					,{
						type: 'checkbox',
						name: 'showLog',
						label: $getMessage('Show log'),
						initial: true
					}
				]
			}]
		}

		,{
			"Browse": [{
				"Show": [
					{
						type: 'checkbox',
						name: 'expandableTorrents',
						label: $getMessage('Expandable Torrents'),
						initial: true
					}
					,{
						type: 'checkbox',
						name: 'massAddSearchButton',
						label: $getMessage('Search button on left side of Torrent'),
						initial: false
					}
				]
			}]
		}

		,{
			"About": '#about-page'
		}
	]
};



window.addEventListener("DOMContentLoaded", function()
{
	var
		settingsObj = {}
		, settings = new Settings(manifest, 'chrome', 'ConfigSettings')
	;


	$find('#about-page > h2').innerHTML = manifest.name;
});