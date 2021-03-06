//

function Forum()
{
	this.conf = config('global').Forum;
	this.onTopicPage = window.location.search.match(/^\?action=viewtopic/)!=null;
	this.topicId = location.search.replace(/.+topicid=(\d+).+/,'$1');
	this.forumId = ($('.pageContainer h1 a[href*="action=viewforum"]:eq(0)').attr('href') || '').replace(/.+forumid=(\d+).*/,'$1');
	this.TMD = tmd;
}

Forum.prototype.run = function()
{
	this.postsLog();
	this.uncensored();
	this.likeOwnPosts();
	this.imgFitOnComments();
	this.imgZoom();
};

Forum.prototype.uncensored = function()
{
	if(!this.onTopicPage || !(this.conf['Censored Post'].showUncensoreButton || this.conf['Censored Post'].showUncensoreAllButton || this.conf['Censored Post'].autoResolveAllCensoredPost || this.conf['Censored Post'].mofHideCensored))
		return;

	var
		$trComment = $()
		, $showPosts = $()
		, self = this
		, showPostsCount = 0
	;


	$$('.forumPostName').each(function()
	{
		var
			$table = $(this)
			, $tdComment = $table.next().find('.comment[align="center"]')
			, $trMof = $table.next().find('tr[style="background-color:#FAEBE2"]')
			, isCensored = $tdComment.length && /(Cenzurat)|(Зацензурено)/.test($tdComment.text().trim())
			, isMOFCensored = self.conf['Censored Post'].mofHideCensored && $trMof.length
		;

		//ensuring that this is a censored post
		if(isCensored || isMOFCensored)
		{
			var
				userID = $table.find('a[href*="userdetails.php?id="]').attr('href').replace(/.*id=/, "")
				, postID = $table.prev().attr('name')==='last' ? $table.prevAll(':eq(1)').attr('name') : $table.prev().attr('name')
				, $showPost = $('<a></a>',{text:__('Show post'), 'class':'showPost', 'postID':postID, 'userID':userID}).data('$tr', isMOFCensored ? $trMof : $tdComment.parent())
				, $showAllPost = $('<a></a>',{text:__('Show all posts'), 'class':'showAllPost'})
				, _append = []
			;

			if(self.conf['Censored Post'].showUncensoreButton)
			{
				_append.push('[',$showPost,']');
			}

			if(self.conf['Censored Post'].showUncensoreAllButton)
			{
				var _p = _append.length ? ' &nbsp;&nbsp; - &nbsp;&nbsp; [' : '[';
				_append.push(_p,$showAllPost,']');
			}

			/**
			 * append $showPost but hide it, this is needed to proper work with other extensions that breaks the dom
			 */
			if(!self.conf['Censored Post'].showUncensoreButton && (self.conf['Censored Post'].autoResolveAllCensoredPost || self.conf['Censored Post'].showUncensoreAllButton))
			{
				_append.push($showPost.hide());
			}

			if(isMOFCensored)
			{
				//clear avatar
				$trMof.find('td').eq(0).empty();
				$tdComment = $trMof.find('.comment');
			}

			$tdComment.empty().append.apply($tdComment, _append).parent().addClass('decenzureaza');
			$showPosts = $showPosts.add($showPost);
			showPostsCount += 1;
		}
	});


	$(document.body).on('click', 'a.showPost', function()
	{
		var
			$tr = $(this).data('$tr') || (function(a)
			{
				return $tr = $(a).closest('tr')
			})(this)
			, $td = $tr.find('.comment').html('<img src="/pic/loading2.gif" />')
			, userID = $(this).attr('userID')
			, postID = $(this).attr('postID')
			, pageNb=0
			, __cacheId = 'u.'+userID+'.posts'
			, _cacheUserPosts = _cache(__cacheId) || {}
			, $tmp = $('<div></div>')
		;

		loadNextPage();

		function loadNextPage()
		{
			if(_cacheUserPosts[postID])
			{
				$td.html(_cacheUserPosts[postID]).attr('align','left');
				$tr.removeClass('decenzureaza').addClass('decenzureazat');
				//$this.fixSpoilers();

				//update cache \1440*3days = 4320
				_cache.set(__cacheId, _cacheUserPosts, 4320);

				//update showPostsCount value
				showPostsCount -= 1;

				return;
			}

			//break if user isn't logged in
			if(!tmd.user.name)
				return $td.text('You must be logged in');

			$tmp.load("userhistory_posts.php?action=viewposts&id="+userID+"&page="+(pageNb++)+"  .pageContainer table:eq(0) table:eq(0)", function (d)
			{
				$(this).find('a[href*="&page=p"]').each(function(i,v)
				{
					_cacheUserPosts[parseInt(v.innerText,10)] = $(v).closest('table').nextAll('table.main:eq(0)').find('td.comment').html();
				});

				loadNextPage();
			});
		}

	});


	$(document.body).on('click', 'a.showAllPost', showAllPosts);


	//bugfix> there is another extensions, that breaks dom in some case, so we need to rerun a function with some delay
	self.conf['Censored Post'].autoResolveAllCensoredPost && showAllPosts() && setTimeout(showAllPosts, 100) && setTimeout(showAllPosts, 200);


	function showAllPosts()
	{
		$$('td.comment').find('a.showPost').each(function(i,v)
		{
			//async
			setTimeout(function()
			{
				$(v).click();
				(showPostsCount<=1) && setTimeout(self.TMD.updateLocationHash, 100);
			}, 50);
		});

		return true;
	}
};



Forum.prototype.likeOwnPosts = function()
{
	if(!this.onTopicPage || !this.conf.Action.likeMyPosts || !tmd.user.id)
		return;

	var $this = this;
	//TODO more User friendly response
	$$('.forumPostName').each(function()
	{
		var
			$table = $(this)
			, postID = $table.prev().attr('name')
			, userId = ($table.find('a[href^="userdetails.php"]').attr('href')+'').replace(/.+id=(\d+)/,'$1')
		;

		if(userId.toString() === tmd.user.id.toString())
		{
			var
				$spanLike = $('<a></a>', {'class':'lnk postLike', text:__('Like'), 'data-postid':postID})
				, $spanUnLike = $('<a></a>', {'class':'lnk postLike', text:__('Unlike'), 'data-postid':postID})
			;

			$table.find('td[width="99%"]').append(' - [',$spanLike, ' - ',$spanUnLike, ']');
		}
	});


	$$('.forumPostName').on('click', 'a.postLike', function()
	{
		var action = $(this).text() === __('Like') ? 'like' : 'unlike';

		$.post('/forum.php', {ajax:1, postid:$(this).data('postid'), topicid:$this.topicId, action:action});
		$(this).hide();
	});
};


Forum.prototype.postsLog = function()
{
	if(!this.onTopicPage || !this.forumId || !this.conf['Censored Post'].showLog)
		return;

	var
		self = this
		, $tmp = $('<div></div>')
		, __cacheId = 'log.'+self.forumId+'.posts'
		, _cacheLogForum = _cache(__cacheId) || {}
		, _s = ':'
		, getLog
	;

	$$('.forumPostName').each(function()
	{
		var
			$table = $(this)
			, $tdComment = $table.next().find('.comment[align="center"]')
		;

		//ensuring that this is a censored post
		if($tdComment.length && /(Cenzurat)|(Зацензурено)/.test($tdComment.text().trim()))
		{
			var
				postID = parseInt($table.prev().attr('name')==='last' ? $table.prevAll(':eq(1)').attr('name') : $table.prev().attr('name'), 10)
				, $by = $('<a></a>',{'class':'_censoredBy',html:'<img src="/pic/loading2.gif" />'})
				, _log
			;

			$table.find('td[width="99%"]').append(' - <span class="_censoredBy">[censored by ',$by, ']</span>');

			loadLog(1);

			function loadLog(step)
			{
				if(_log = _cacheLogForum[postID])
				{
					_log = _log.split(_s);
					$by.attr('href','/userdetails.php?id='+_log[0]).text(_log[1]);

					return;
				}

				if(!step)
				{
					$by.html('?');
					return;
				}

				if(getLog)
				{
					getLog.then(loadLog);
					return;
				}

				getLog = $.Deferred(function(dfd)
				{
					$.get("/log_forums.php?forumid="+self.forumId, function(data)
					{
						$tmp.html(data).find('.forum_moderators tr td:nth-child(3)').each(function(i,v)
						{
							var $a = $(v).find('a');
							if(!/.+action=viewtopic&topicid=(\d+)&page=p(\d+)#(\d+).*/.test($a.eq(0).attr('href')))
								return;

							var
								_postId = $a.eq(0).attr('href').replace(/.+page=p(\d+).+/,'$1')
								,_uId = $a.eq(1).attr('href').replace(/.+id=(\d+).*/,'$1')
								,_uNick = $a.eq(1).text()
							;

							_cacheLogForum[parseInt(_postId,10)] = _uId+_s+_uNick;
						});

						//update cache \1440*7days = 10080
						_cache.set(__cacheId, _cacheLogForum, 10080);

						dfd.resolve();
					});
				});


				getLog.then(loadLog);
			}

		}
	});
};


Forum.prototype.imgFitOnComments = function()
{
	if(!this.onTopicPage || !(this.conf.Action.imgFit || this.conf.Action.imgFitSpoilers))
		return;

	var classes = '';

	classes += this.conf.Action.imgFit ? 'imgFit' : '';
	classes += this.conf.Action.imgFitSpoilers ? ' imgFitSpoilers' : '';

	$(document.body).addClass(classes);

	$(document).on('click', '.imgFitSpoilers .comment .sp-body img, .imgFit .comment img', function()
	{
		$(this).toggleClass('zoomedIn');
	});
};


/**
 * Image hover zoom
 */
Forum.prototype.imgZoom = function()
{
	if(!this.onTopicPage || !this.conf.Action.linkImagePreview)
		return;

	$.fn.putLoadingImage = function()
	{
		return this.html('<img src="/pic/loading2.gif" />');
	};

	var
		$imgDiv = $('<div></div>',{'class':'imgZoom'}).putLoadingImage().appendTo(document.body)
		, windowHeight = $(window).height()
		, windowWidth = $(window).width()
		, $_img = $('<img />')
		, _imgs = {}
		, isImage = function(src)
		{
			return /.+\.(jpg|gif|png|jpeg)$/.test(src);
		}
		, self = this
		, border = 10
	;

	//update window height on window resize
	$(window).resize(function()
	{
		windowHeight = $(window).height();
		windowWidth = $(window).width();
	});

	//cache image
	function getImg(src, cb)
	{
		cb = cb || $.noop;

		_imgs[src] && cb(_imgs[src]) || (function()
		{
			var $img = $_img.clone().attr('src', src).load(function()
			{
				_imgs[src] = $img;
				cb(_imgs[src]);
			});
		})();
	}

	/**
	 * Trying to guess image url, if there is a direct link then return true
	 * @param a tag
	 * @returns {boolean}
	 */
	function guessLink(a)
	{
		/**
		 * iceimg =>
		 * 		http://iceimg.com/3_Y13ZSg/10369118-63104343460870-8857422334454843890-n =
		 * 		http://g.iceimg.com/3_Y13ZSg/10369118-63104343460870-8857422334454843890-n.jpg
		 */
		if(/^http:\/\/iceimg\.com\//.test(a.href))
		{
			l('Forum.imgZoom:guessLink => iceimg:', a.href);
			a.href = a.href.replace(/iceimg.com/,'g.iceimg.com') + '.jpg';
			l('\t\t\t\t\t\t\tnow>', a.href);

			return true;
		} else
		/**
		 * imgur =>
		 * 		http://imgur.com/X275NbC =
		 * 		http://i.imgur.com/X275NbC.jpg
		 */
		if(/^http:\/\/imgur\.com\//.test(a.href))
		{
			l('Forum.imgZoom:guessLink => imgur:', a.href);
			a.href = a.href.replace(/imgur.com/,'i.imgur.com') + '.jpg';
			l('\t\t\t\t\t\t\tnow>', a.href);

			return true;
		}

		return false;
	}

	//if preload is activated
	self.conf.Action.linkImagePreviewAutoLoad && $$('td.comment').find('a').each(function(i, a)
	{
		if(!isImage(a.href))
			return;

		//cache image
		getImg(a.href);
	});

	$$('td.comment').on('mousemove', 'a', function(e)
	{
		var
			a = this
			, pos = {
				left: e.pageX+border*2
				, top: e.pageY
			}
		;

		if(!isImage(a.href) && !guessLink(a))
			return;

		$imgDiv.putLoadingImage().show().css(pos);

		getImg(a.href, function($img)
		{
			var img = $img.get(0);

			if(img.naturalHeight > windowHeight)
			{
				$img.css('max-height', windowHeight - border);
				pos.top = $(window).scrollTop() + border/2;
			} else if(img.naturalHeight + e.clientY + border > windowHeight) {
				var diff = img.naturalHeight + e.clientY + border/2 - windowHeight;
				pos.top = $(window).scrollTop() + e.clientY - diff;
			}

			if(img.naturalWidth > windowWidth - pos.left)
			{
				$img.css('max-width', windowWidth - pos.left);
			}

			$imgDiv.css(pos).html($img);
		});
	});


	$$('td.comment').on('mouseleave', 'a', function()
	{
		$imgDiv.hide();
	});
};

