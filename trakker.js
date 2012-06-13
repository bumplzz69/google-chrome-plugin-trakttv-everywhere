/************************************************
*		trakttv Everywhere								*
*	 Author: Simon Schubert							   *
*	 Email: sschubert89@gmail.com					   *
*   github: https://github.com/SimonSchubert/   *
*	 google-chrome-plugin-trakttv-everywhere     *
*															   *
*************************************************/

vuser = '';
vpass = "";
pMode = 0;
pIMDB=0;pHULU=1;pSOUTHPARK=2;pKINOXTO=3;


function getPage()
{
	if(window.location.toString().search("kinox")!=-1)
	{
		pMode = pKINOXTO;
	}
	else
	if(window.location.toString().search("hulu")!=-1)
	{
		pMode = pHULU;
	}
	else
	if(window.location.toString().search("imdb.com")!=-1)
	{
		pMode = pIMDB;
	}
	else
	if(window.location.toString().search("southpark.de/alleEpisoden")!=-1||window.location.toString().search("southparkstudios.com/full-episodes")!=-1)
	{
		pMode = pSOUTHPARK;
	}
}	

function loadUser()
{
chrome.extension.sendRequest( { eventName: "getLogin" },
    function(response) {
        vuser = response.user;
        vpass = response.pass;
        getPage();
        main();
    	}
	);
}

function main()
{
$(document).ready(function() {
  var datashows; // JSON Object
  var datamovies;
  
  // Check if the JSON Object is stored in the local storage
  var ts = Math.round((new Date()).getTime() / 1000);
  var lastupdate = ts-$.Storage.get("seen-shows-date");
  	if( $.Storage.get("seen-shows-date") != null && lastupdate<300 ) 
  	{
  		console.log("loading seen-shows json object from local storage - last update :"+(lastupdate)); 
		datashows = JSON.parse($.Storage.get("seen-shows")); // Load
		datamovies = JSON.parse($.Storage.get("seen-movies")); // Load
		
		if(pMode == pKINOXTO)
			loadSeenKinox();
		if(pMode == pIMDB)
			loadSeenImdb();
		if(pMode == pSOUTHPARK)
			initSouthpark();
	}
	else
	{
	console.log("save and load seen-shows json object to local storage"); 
  		$.getJSON('http://legendarydefense.net/trakt/trakt_getshows.php?trakt_user='+vuser, function(data2) 
  		{
			datashows = data2;
			$.Storage.set("seen-shows-date", ts.toString());
			$.Storage.set("seen-shows", JSON.stringify(data2));	//save
			
			$.getJSON('http://legendarydefense.net/trakt/trakt_getmovies.php?trakt_user='+vuser, function(data3) 
  			{
  				datamovies = data3;
				$.Storage.set("seen-movies", JSON.stringify(data3));
				
				if(pMode == pKINOXTO)
					loadSeenKinox();
				if(pMode == pIMDB)
					loadSeenImdb();
				if(pMode == pSOUTHPARK)
					initSouthpark();
			});
		});
	}
  
  
  
  

addSeenButton();

function initSouthpark()
{
	$('a[href*="guide/episoden/staffel"]').each(function() {
		$(this).click(function(event){
			setTimeout(loadSeenSouthpark, 2000);
		});
	});		
	loadSeenSouthpark();
}

function getSouthparkShowIDs(_href)
{
		var tmpref = _href.split("/");
		var tmpes = tmpref[tmpref.length-1];
		console.log(tmpref[tmpref.length-2]+" -"+tmpes);
		
		if(tmpref[tmpref.length-2] == "full-episodes")
		{
			var season = tmpes.substr(1,2).replace(/^0+/, '');	
			var episode = tmpes.substr(4,2).replace(/^0+/, '');	
			console.log(season+" -"+episode);
		}
		else
		{
			var tmpes = tmpref[tmpref.length-2];
			if(tmpes.length==3)
			{
			var season = tmpes.substr(0,1).replace(/^0+/, '');	
			var episode = tmpes.substr(1,3).replace(/^0+/, '');	
			}
			else
			{
			var season = tmpes.substr(0,2).replace(/^0+/, '');	
			var episode = tmpes.substr(2,4).replace(/^0+/, '');	
			}
		}
		
		IDS = {
		EPISODE :episode,
		SEASON : season};
	return IDS;
}

function loadSeenSouthpark()
{
	console.log("loadSeenSouthpark()");
	var orgimgwidth = 55;//parseInt($('a.content_eppreview').find("img").eq(1).css("width"));
	$('a.content_eppreview').each(function() {
		var that = $(this);
		
		
		var ids = getSouthparkShowIDs($(this).attr("href"));
		season = ids.SEASON;
		episode = ids.EPISODE;

		$.each(datashows, function(key, show) {
			
  			if(show.imdb_id == "tt0121955")
			{
				
				
				for(var i=0;i<show.seasons.length;i++)
				{
					if(show.seasons[i].season.toString()==season)
					{
						if ( $.inArray(episode, show.seasons[i].episodes.toString().split(",")) > -1 ) {
							that.parent().append("<div class='overlay-watched-small' style='left:"+(orgimgwidth-28)+"px;'></div>");
						}
					}

				}
				
				
			}
		});

				
		
	});
	
}

function loadSeenImdb()
{
	if(window.location.toString().search("/chart/")!=-1)	
	{
		/*** IMDB charts highlighting **/
		$('#main').find("tbody").find("tr").each(function() {
			var that = $(this);

			var tmphref = $(this).find("td").eq(2).find("a").attr("href");
			
			if(tmphref)
			{
			tmphref = tmphref.split("/");
			var imgimdb;
			for(var p=0 ; p<tmphref.length ; p++)
			{
				if(tmphref[p]=="title")
					imgimdb = tmphref[p+1];
			}

    		 $.each(datamovies, function(key, show) {

			 if(show.imdb_id == imgimdb)
			 {
    		 	that.css("background-color","black");
				that.find("td").css("color","white");
    		 }
    		
    		 });
    		}
    		
		});
	}
	else
	{
		
		if($('#img_primary').find("a").find("img").length>0)
		{
			var orgimgwidth = parseInt($('#img_primary').find("a").find("img").css("width"));
    		//var shadowwidth = parseInt($('#img_primary').find("a").find("img").css("-webkit-box-shadow").split("px")[2],0);
			var cssleft = (orgimgwidth - 55);
			
			var tmphref = window.location.toString().split("/");

			for(var p=0 ; p<tmphref.length ; p++)
			{
				if(tmphref[p]=="title")
					imgimdb = tmphref[p+1];
			}
			
			$.each(datamovies, function(key, show) {
				if(show.imdb_id == imgimdb)
				{
    				$('#img_primary').find("a").prepend("<div class='overlay-watched' style='left:"+cssleft+"px;bottom: 10px;'></div>");
    			}
    		});
			
			
		}
		
	$('a[href*="/title/"]').each(function() {
	/*** IMDB add seen image to imdb image links **/
	
    	if($(this).has("img").length>0)
    	{
			var that = $(this);
			var imgimdb;
			var tmphref = $(this).attr("href").split("/");

			for(var p=0 ; p<tmphref.length ; p++)
			{
				if(tmphref[p]=="title")
					imgimdb = tmphref[p+1];
			}
			
			var orgimgwidth = parseInt($(this).find("img").css("width"));
    		var shadowwidth = parseInt($(this).find("img").css("-webkit-box-shadow").split("px")[2],0);
			var cssleft = (orgimgwidth - 55 + shadowwidth);

    		$.each(datamovies, function(key, show) {
				if(show.imdb_id == imgimdb)
				{
    				that.has("img").prepend("<div class='overlay-watched' style='left:"+cssleft+"px'></div>");
    			}
    		});

    	}
	});
	}
}


function loadSeenKinox()
{
var vimdb = $(".IMDBRatingLinks").children("a").attr("href").replace('/', '');


  $.each(datashows, function(key, show) {
  	

	if(show.imdb_id == vimdb)
	{

		var selectedSeason = $("#SeasonSelection option:selected").attr("value");
	

			for(var i=0;i<show.seasons.length;i++)
			{
				greySeenSeasons(i);
				if(show.seasons[i].season.toString()==selectedSeason)
					greySeenEpisodes(i);
			}
	
		function greySeenSeasons(id)
		{
		var seenlenght = show.seasons[id].episodes.toString().split(",").length;
		var seasonlenght = $("#SeasonSelection  option[value="+(id+1)+"]").attr("rel").toString().split(",").length;
		
		var sid = show.seasons[id].season;
			if(seenlenght-seasonlenght>=0)
			{
				$("#SeasonSelection  option[value="+(sid)+"]").css("background", "grey");
			}		
			else
			{
				$("#SeasonSelection  option[value="+(sid)+"]").css("background-color","#bbbbbb");
			}
		}

		function greySeenEpisodes(id)
		{
		var selectids = show.seasons[id].episodes.toString().split(",");
		
			for(var y=0;y<selectids.length;y++)
			{
				$("#EpisodeSelection  option[value="+selectids[y]+"]").css("background", "grey");
			}
		}
		
	}
			
	});
}



$('#SeasonSelection').change(function() {
	resetSelector();
  	loadSeenKinox();
});



function resetSelector()
{
	$("#EpisodeSelection").children().css("background", "white");
}

function addSeenButton()
{
	
	function appendButtons()
	{
		$('<div class="trakt-button button-success" id="trakt-success">Success</div>').insertAfter(".trakt-button.button-checkin");	
		$('<div class="trakt-button button-failure" id="trakt-failure">Failure</div>').insertAfter("#trakt-success");
		$('<div class="trakt-button button-exist" id="trakt-exist">Already Seen</div>').insertAfter("#trakt-failure");
		$('<img id="trakt-loading" src="'+chrome.extension.getURL("load.gif")+'">').insertAfter("#trakt-exist");
	}
	
	if(pMode==pKINOXTO)
	{
	if($('#backward-episode').length == 0)
		$('<a class="trakt-button button-seen" id="add-seen-movie-kinoxto">Seen</a> <a class="trakt-button button-checkin" id="add-checkin-movie-kinoxto">Check In</a><br><br>').insertBefore("#MirrorArea");	
	else
		$('<div id="trakt-result"></div><a class="trakt-button button-seen" id="add-seen-show-kinoxto">Seen</a> <a class="trakt-button button-checkin" id="add-checkin-show-kinoxto">Check In</a>').insertAfter("#backward-episode");
	
		appendButtons();
	}
	else
	if(pMode==pHULU)
	{
		if($("meta[property='og:type']").attr("content")=="video.episode")
			$('<a class="trakt-button button-seen" id="add-seen-show-hulu">Seen</a> <a class="trakt-button button-checkin" id="add-checkin-show-hulu">Check In</a><br><br>').insertBefore("#watch-title-top");	
		else
		if($("meta[property='og:type']").attr("content")=="video.movie")	
			$('<a class="trakt-button button-seen" id="add-seen-movie-hulu">Seen</a> <a class="trakt-button button-checkin" id="add-checkin-movie-hulu">Check In</a><br><br>').insertBefore("#watch-title-top");	
		appendButtons();
	}
	else
	if(pMode==pIMDB)
	{
		if($(".tv_header").length>0)
			$('<div id="traktv"><a class="trakt-button button-seen" id="add-seen-show-imdb">Seen</a> <a class="trakt-button button-checkin" id="add-checkin-show-imdb">Check In</a></div><br><br>').prependTo($('#overview-bottom'));
		else
			$('<div id="traktv"><a class="trakt-button button-seen" id="add-seen-movie-imdb">Seen</a> <a class="trakt-button button-checkin" id="add-checkin-movie-imdb">Check In</a></div><br><br>').prependTo($('#overview-bottom'));
		appendButtons();	
	}
	else
	if(pMode==pSOUTHPARK)
	{
		$('#rightbtn_digg').after('<a class="trakt-button" id="add-seen-show-southpark" style="font-size: 13px;height: 10px;padding-top: 0px;">Seen</a><a class="trakt-button button-checkin" id="add-checkin-show-southpark" style="font-size: 13px;height: 10px;padding-top: 0px;">Check In</a>');

		appendButtons();	
	}
	
	
	function animate_button_failure()
 	{
		$('#trakt-failure').css("display","block");
		$('#trakt-failure').css("opacity","1");
				
		$("#trakt-failure").animate({
    		opacity: 0,
  			}, 3000, function() {
   		$('#trakt-failure').css("display","none");
  		});	 		
 	}
 	
 	function animate_button_exist()
 	{
		$('#trakt-exist').css("display","block");
		$('#trakt-exist').css("opacity","1");
				
		$("#trakt-exist").animate({
    		opacity: 0,
  			}, 3000, function() {
   		$('#trakt-exist').css("display","none");
  		});	 		
 	}
 	
 	
 	function add_seen_show(vuser,vpass,vimdb,vtitle,vyear,vseason,vepisode)
 	{
 		var trakt_url = "http://api.trakt.tv/show/episode/seen/";
		var request = $.ajax({
			type: "POST",
			url: "http://legendarydefense.net/trakt/trakt_transfer.php?trakt_url="+trakt_url,	
			dataType: "json",
			crossDomain: true,
			
 		 	data: {
   			username: vuser,
   			password: vpass,
    			imdb_id: vimdb,
    			tvdb_id: "",
   			title: vtitle,
   			year: vyear,
   			episodes: [
   			     	{
    			       season: vseason,
     			       episode: vepisode
     			   	}
    				]
				},
			success: function(data5,data2,data3) {

					$("#trakt-loading").css("display","none");
					if(data5.message=="1 episodes marked as seen")
						animate_button_success();
					else
						animate_button_failure();

					
    		},	
			beforeSend: function(x) {
				$("#trakt-loading").css("display","block");
          }
		});
 	}
 	
 	function animate_button_success()
 	{
		$('#trakt-success').css("display","block");
		$('#trakt-success').css("opacity","1");
				
		$("#trakt-success").animate({
    		opacity: 0,
  			}, 3000, function() {
   		$('#trakt-success').css("display","none");
  		});	 		
 	}
 	
 	
 	function add_seen_movie(vuser,vpass,vimdb,vtitle,vyear)
 	{
 		var trakt_url = "http://api.trakt.tv/movie/seen/";
		var request = $.ajax({
			type: "POST",
			url: "http://legendarydefense.net/trakt/trakt_transfer.php?trakt_url="+trakt_url,	
			dataType: "json",
			crossDomain: true,
 		 	data: {
   			username: vuser,
   			password: vpass,
   			movies: [
   			     	{
   			     	 imdb_id: vimdb,
   					 title: vtitle,
   					 year: vyear,
          			 plays: 1,
            		 last_played: Math.round((new Date()).getTime() / 1000)
     			   	}
    				]
				},
			success: function(data5,data2,data3) {
					
					$("#trakt-loading").css("display","none");
					if(data5.inserted>0)
						animate_button_success();
					else
					if(data5.already_exist>0)
						animate_button_exist();
					else
						animate_button_failure();
					
    		},
    		beforeSend: function(x) {
				$("#trakt-loading").css("display","block");
         }

		});
 	}

 	
   $("#add-seen-show-kinoxto").click(function(event){
   	
		var vimdb = $(".IMDBRatingLinks").children("a").attr("href").replace('/', '');
		var vepisode = $("#EpisodeSelection option:selected").text().replace(/[^0-9]+/g, ''); 
		var vseason = $("#SeasonSelection option:selected").text().replace(/[^0-9]+/g, ''); 
		var vyear = $(".Year:first").text().replace(/[^0-9]+/g, ''); 
		var vtitle = $("div.Opt.leftOpt.Headlne").children("h1").children("span:first-child").text();
		
		
		add_seen_show(vuser,vpass,vimdb,vtitle,vyear,vseason,vepisode);		

   });
   
   $("#add-seen-movie-kinoxto").click(function(event){
   	
		var vimdb = $(".IMDBRatingLinks").children("a").attr("href").replace('/', '');
		var vyear = $(".Year:first").text().replace(/[^0-9]+/g, ''); 
		var vtitle = $("div.Opt.leftOpt.Headlne").children("h1").children("span:first-child").text();	
		
		add_seen_movie(vuser,vpass,vimdb,vtitle,vyear);		

   });
   
   
   $("#add-seen-movie-imdb").click(function(event){
   	
   	var tmp = $('meta[property="og:url"]').attr("content").split("/");
		var vimdb = tmp[tmp.length-2];
		var vyear = ""; 
		var vtitle = "";	
		
		add_seen_movie(vuser,vpass,vimdb,vtitle,vyear);		

   });
   
   $("#add-seen-show-imdb").click(function(event){
   	
   	var tmp = $('meta[property="og:url"]').attr("content").split("/");
		var vimdb = tmp[tmp.length-2];
		var vyear = ""; 
		var vtitle = $(".tv_header").find("a").text();
		var tmp2 = $(".tv_header").find("span").text().split(",");
		var vseason = tmp2[0].replace(/\D/g,"");
 		var vepisode = tmp2[1].replace(/\D/g,"");
 		
		add_seen_show(vuser,vpass,vimdb,vtitle,vyear,vseason,vepisode);
   });


	$("#add-seen-show-hulu").click(function(event){
		
 		var val = $(".video-details.watch-title-left").text();
		var vseason = $.trim(val.split("|")[0].match("Season(.*)Episode")[1]);
		var vepisode = $.trim(val.split("|")[0].split("Episode")[1]);
		var vtitle = $("meta[property='og:title']").attr("content").split(":")[0];
		var vimdb = '';
		var vyear = '';

		add_seen_show(vuser,vpass,vimdb,vtitle,vyear,vseason,vepisode);
   });
   
   $("#add-seen-movie-hulu").click(function(event){
	
		var vtitle = $.trim($("meta[property='og:title']").attr("content").split(":")[0]);
		var vimdb = '';
		var vyear = $.trim($(".film-details").find("tbody").find("tr").find("td:eq(1)").eq(0).text().split("(")[1]).replace(/[^0-9]+/g, '');
	
		add_seen_movie(vuser,vpass,vimdb,vtitle,vyear);
   });
   
   
  	$("#add-seen-show-southpark").click(function(event){
		
		var ids = getSouthparkShowIDs(window.location.toString());
		season = ids.SEASON;
		episode = ids.EPISODE;
		var vseason = $.trim(season);
		var vepisode = $.trim(episode);
		var vtitle = "South Park";
		var vimdb = 'tt0121955';
		var vyear = '';

		add_seen_show(vuser,vpass,vimdb,vtitle,vyear,vseason,vepisode);
   });
}
	

	$('#SeasonSelection').change(function() {
		resetSelector();
  		loadSeenKinox();
	});

	function resetSelector()
	{
		$("#EpisodeSelection").children().css("background", "white");
	}
	

});
}


 if (window.addEventListener) {  
     window.addEventListener('load',  loadUser(), false);
 } else {
     window.attachEvent('onload',  loadUser());
 }



