<html>
<head>
    <title>CS571 Homework 6</title>
    <meta http-equiv="Content-Type" content="text/html;charset=ISO-8859-1">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <link rel="stylesheet" href="https://maxcdn.bootstrapcdn.com/bootstrap/4.0.0/css/bootstrap.min.css" integrity="sha384-Gn5384xqQ1aoWXA+058RXPxPg6fy4IWvTNh0E263XmFcJlSAwiGgFAW/dAiS6JXm" crossorigin="anonymous">
    <link type="text/css" href="css/main.css" rel="stylesheet">
    <link rel="icon" type="image/x-icon" href="https://angular.io/assets/images/favicons/favicon.ico">
    <script defer src="https://use.fontawesome.com/releases/v5.0.8/js/all.js" integrity="sha384-SlE991lGASHoBfWbelyBPLsUlwY1GwNDJo3jSJO04KZ33K2bwfV9YBauFfnzvynJ" crossorigin="anonymous"></script>
    <script src="https://ajax.googleapis.com/ajax/libs/angularjs/1.4.0-beta.5/angular.min.js"></script>
    <script src="https://ajax.googleapis.com/ajax/libs/angularjs/1.4.0-beta.5/angular-animate.min.js"></script>
</head>
<body ng-app="app" ng-controller="details">
<div class="col-md-7" style="margin:auto;">
    <div id="search-form-div">
        <h4 style="margin:0;text-align:center">Travel and Entertainment Search</h4><br>
        
        <form id="searchForm" class="container">
            <div class="form-group row">
                <label class="col-sm-3">Keyword<span class="required">*</span></label>
                <input id="keyword" class="form-control col-sm-9" type="text" name="keyword" required><br>
                <div id="keyword-error" class="row error-wrapper" style="display:none">
                    <div class="col-sm-3"></div>
                    <div class="col-sm-9 error-text">Please enter a keyword.</div>
                </div>
            </div>
            <div class="form-group row">
                <label class="col-md-3" for="category">Category</label>    
                <select onchange="setGoogleAutocomplete()" id="category" class="form-control form-input col-12 col-md-6" name="category">
                    <option value="default">Default</option>
                    <option value="airport">Airport</option>
                    <option value="amusement_park">Amusement Park</option>
                    <option value="aquarium">Aquarium</option>
                    <option value="art_gallery">Art Gallery</option>
                    <option value="bakery">Bakery</option>
                    <option value="bar">Bar</option>
                    <option value="beauty_salon">Beauty Salon</option>
                    <option value="bowling_alley">Bowling Alley</option>
                    <option value="bus_station">Bus Station</option>
                    <option value="cafe">Cafe</option>
                    <option value="campground">Campground</option>
                    <option value="car_rental">Car Rental</option>
                    <option value="casino">Casino</option>
                    <option value="lodging">Lodging</option>
                    <option value="movie_theater">Movie Theater</option> 
                    <option value="museum">Museum</option>
                    <option value="night_club">Night Club</option>
                    <option value="park">Park</option>
                    <option value="parking">Parking</option>
                    <option value="restaurant">Restaurant</option>
                    <option value="shopping_mall">Shopping Mall</option>
                    <option value="stadium">Stadium</option>
                    <option value="subway_station">Subway Station</option>
                    <option value="taxi_stand">Taxi Stand</option>
                    <option value="train_station">Train Station</option>
                    <option value="transit_station">Transit Station</option>
                    <option value="travel_agency">Travel Agency</option>
                    <option value="zoo">Zoo</option>
                </select><br>
            </div>

            <div class="form-group row">
                <label class="col-md-3" for="distance">Distance (miles)</label>
                <input id="distance" class="form-control col-12 col-md-6" type="text" name="distance" placeholder="10">
            </div>

            <div class="form-group row"> 
                <label class="col-md-3" style="vertical-align: top" for="radio-select">From<span class="required">*</span></label>
                <div id="radio-select" class="col-md-9" style="padding:0px">
                    <input onclick="enableLocation(false)" id="my-location" type="radio" name="from" value="" checked> Current location<br>
                    <input onclick="enableLocation(true)" id="custom-location" type="radio" name="from" value=""> Other. Please Specify:<br>
                    <input class="form-control col-11 col-md-11" style="margin-left: 15px; max-width:95%" id="location-field" type="text" name="from" placeholder="Enter a Location" disabled required>
                    
                    <div id="location-error" class="row error-wrapper" style="margin-left:15px;display:none">
                        <div class="error-text">Please enter a location.</div>
                    </div>
                
                </div><br>
            </div>
            <div ng-click="details.showDetails = false" id="button-div" class="form-group row"><button id="search-button" class="btn btn-primary" type="button" onclick="search()" disabled><i class="fas fa-search"></i> Search</button><button id="clear-button" class="btn btn-light" type="button" onclick="return clearAll()">Clear</button></div>
        </form>

    </div>
</div>
<div id="results-favs">
    <button onclick="resultsClicked()" ng-click="details.showDetails = false" type="button" id="results-button" class="btn btn-primary">Results</button>
    <button onclick="favoritesClicked()" type="button" id="favorites-button" class="btn btn-unselected">Favorites</button>
</div>

<div id="bottom-area" class="col-md-10">

    <div id="progress-outer" class="progress" style="display:none;">
        <div id="progress-inner" class="progress-bar progress-bar-striped" role="progressbar" aria-valuenow="0" aria-valuemin="0" aria-valuemax="100"></div>
    </div>

    <div id="favorites-wrapper">
        <div id="favorites-error" class="records-error"></div>

        <div id="favorites-nav" class="nav-bar">
            <div class="right-nav">
                <button id="favorites-details-button" ng-click='details.showDetails = true' type="button" class="btn btn-light navbutton" disabled>Details <i class="fas fa-chevron-right"></i></button>
            </div>
        </div>

        <div id="favorites"></div>
    </div>

    <div ng-show="!details.showDetails" id="results-wrapper" class="ng-hide">
        <div id="results-error" class="records-error"></div>
        <div id="results-nav" class="nav-bar">
            <div class="right-nav">
                <button id="results-details-button" ng-click='details.showDetails = true' type="button" class="btn btn-light navbutton" disabled>Details <i class="fas fa-chevron-right"></i></button>
            </div>
        </div>

        <div id="results">
            <table>
                <tr><th>#</th><th style='width:5%'>Category</th><th>Name</th><th>Address</th><th>Favorite</th><th>Details</th></tr>
                
                <tr><td class="rownum"></td><td></td><td></td><td></td><td></td>
                <td><div ng-click='details.showDetails = true' class='table-button detail-btn'><i class='fas fa-chevron-right'></i></div></td></tr>
                
                <tr><td class="rownum"></td><td></td><td></td><td></td><td></td>
                <td><div ng-click='details.showDetails = true' class='table-button detail-btn'><i class='fas fa-chevron-right'></i></div></td></tr>
 
                <tr><td class="rownum"></td><td></td><td></td><td></td><td></td>
                <td><div ng-click='details.showDetails = true' class='table-button detail-btn'><i class='fas fa-chevron-right'></i></div></td></tr>

                <tr><td class="rownum"></td><td></td><td></td><td></td><td></td>
                <td><div ng-click='details.showDetails = true' class='table-button detail-btn'><i class='fas fa-chevron-right'></i></div></td></tr>

                <tr><td class="rownum"></td><td></td><td></td><td></td><td></td>
                <td><div ng-click='details.showDetails = true' class='table-button detail-btn'><i class='fas fa-chevron-right'></i></div></td></tr>

                <tr><td class="rownum"></td><td></td><td></td><td></td><td></td>
                <td><div ng-click='details.showDetails = true' class='table-button detail-btn'><i class='fas fa-chevron-right'></i></div></td></tr>

                <tr><td class="rownum"></td><td></td><td></td><td></td><td></td>
                <td><div ng-click='details.showDetails = true' class='table-button detail-btn'><i class='fas fa-chevron-right'></i></div></td></tr>

                <tr><td class="rownum"></td><td></td><td></td><td></td><td></td>
                <td><div ng-click='details.showDetails = true' class='table-button detail-btn'><i class='fas fa-chevron-right'></i></div></td></tr>

                <tr><td class="rownum"></td><td></td><td></td><td></td><td></td>
                <td><div ng-click='details.showDetails = true' class='table-button detail-btn'><i class='fas fa-chevron-right'></i></div></td></tr>

                <tr><td class="rownum"></td><td></td><td></td><td></td><td></td>
                <td><div ng-click='details.showDetails = true' class='table-button detail-btn'><i class='fas fa-chevron-right'></i></div></td></tr>

                <tr><td class="rownum"></td><td></td><td></td><td></td><td></td>
                <td><div ng-click='details.showDetails = true' class='table-button detail-btn'><i class='fas fa-chevron-right'></i></div></td></tr>

                <tr><td class="rownum"></td><td></td><td></td><td></td><td></td>
                <td><div ng-click='details.showDetails = true' class='table-button detail-btn'><i class='fas fa-chevron-right'></i></div></td></tr>

                <tr><td class="rownum"></td><td></td><td></td><td></td><td></td>
                <td><div ng-click='details.showDetails = true' class='table-button detail-btn'><i class='fas fa-chevron-right'></i></div></td></tr>

                <tr><td class="rownum"></td><td></td><td></td><td></td><td></td>
                <td><div ng-click='details.showDetails = true' class='table-button detail-btn'><i class='fas fa-chevron-right'></i></div></td></tr>

                <tr><td class="rownum"></td><td></td><td></td><td></td><td></td>
                <td><div ng-click='details.showDetails = true' class='table-button detail-btn'><i class='fas fa-chevron-right'></i></div></td></tr>

                <tr><td class="rownum"></td><td></td><td></td><td></td><td></td>
                <td><div ng-click='details.showDetails = true' class='table-button detail-btn'><i class='fas fa-chevron-right'></i></div></td></tr>

                <tr><td class="rownum"></td><td></td><td></td><td></td><td></td>
                <td><div ng-click='details.showDetails = true' class='table-button detail-btn'><i class='fas fa-chevron-right'></i></div></td></tr>

                <tr><td class="rownum"></td><td></td><td></td><td></td><td></td>
                <td><div ng-click='details.showDetails = true' class='table-button detail-btn'><i class='fas fa-chevron-right'></i></div></td></tr>

                <tr><td class="rownum"></td><td></td><td></td><td></td><td></td>
                <td><div ng-click='details.showDetails = true' class='table-button detail-btn'><i class='fas fa-chevron-right'></i></div></td></tr>

                <tr><td class="rownum"></td><td></td><td></td><td></td><td></td>
                <td><div ng-click='details.showDetails = true' class='table-button detail-btn'><i class='fas fa-chevron-right'></i></div></td></tr>
            </table>
            <div class='table-page-button-wrapper'>
               <button onclick="showPreviousPage()" type="button" class="btn btn-light navbutton" id="previous-page-button">Previous</button>
               <button type="button" class="btn btn-light navbutton" id="next-page-button" disabled>Next</button>
            </div>
        </div>
    </div>

    <div ng-show="details.showDetails" id="details-wrapper">
        <h4 id="detail-title"></h4>
        <div id="details-nav" class="nav-bar">
            <div onclick="updateFavoriteIcons('results')" class="left-nav" ng-click='details.showDetails = false' style="display:inline-block!important">
                <button type="button" class="btn btn-light navbutton"><i class="fas fa-chevron-left"></i> List</button>
            </div>
            <div class="right-nav">
                <div onclick='favoriteButtonAction2(event)' id="detail-favorite-button" class='table-button' style="display:inline-block"><i class='far fa-star'></i></div>
                <div id="tweet" class="table-button" style="background-color:#2890ff;color:white;display:inline-block"><i class="fab fa-twitter"></i></div>
            </div>
        </div>

        <div id="details">
            <ul class="nav nav-tabs justify-content-end" id="myTab" role="tablist">
                <li class="nav-item">
                    <a class="nav-link active" id="info-tab" data-toggle="tab" href="#info-content" role="tab" aria-controls="info" aria-selected="true">Info</a>
                </li>
                <li class="nav-item">
                    <a class="nav-link" id="photos-tab" data-toggle="tab" href="#photos-content" role="tab" aria-controls="photos" aria-selected="false">Photos</a>
                </li>
                <li class="nav-item">
                    <a class="nav-link" id="map-tab" data-toggle="tab" href="#map-content" role="tab" aria-controls="map" aria-selected="false">Map</a>
                </li>
                <li class="nav-item">
                    <a class="nav-link" id="reviews-tab" data-toggle="tab" href="#reviews-content" role="tab" aria-controls="reviews" aria-selected="false">Reviews</a>
                </li>
            </ul>
            <div class="tab-content" id="myTabContent">
                <div class="tab-pane fade show active" id="info-content" role="tabpanel" aria-labelledby="info-tab">Loading...</div>
                <div class="tab-pane fade" id="photos-content" role="tabpanel" aria-labelledby="photos-tab">Loading...</div>
                <div class="tab-pane fade" id="map-content" role="tabpanel" aria-labelledby="map-tab">
                    <div class="row" style="margin-right:0px; margin-left:0px">
                        <div class="col-4">From</div><div class="col-4">To</div><div class="col-2">Travel Mode</div><div class="col-2"></div>
                    </div>
                    <div class="row" style="margin-right:0px; margin-left:0px">
                        <div style="padding-left:0px!important" class="col-4"><input style="font-size:10px" class="form-control" type="text" id="directions-from" value="Your location"></div>
                        <div class="col-4"><input style="font-size:10px;font-weight:bold" class="form-control" type="text" id="directions-to" disabled></div>
                        <div class="col-2"><select style="font-size:10px;height:28px;padding:0px" id="directions-select" class="form-control">
                            <option value="DRIVING">Driving</option>
                            <option value="BICYCLING">Bicycling</option>
                            <option value="TRANSIT">Transit</option>
                            <option value="WALKING">Walking</option>
                        </select></div>  
                        <div style="text-align:center;padding-right:0px!important" class="col-2"><button onclick="calculateAndDisplayRoute()" style="font-size:10px" type="button" id="get-directions-button" class="btn btn-primary">Get Directions</button></div>
                    </div>
                    <button onclick="toggleStreetView()" type="button" class="btn streetview-btn"><img id="street-view-toggle" style="width:40px" src="images/Pegman.png"></button>
                    <div id="map-container"></div>
                    <div id="streetview-container"></div>
                    <div id="directions-container"></div>
                </div>
                <div class="tab-pane fade" id="reviews-content" role="tabpanel" aria-labelledby="reviews-tab">
                    <div class="row">
                        <select id="reviews-select" class="col-2 form-control reviews-select">
                            <option value="google">Google Reviews</option>
                            <option value="yelp">Yelp Reviews</option>
                        </select>

                        <select id="review-order-select" class="col-2 form-control reviews-select">
                            <option value="default">Default Order</option>
                            <option value="highest_rating">Highest Rating</option>
                            <option value="lowest_rating">Lowest Rating</option>
                            <option value="most_recent">Most Recent</option>
                            <option value="least_recent">Least Recent</option>
                        </select>     
                    </div>
                    <div id="reviews-list"></div>
                </div>
            </div>
        </div>
    
    <div id="map-container2" style="height:300px; width:400px; position:absolute; display:none">
        <div id="travelmode-container">
            <div onclick="calculateAndDisplayRoute('WALKING')" class="travelmode">Walk there</div>
            <div onclick="calculateAndDisplayRoute('BICYCLING')" class="travelmode">Bike there</div>
            <div onclick="calculateAndDisplayRoute('DRIVING')" class="travelmode">Drive there</div>
        </div>
        <div id="map"></div>
    </div>
</div> <!-- details wrapper end -->
</div> <!-- bottom area end -->
<!-- Modal -->
  <div class="modal fade" id="hoursModal" role="dialog">
    <div class="modal-dialog">
    
      <!-- Modal content-->
      <div class="modal-content">
        <div class="modal-header">
          <button type="button" class="close" data-dismiss="modal">&times;</button>
          <h5 class="modal-title">Open hours</h5>
        </div>
        <div id="modal-body" class="modal-body">
          <p>Hours of operation could not be displayed.</p>
        </div>
        <div class="modal-footer">
          <button type="button" class="btn btn-default" data-dismiss="modal">Close</button>
        </div>
      </div>
      
    </div>
  </div>
</div>

</body>

<script type="text/javascript" src="https://maps.googleapis.com/maps/api/js?key=AIzaSyBY93OHlRHAuObYkHXPvYP7hrE7zWtzxKw&libraries=places"></script>
<script src="https://ajax.googleapis.com/ajax/libs/jquery/3.3.1/jquery.min.js"></script>
<script src="js/bootstrap.min.js"></script>
<script src="js/main.js"></script>
</html> 
