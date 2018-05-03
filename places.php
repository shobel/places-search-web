<?php

$placesURL = "https://maps.googleapis.com/maps/api/place/nearbysearch/json?";
$detailsURL = "https://maps.googleapis.com/maps/api/place/details/json?";
$photoURL = "https://maps.googleapis.com/maps/api/place/photo?";
$myGooglePlacesAPIKey = "AIzaSyDn4RY-uUcD_1Uama_JDYO_bzttRVVZnZc";
$myYelpAPIKey = "jbAhJeUNfdBQdhFqRfO9IdDsPk9azuqloJ7__HV89wU73kQ-BHGZ12Si6Ob9zI6MGf29bpuB4f8DBGGX7QMVptZT5XG96NLNC8o6hyC4D_tQTZGkqJjsQNMqRrvPWnYx";
$yelpURL = "https://api.yelp.com/v3/businesses/search?";

//handles all responses from client: message needs to be a json response
function sendResponse($message){
    echo $message;
    exit();
}

if (!empty($_GET)){
    if (isset($_GET['id'])){
        //ask google for the details
        $detailResponse = file_get_contents($detailsURL . "placeid=" . $_GET['id'] . "&key=" . $myGooglePlacesAPIKey);
        sendResponse($detailResponse);
    } else if (isset($_GET['keyword'])){
        //ask google for nearby places
        $keyword = preg_replace('/\s+/', '+', $_GET['keyword']);
        $type = $_GET['category'];
        $radius = handleDistance($_GET['distance']);
        $location = handleFrom($myGooglePlacesAPIKey);
        $request = $placesURL . "location=" . $location . "&radius=" . $radius . "&type=" . $type . "&keyword=" . $keyword . "&key=" . $myGooglePlacesAPIKey;
        $results["mylocation"] = $location;
        submitNearbyPlacesRequest($request, $results);
    } else if (isset($_GET['page'])){
        $request = $placesURL . "pagetoken=" . $_GET['page'] . "&key=" . $myGooglePlacesAPIKey;
        $results = [];
        submitNearbyPlacesRequest($request, $results);
    } else if (isset($_GET['yelplat'])){
        $yelplat = $_GET['yelplat'];
        $yelplon = $_GET['yelplon'];
        $yelpterm = $_GET['yelpterm'];
        $yelptermFormatted = preg_replace('/\s+/', '+', $yelpterm);
        $yelplimit = $_GET['yelplimit'];
        $url = "https://api.yelp.com/v3/businesses/search?"."latitude=".$yelplat."&longitude=".$yelplon."&term=".$yelptermFormatted."&limit=".$yelplimit;

        $yelpSearchResult = requestYelpData($url);
        //sendResponse($yelpSearchResult);

        $yelpSearchObj = json_decode($yelpSearchResult);
        $businesses = $yelpSearchObj->businesses;

        $yelpReviewsResponse = '{"reviews":[]}';
        if (!empty($businesses)) {
            $business = $businesses[0];
            $name = $business->name;
            $id = $business->id;
            $requestNameStripped = strtolower(str_replace(' ','',$yelpterm));
            $yelpResultStripped = strtolower(str_replace(' ','',$name));
            //print("yelpresult: " . $yelpResultStripped . "<br>requestname: " . $requestNameStripped . "<br>");
            if (strpos($requestNameStripped, $yelpResultStripped) !== false || strpos($yelpResultStripped, $requestNameStripped) !== false){
                $reviewsUrl = "https://api.yelp.com/v3/businesses/" . $id . "/reviews";
                $response = requestYelpData($reviewsUrl);
                if (!empty($response)){
                    $yelpReviewsResponse = $response;
                }
            }
        }
        sendResponse($yelpReviewsResponse);
    }
}

function requestYelpData($request){
    global $myYelpAPIKey;
    $opts = [
            "http" => [
                "method" => "GET",
                "header" => "Authorization: Bearer " . $myYelpAPIKey
            ]
        ];
    $context = stream_context_create($opts);
    return file_get_contents($request, false, $context);
}

function submitNearbyPlacesRequest($request, $results){
    $nearbyPlacesJSON = file_get_contents($request);
    $obj = json_decode($nearbyPlacesJSON);

    $results["results"] = extractData($obj);
    if (isset($obj->next_page_token)){
        $results["nextPageToken"] = $obj->next_page_token;
    }
    sendResponse(json_encode($results));
}

function extractData($jsonObj){
    $resultsArray = [];
    if (empty($jsonObj->results)){
        return $resultsArray;
    }
    $results = $jsonObj->results;
    foreach ($results as $result){
        $resultArray = [];
        $resultArray["lat"] = $result->geometry->location->lat;
        $resultArray["lng"] = $result->geometry->location->lng;
        $resultArray["icon"] = $result->icon;
        $resultArray["place_id"] = $result->place_id;
        $resultArray["name"] = $result->name;
        $resultArray["vicinity"] = $result->vicinity;
        $resultsArray[] = $resultArray; //add this result to the array of all results 
    }
    return $resultsArray;
}

function getReviews($jsonObj){
    $reviewsArray = [];
    if (empty($jsonObj->result->reviews)){
        return $reviewsArray;
    }
    $reviewsJson = $jsonObj->result->reviews;
    $i = 0;
    foreach ($reviewsJson as $reviewJson){
        $reviewArray = [];
        $reviewArray["author"] = $reviewJson->author_name;
        $reviewArray["photo"] = $reviewJson->profile_photo_url;
        $reviewArray["review"] = $reviewJson->text;
        $reviewsArray[] = $reviewArray; //add this review to the array of 5 reviews
        $i++;
        if ($i >= 5){break;}
    }
    return $reviewsArray;

}

function downloadPics($jsonObj){
    $savedImages = [];
    if (empty($jsonObj->result->photos)){
        return $savedImages;
    }
    $pics = $jsonObj->result->photos;
    $i = 0;
    foreach ($pics as $pic){
        $reference = $pic->photo_reference;
        $binaryImage =  file_get_contents($GLOBALS['photoURL'] . "maxwidth=1000&photoreference=" . $reference . "&key=" . $GLOBALS['myGooglePlacesAPIKey']);
        $filename = "photo_" . $i . ".png";
        $ret = file_put_contents($filename, $binaryImage);
        if ($ret){
            $savedImages[] = $filename;
        }
        $i++;
        if ($i >= 5){break;}
    }
    return $savedImages;
}

function handleDistance($distance){
    //have to convert miles to meters
    $miles = 10; //default
    if (!empty($distance)){
        $miles = $distance;
    }
    return $miles/0.00062137;
}

function handleFrom($key){
    if ($_GET['from'] != "Here"){
        //get coords of custom location
        $formattedSearch=preg_replace('/\s+/', '+', $_GET['from']);
        $coords = getCoords($formattedSearch, $key);
        return $coords;
    }
    return $_GET['from'];
}

function getCoords($address, $key){
    //https://maps.googleapis.com/maps/api/geocode/json?address=University+of+Southern+California+CA&key=YOUR_API_KEY
    //https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=34.0223519,-118.285117&radius=16090&type=cafe&keyword=usc&key= YOUR_API_KEY
    $searchString="https://maps.googleapis.com/maps/api/geocode/json?address=" . $address . "&key=" . $key;
    $data=file_get_contents($searchString);
    $jsonResponse = json_decode($data);
    if ($jsonResponse && $jsonResponse->results){
        $loc = $jsonResponse->results[0]->geometry->location;
        return $loc->lat . "," . $loc->lng;
    }
    return null;
}
?>
