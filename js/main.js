//var requestRoute = window.location.origin + "/places.php"
var requestRoute = 'http://hw7php.7dcpfrnk9w.us-east-2.elasticbeanstalk.com/places.php'
var fromlat = fromlng = 0
var previousPages = []
var pageTokens = []
var bottomElementsIdList = ["results-wrapper", "details-wrapper", "favorites-wrapper", "error"]
var hasSearched = false
var noFavoritesError = "No favorites found"
var noSearchRecordsError = "No search records found"
var selectedRow = ""
var selectedId = ""
var currentPageNum = 0
var currentGooglePlaceObj = ""

/* Angular functions */
function details() {
  var self = this;
  self.showDetails = false;
}

angular.module('app', ['ngAnimate']).controller('details', details)
/* Angular functions end */

//callback function for when we recieve clients coords
var injectMyCoords = function(jsonResponseObj){
    document.getElementById("my-location").value = jsonResponseObj.lat + "," + jsonResponseObj.lon
    setGoogleAutocomplete(jsonResponseObj.lat, jsonResponseObj.lon)
}

$(document).ready(function(){
    $('#results-wrapper').addClass("ng-hide")
    $('#favorites-wrapper').addClass("ng-hide")
})

//get clients coords
submitRequest("http://ip-api.com/json", injectMyCoords);

//handles all get requests
function submitRequest(requestURL, callback){
    $( '#progress-outer' ).show()
    var xhr = new XMLHttpRequest()
    xhr.open("GET", requestURL, true)
    xhr.send()
    xhr.onprogress = function(event){
       progress(event)
    }
    xhr.onloadend = function(){
        $( '#progress-outer' ).hide()
        if (xhr.status == 200){
            var jsonResponseObj = JSON.parse(xhr.responseText)
            callback(jsonResponseObj)
        }else{
            alert("Something went wrong with the request. Status: " + xhr.status)
        }
    }
}

function progress(event){
    var loaded = event.loaded;
    var total = event.total;
    $( '#progress-inner').width((loaded/total)*100 + "%")
}

function createDetailsFunction(id, rowEle){
    return function() { getDetails(id, rowEle)}
}

//callback function for after we recieve the form search results
var renderNearbySearchResults = function(jsonResponseObj){
    var results = jsonResponseObj.results
    document.getElementById('next-page-button').onclick = function(){
        getNextPage(jsonResponseObj.nextPageToken, true)
    }
    
    if (jsonResponseObj.mylocation){
        fromlat = jsonResponseObj.mylocation.split(",")[0]
        fromlng = jsonResponseObj.mylocation.split(",")[1]
    }

    if (results.length > 1){ //because im returning user lat/long as first record always
        var table = document.getElementById("results").getElementsByTagName("table")[0]
        var tableRows = table.rows
        var index = 1
        for (var i=0; i<results.length; i++){
            var row = results[i];
            var tableRow = tableRows[index]
            $(tableRow).show()
            var latitude = row.lat
            var longitude = row.lng
            tableRow.id = row.place_id
            var rowCells = tableRow.cells
            rowCells[0].innerHTML = index
            rowCells[1].innerHTML = "<img class='category-icon' src='" + row.icon + "'>"
            rowCells[2].innerHTML = row.name
            rowCells[3].innerHTML = row.vicinity

            if (localStorage.getItem(row.place_id)){
                rowCells[4].innerHTML = "<div onclick='favoriteButtonAction(event)' class='table-button gold-star'><i class='fas fa-star'></i></div>"
            } else {
                rowCells[4].innerHTML = "<div onclick='favoriteButtonAction(event)' class='table-button fav'><i class='far fa-star'></i></div>"
            }

            tableRow.style.backgroundColor = "transparent"
            if (tableRow.id == selectedId){
                tableRow.style.backgroundColor = "#fedf96"
            }              
 
            rowCells[5].onclick = createDetailsFunction(row.place_id, tableRow)
            index++
        }
        for (var j=i; j<=20;j++){
            tableRow = tableRows[j]
            $(tableRow).hide()
        }

        if (previousPages.length){
            $('#previous-page-button').show()
        } else {
            $('#previous-page-button').hide()
        }
        if (jsonResponseObj.nextPageToken){
            $('#next-page-button').show()
        } else {
            $('#next-page-button').hide()
        }

        showElement("results")
        resultsButtonActive()
        clearError("results")
        
        setTimeout(function() {
            var nextButton = document.getElementById('next-page-button')
            if (nextButton){
                nextButton.disabled = false
            }
        }, 1000)
    } else {
        displayError("results", "warning", noSearchRecordsError)
        showElement("results")
    }
}

function showPreviousPage(){
    previousPages.pop()
    currentPageNum--
    if (currentPageNum == 0){
        $('#search-button').click()
    } else {
        getNextPage(pageTokens[currentPageNum], false)
    }
}

function getNextPage(token, increment){
    if (increment){
        currentPageNum++ 
        pageTokens[currentPageNum] = token
        var currentPage = document.getElementById("results").innerHTML
        previousPages.push(currentPage)
    }
    var requestURL = requestRoute + "?page=" + token
    submitRequest(requestURL, renderNearbySearchResults)
}

//called when user submits form, requests server to get nearby places from google
function search(){
    hasSearched = true
    clearBottomArea()
     
    //set up search query
    //var form = document.forms.searchForm
    //var formData = new FormData(form)
    //var keyword = formData.get('keyword')
    //var category = formData.get('category')
    //var distance = formData.get('distance')
    //var from = formData.get('from')
    
    var keyword = $('#keyword').val()
    var category = $('#category').val()
    var distance = $('#distance').val()
    var from = ""
    var customLoc = document.getElementById("location-field")
    if (!customLoc.disabled){
        from = customLoc.value
    } else {
        from = $('#my-location').val()
    }
    var requestURL = requestRoute + "?keyword=" + keyword + "&category=" + category + "&distance=" + distance+ "&from=" + from
    submitRequest(requestURL, renderNearbySearchResults)
}

//callback function for when user requests business details
var renderDetails = function(place, status){
    if (status == google.maps.places.PlacesServiceStatus.OK) {
        //console.log(place);
    } else {
        alert("Failed to get place details: " + status)
    }
    $('#detail-title').html(place.name)
    renderInfo(place)
    renderPhotos(place.photos)
    renderMap(place)
    renderReviews(place, $('#review-order-select').val())
    currentGooglePlaceObj = place
    $('#review-order-select').change(function(){
        renderReviews(currentGooglePlaceObj,$('#review-order-select').val())
    })
    $('#tweet').click(function(){
        tweet(place.name, place.formatted_address, place.website)
    })
    $('#tweet').prop("disabled", false)
    return
}

var parseYelpMatch = function(jsonResponseObj){
    console.log(jsonResponseObj)
}

function renderReviews(place, sortOrder){
    var arrayClone = JSON.parse(JSON.stringify(place.reviews)) 
    if (sortOrder == "highest_rating"){
        arrayClone.sort(function(x, y){
            if (x.rating == y.rating){
                return 0
            }
            if (x.rating > y.rating){
                return -1
            }
            if (x.rating < y.rating){
                return 1
            }
        }); 
    } else if (sortOrder == "lowest_rating"){
        arrayClone.sort(function(x, y){
            if (x.rating == y.rating){
                return 0
            }
            return x.rating > y.rating
        });
    } else if (sortOrder == "most_recent"){
        arrayClone.sort(function(x, y){
            if (x.time == y.time){
                return 0
            }
            if (x.time > y.time){
                return -1
            }
            if (x.time < y.time){
                return 1
            }
        });
       
    } else if (sortOrder == "least_recent"){
        arrayClone.sort(function(x, y){
            if (x.time == y.time){
                return 0
            }
            return x.time > y.time
        });
    }
    

    var reviewContent = ""
    for (var i=0; i<arrayClone.length; i++){
        var review = arrayClone[i]
        var name = review.author_name
        var url = review.author_url
        var profile_pic = review.profile_photo_url
        var rating = review.rating
        var reviewText = review.text
        var time = formatEpochTime(review.time)
        var timeMargin = -1*((5 - rating)*18 - 10)
        var div =  "<div class='row' style='margin:0px 0px 10px 0px;border:1px solid lightgrey;padding:10px 0px 10px 0px'>"
           div+= "<div class='col-1' style='text-align:center'><a href='" + url + "'><img style='height:50px;width:50px;margin-top:20%' src='" + profile_pic + "'></a></div>"
           div+= "<div class='col-11'>"
               div+= "<div style='color:#007bff'><a href='" + url + "'>" + name + "</a></div>"
               div+= "<span>" + renderRating(rating, "orange") + "</span><span style='margin-left:" + timeMargin + "'>" + time + "</span>"
               div+= "<div>" + reviewText + "</div>"
           div+="</div>"
        div+="</div>" 
        
        reviewContent+=div
    }

    document.getElementById('reviews-list').innerHTML = reviewContent

    //yelp stuff  
    var addressComponents = place.address_components
    var city = state = country = ""
    for (var i = 0; i < addressComponents.length; i++){
        var comp = addressComponents[i]
        if (comp.types[0] == "locality"){
            city = comp.long_name
        } else if (comp.types[0].includes("administrative_area")){
            state = comp.short_name
        } else if (comp.types[0] == "country"){
            country = comp.short_name
        } 
    }
    var requestURL = requestRoute + "?yelp=true&name=" + place.name + "&city=" + city + "&state=" + state + "&country=" + country
    //submitRequest(requestURL, parseYelpMatch) 
}

function formatEpochTime(epochTime){
    var d = new Date(epochTime*1000); 
    var year = d.getFullYear()
    var month = d.getMonth().toString()
    if (month.length == 1){
        month = "0" + month
    }
    var day = d.getDate().toString()
    if (day.length == 1){
        day = "0" + day
    }
    var time = d.getHours() + ":" + d.getMinutes() + ":" + d.getSeconds()
    var text = year + "-" + month + "-" + day + " " + time
    return text
}

function renderMap(place){
    $('#directions-to').val(place.name + ", " + place.formatted_address)
    var tolat = place.geometry.location.lat()
    var tolng = place.geometry.location.lng()
    initMap(tolat, tolng, fromlat, fromlng)
}

function renderPhotos(photos){
    var photosHTML = "<div class='card-columns'>"
    for (var i=0; i < photos.length; i++){
         var smallUrl = photos[i].getUrl({'maxWidth': 300, 'maxHeight': 300})
         var originalUrl = photos[i].getUrl({'maxWidth': photos[i].width, 'maxHeight': photos[i].height})
         
         photosHTML+="<div class='card'><a href='" + originalUrl + "' target='_blank'><img style='width:100%' src='" + smallUrl + "'></a></div>" 
    }
    photosHTML+="</div>"

    if (photos.length == 0){
        photosHTML = "no photos found"
    }    
    $('#photos-content').html(photosHTML)
}

function renderInfo(place){
    var infoContent =  document.getElementById("info-content")

    var table="<table class='info-table'>"
    
    if (place.formatted_address){
        table+="<tr><td><b>Address</b></td><td>" + place.formatted_address + "</td></tr>"
    }

    if (place.international_phone_number){
        table+="<tr><td><b>Phone Number</b></td><td>" + place.international_phone_number + "</td></tr>"
    }

    if (place.price_level){
        table+="<tr><td><b>Price Level</b></td><td>" + renderPriceLevel(place.price_level) + "</td></tr>"
    }

    if (place.rating){
        table+="<tr><td><b>Rating</b></td><td>" + place.rating + renderRating(place.rating, "gold") + "</td></tr>"
    }

    if (place.url){
        table+="<tr><td><b>Google Page</b></td><td><a href=" + place.url + " target='_blank'>" + place.url + "</a></td></tr>"
    }

    if (place.website){
        table+="<tr><td><b>Website</b></td><td><a href=" + place.website + " target='_blank'>" + place.website + "</a></td></tr>"
    }

    if (place.opening_hours){
        table+="<tr><td><b>Hours</b></td><td>" + renderHours(place.utc_offset, place.opening_hours) + "</td></tr>"
    }

    table+="</table>"

    infoContent.innerHTML = table
}

function renderHours(utc_offset, hours){ 
    var days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    var text = "Closed"
    
    var d = new Date();
    var localTime = d.getTime()
    var localOffset = d.getTimezoneOffset() * 60000
    var utc = localTime + localOffset
    var offset = utc_offset/60;   
    var location_time = utc + (3600000*offset)
    var nd = new Date(location_time); 
    var weekday = days[nd.getDay()]
    
    var modalBodyTable = "<table>"
    for (var i=0; i < hours.weekday_text.length; i++){
        var splitArray = hours.weekday_text[i].split(":")
        var day = splitArray[0]
        var hourRange = splitArray[1]
        if (splitArray[2]){
            hourRange+=":" + splitArray[2]
        }
        if (splitArray[3]){
            hourRange+=":" + splitArray[3]
        }
        if (hours.weekday_text[i].includes(weekday)){
            var open_hours = hourRange
            modalBodyTable+="<td><b>" + day + "</b></td>"
            modalBodyTable+= "<td><b>" + hourRange + "</b></td>"
        } else {
            modalBodyTable+="<td>" + day + "</td>"
            modalBodyTable+= "<td>" + hourRange + "</td>"
        }
        modalBodyTable+="</tr>"
    }
    modalBodyTable+="</table>"
    $('#modal-body').html(modalBodyTable)  
 
    if (hours.open_now){
        text="Open now: " + open_hours
    }
    
    return text + "<div id='open-hours-link' data-toggle='modal' data-target='#hoursModal'>Daily open hours</div>" 
}

function renderPriceLevel(priceLevel){
    var dollarSigns = ""
    for (var i=0; i<priceLevel; i++){
        dollarSigns+="$"
    }
    return dollarSigns
}

function renderRating(rating, color){
    var width = 90*(rating/5)
    var goldStars = "<div class='rating-stars' style='width:" + width + "px'><i class='fas fa-star " + color + "-star'></i><i class='fas fa-star " + color + "-star'></i><i class='fas fa-star " + color + "-star'></i><i class='fas fa-star " + color + "-star'></i><i class='fas fa-star " + color + "-star'></i></div>"
    var emptyStars = "<div class='rating-stars'></i><i class='fas fa-star' style='color:transparent'></i><i class='fas fa-star' style='color:transparent'></i><i class='fas fa-star' style='color:transparent'></i><i class='fas fa-star' style='color:transparent'></i><i class='fas fa-star' style='color:transparent'></i></div>"
    return "<div class='ratings-wrapper'>" + goldStars + emptyStars + "</div>"
}


//called when user clicks a row to get business details
function getDetails(id, rowEle){
    $('#tweet').prop("disabled", true)
    $('#results-details-button').prop("disabled", false) 
    $('#results-details-button').click(function(){
        getDetails(id, null)
    })
    $('#favorites-details-button').prop("disabled", false)
    $('#favorites-details-button').click(function(){
        getDetails(id, null)
    })

    if (rowEle){
        selectedRow = rowEle.innerHTML
    }
    selectedId = id
    
    updateFavoriteIcon(isFavorite(selectedId), $('#detail-favorite-button'))

    //document.getElementById("details-wrapper").style.display="block"
    //document.getElementById("results-wrapper").style.display="block"
    $('#details-wrapper').removeClass('ng-hide')
    $('#favorites-wrapper').addClass('ng-hide')
    //submitRequest(requestRoute + "?id=" + id, renderDetails)
    
    var ele = document.getElementById("map-container2")
    var request = {
        placeId: id
    };

    service = new google.maps.places.PlacesService(ele);
    service.getDetails(request, renderDetails)
}

function enableLocation(enable){
    var loc = document.getElementById("location-field")
    loc.disabled = !enable
    if(enable){
        validateLocation(false)
    } else {
        validateKeyword(false)
        $( '#location-field' ).removeClass("error-input")
        $( '#location-error' ).hide()
    }
}

function clearAll(){
    hasSearched = false
    resultsClicked()
    clearForm()
    clearBottomArea()
}

function clearForm(){
    document.getElementById("search-button").disabled = true
    document.getElementById("keyword").value = ""
    document.getElementById("category").value = "default"
    document.getElementById("distance").value = ""
    document.getElementById("my-location").checked = true
    document.getElementById("location-field").disabled = true
    document.getElementById("location-field").value = ""
}
function clearBottomArea(){
    previousPages = []
    bottomElementsIdList.forEach(function(e){
        var element = document.getElementById(e)
        $(element).addClass("ng-hide")
    })
}

function displayError(section, type, text){
    if (type && text){
        var error = "<div class='alert alert-" + type + "' >" + text + "</div>"  
        document.getElementById(section + "-error").innerHTML = error
    }

    $('#' + section + '-error').show()
    $('#' + section + '-nav').hide()
    $('#' + section).hide()
}

function clearError(section){
    $('#' + section + '-error').hide()
    $('#' + section + '-nav').show()
    $('#' + section).show()
}

//googlemaps section
var mapDiv = document.getElementById('map-container')
var routesDiv = document.getElementById('directions-container')
var directionsDisplay = directionsService = ""
var fromLat = fromLong = toLat = toLong = 0
function initMap(tolat, tolong, fromlat, fromlong){
    fromLat = fromlat
    fromLong = fromlong
    toLat = tolat
    toLong = tolong

    directionsDisplay = new google.maps.DirectionsRenderer
    directionsService = new google.maps.DirectionsService
    var loc = {lat: tolat, lng: tolong};
    var map = new google.maps.Map(mapDiv, {
        zoom: 12,
        center: loc
    });
    directionsDisplay.setMap(map)
    directionsDisplay.setPanel(routesDiv);
    var marker = new google.maps.Marker({
        position: loc,
        map: map
    });
  
    //var panorama = new google.maps.StreetViewPanorama(
    //  document.getElementById('streetview-container'), {
    //    position: loc
    //  });
}

function calculateAndDisplayRoute() {
    var travelMode = $('#directions-select').val()
    var originObj = {lat: parseFloat(fromLat), lng: parseFloat(fromLong)}
    if ($('#directions-from').val() != "Your location"){
        originObj = $('#directions-from').val()
    }  
    directionsService.route({
        origin: originObj,
        destination: {lat: toLat, lng: toLong},
        travelMode: google.maps.TravelMode[travelMode],
        provideRouteAlternatives: true
    }, function(response, status) {
        if (status == 'OK') {
            directionsDisplay.setDirections(response);
        } else {
            window.alert('Google\'s response to your directions request: ' + status);
        }
    });
}

function toggleStreetView(){
    $('#streetview-container').toggle()
    $('#map-container').toggle()
    if ($('#streetview-container').is(":visible")){
        var loc = {lat: toLat, lng: toLong};
        var panorama = new google.maps.StreetViewPanorama(
            document.getElementById('streetview-container'), {
                position: loc
        });

        $('#street-view-toggle').attr("src","images/Map.png")
    } else {
        $('#street-view-toggle').attr("src","images/Pegman.png")
    }
}
function favoritesClicked(){
    //switch active button
    favoritesButtonActive()

    //hide details and results, show favorites
    renderFavorites()
}

function renderFavorites(){
    if (typeof(Storage) !== "undefined") {      
        var length = localStorage.length
        var table = ""
        if (length > 0) {
            var rowIndex = 0
            table += "<table>"
            table+=getTableHeadersHTML()
            for (var key in localStorage) {
                if (rowIndex >= length){
                    break
                }
                //console.log(localStorage.length)
                table+=localStorage[key]
                rowIndex++
            }
            table+="</table>"
            $('#favorites').html(table)
            $('#favorites').find('.fav').html("<i class='fas fa-trash-alt'></i>")
            $('#favorites').find('.fav').attr("onclick","deleteFavorite(event)");
            
            //renumber
            var rowIndex = 0
            $("#favorites").find('table tr').each(function(){
                var id = $(this).attr('id')
                var row = $(this)
                $(this).find('.rownum').html(rowIndex)
                $(this).find('.detail-btn').click(function(){
                    getDetails(id, row)    
                })
                rowIndex++
            })
            clearError("favorites")
            showElement("favorites")
        } else {
            displayError('favorites', 'warning', noFavoritesError)
            showElement("favorites")
        }
    } else {
        alert("Local storage is not supported in your browser.")
    }
}

function resultsClicked(){
    resultsButtonActive()
    if (hasSearched){
        showElement("results")
    } else {
        clearBottomArea()
    }
}

function resultsButtonActive(){
    $( '#favorites-button' ).attr('class', 'btn btn-unselected')
    $( '#results-button' ).attr('class', 'btn btn-primary')
}
function favoritesButtonActive(){
    $( '#results-button' ).attr('class', 'btn btn-unselected')
    $( '#favorites-button' ).attr('class', 'btn btn-primary')
}

function favoriteButtonAction(event){
    var row = event.target.closest('tr')
    var rowHTML = "<tr id=" + row.id + ">" + row.innerHTML + "</tr>"
    var id = row.id
    
    var added = storeData(id, rowHTML)
    var stardiv = $(row.getElementsByTagName('div')[0])
    updateFavoriteIcon(added, stardiv)
}
function favoriteButtonAction2(event){
    var rowHTML = "<tr id=" + selectedId + ">" + selectedRow + "</tr>"
    var added = storeData(selectedId, rowHTML)
    updateFavoriteIcon(added, $(event.target))
}

//also updates the active row background color
function updateFavoriteIcons(id){
    if ($('#results-button').hasClass("btn-unselected")){
        id = "favorites"
        $('#results-wrapper').delay(1000).addClass("ng-hide")
    } else {
        $('#favorites-wrapper').delay(1000).addClass("ng-hide")
    }


    if (id == "results"){
        $("#results").find('table').find('tr').each(function(){
            var rowid = $(this).attr('id')

            $(this).css("background-color", "transparent")
            if (rowid == selectedId){
                 $(this).css("background-color", "#fedf96")
            }

            var stardiv = this.getElementsByTagName('div')[0]
            if (stardiv){ 
                //stardiv will be undefined for row 0 (header)
                var isFav = isFavorite(rowid)
                updateFavoriteIcon(isFav, $(stardiv))
            }
        })
    } else if (id == "favorites"){
        $("#favorites").find('table').find('tr').each(function(){
            var rowid = $(this).attr('id')

            $(this).css("background-color", "transparent")
            if (rowid == selectedId){
                 $(this).css("background-color", "#fedf96")
            }
        })
    }
}
//stardiv is a jquery obj
function updateFavoriteIcon(isFavorite, stardiv){
    if (stardiv.prop("tagName") == "svg"){
        stardiv = stardiv.parent() //dirty
    }
    if (stardiv.prop("tagName") == "path"){
        stardiv = stardiv.parent().parent() //so dirty it hurts
    }
    if (isFavorite){
        if (!stardiv.hasClass('gold-star')){
            stardiv.addClass('gold-star')
        }
        stardiv.find('svg').attr('data-prefix', 'fas')
    } else {
        stardiv.removeClass('gold-star')
        stardiv.find('svg').attr('data-prefix', 'far') 
    }
}

function isFavorite(id){
    var rowIndex = 0
    var length = localStorage.length
    for (var key in localStorage) {
        if (rowIndex > length){
            break
        }
        if (key == id){
            return true
        }
        rowIndex++
    }
    return false
}

function deleteFavorite(event){
    var row = event.target.closest('tr')
    var rowHTML = "<tr id=" + row.id + ">" + row.innerHTML + "</tr>"
    var id = row.id
    var added = storeData(id, rowHTML)
    if (!added){
        $(row).remove()
    }
    if ($('#favorites').find('table tr').length == 1){
        displayError("favorites", "warning", noFavoritesError)
    }
}

/* storage methods start */
//adds or removes favorites if they already are favorited
function storeData(key, data){
    if (typeof(Storage) !== "undefined") {
        if (localStorage.getItem(key)){
            localStorage.removeItem(key)
            return false
        }
        localStorage.setItem(key, data)
        
        var index = 0
        var length = localStorage.length
        for (var key in localStorage) {
            //console.log(localStorage.length);
            index++
            if (index >= length){
                break
            }
        }
    } else {
        alert("Local storage is not supported in your browser.")
    }
    return true
}

function clearStorage(){
    if (typeof(Storage) !== "undefined") {
        localStorage.clear()    
    }
}
/* storage methods end */

/* validation start */
$( '#keyword' ).keyup(function(){
    validateKeyword(true)
})
$( '#location-field' ).keyup(function(){
    validateLocation(true)
})

function validateKeyword(showError){
    var myLocation = document.getElementById("my-location")
    if (/[a-zA-Z0-9]/.test($( '#keyword' ).val())){
        $( '#search-button' ).prop( "disabled", false );
        $( '#keyword' ).removeClass("error-input")
        $( '#keyword-error' ).hide()
    } else {
        $( '#search-button' ).prop( "disabled", true );
        if ($( '#keyword' ).val() != "" && showError){
            if (!$( '#keyword' ).hasClass("error-input")){
                $( '#keyword' ).addClass("error-input")
            }
            $( '#keyword-error' ).show()
        }
    }
}

function validateLocation(showError){   
    if (/[a-zA-Z0-9]/.test($( '#location-field' ).val()) && /[a-zA-Z0-9]/.test($( '#keyword' ).val())){
        $( '#search-button' ).prop( "disabled", false );
    }
    if (/[a-zA-Z0-9]/.test($( '#location-field' ).val())){
        $( '#location-field' ).removeClass("error-input")
        $( '#location-error' ).hide()
    } else {
        $( '#search-button' ).prop( "disabled", true );
        if ($( '#location-field' ).val() != "" && showError){
            if (!$( '#location-field' ).hasClass("error-input")){
                $( '#location-field' ).addClass("error-input")
            }
            $( '#location-error' ).show()
        }
    }
}
/* validation end */

/* google auto complete */
function setGoogleAutocomplete(lati, long){
    var type = $('#category').find(":selected").val();
    var input = document.getElementById('location-field');
    var input2 = document.getElementById('directions-from');
    var distance = $('#distance').val()
    if (distance == ""){
        distance = 10
    }
    var geolocation = {
        lat: lati,
        lng: long
    }
    var circle = new google.maps.Circle({
        center: geolocation,
        radius: distance
      });

    var options = {
        bounds: circle.getBounds(),
    }
    if (type != "default"){
        options.types = [type]
    }
    autocomplete = new google.maps.places.Autocomplete(input, options);
    autocomplete2 = new google.maps.places.Autocomplete(input2, options);
}
/* google auto complete */

/* misc helpers start*/
function getTableHeadersHTML(){
    return "<tr><th>#</th><th style='width:5%'>Category</th><th>Name</th><th>Address</th><th>Favorite</th><th>Details</th></tr>"
}

//if you know if there is an error or not, you can specify true/false. If you leave null, the element will be shown as it was
function showElement(id){
    //shows desired element and hides the others
    bottomElementsIdList.forEach(function(e){
        var element = document.getElementById(e)
        if (e == id + "-wrapper"){
            $(element).removeClass("ng-hide")
            updateFavoriteIcons(id)
        } else {
            $(element).addClass("ng-hide")
        }
    })
}

function tweet(name, address, website){
    var text = "Check out " + name + " at " + address + ". Website: " + website
    var url = "https://twitter.com/intent/tweet?text=" + text
    var width = 400
    var height = 400
    var left = (screen.width/2)-(width/2);
    var top = (screen.height/2)-(height/2); 
    window.open(url,'popUpWindow','top=' + top + ',left=' + left + ',height=400,width=400,scrollbars=yes'); return false;
}
/* misc helpers end */
