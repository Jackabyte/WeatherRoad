async function initMap(){

    //Automatically center's the map to the user's current location on load.
    if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
     (position) => {
     var options = {
       zoom:15,
       center:{lat:position.coords.latitude,lng:position.coords.longitude},
       mapTypeId: "roadmap",
     }
     
     //Creating the map using the definied options from above
     var map = new google.maps.Map(document.getElementById('map'), options);
     
     
  
     /**
      * Next block of code calculates and creates a popup of the current position
      */
  
     //Creating a popup info window
     infoWindow = new google.maps.InfoWindow();
  
     //Creates a button, positions it in the top center
     const locationButton = document.createElement("button");
     locationButton.textContent = "Pan to Current Location";
  
     //When button is pushed execute the following code, which get's the current cordinates
     locationButton.addEventListener("click", () => {
       //Check if geolocation is possible on user's browser
       if (navigator.geolocation) {
         //USe "watchPosition" to continuosuly track the location
         //get's the current location of the user
         navigator.geolocation.getCurrentPosition(
           (position) => {
             const pos = {
               lat: position.coords.latitude,
               lng: position.coords.longitude,
             };
             
             //Creates a new infowindow where the user's current location is.
             infoWindow.setPosition(pos);
             infoWindow.setContent("Location found.");
             infoWindow.open(map);
  
             //Adjusts the map so the center is now at the user's current location.
             map.setCenter(pos);
           },
           () => {
             //Error handler to see if the Geolocation service has failed due to unknown reasons
             handleLocationError(true, infoWindow, map.getCenter());
           }
         );
       } else {
         // Browser doesn't support Geolocation
         handleLocationError(false, infoWindow, map.getCenter());
       }
     });
     
     
     new AutocompleteDirectionsHandler(map);
     
   },
   () => {
     //Error handler to see if the Geolocation service has failed due to unknown reasons
     handleLocationError(true, infoWindow, map.getCenter());
   }
  );
  } else {
  // Browser doesn't support Geolocation
  handleLocationError(false, infoWindow, map.getCenter());
  }
   }
   
  //Function to get the weather data of the planned location(s)
  function getWeatherData(map, locID, legDestDuration, WeatherArray, service, MarkerArray){
       
  const API_KEY = '21917a0e0803572232357c75d94699c0';
  
       let lat = locID.location.lat();
       let lng = locID.location.lng();
  
     fetch(`https://pro.openweathermap.org/data/2.5/forecast/hourly?lat=${lat}&lon=${lng}&appid=${API_KEY}&units=metric`)
     
   .then(res => res.json())
   .then(data => {
    console.log(data);
    
     let minDifference = [];
       for(let i = 0; i < data.list.length; i++){
         minDifference.push(data.list[i].dt - legDestDuration);
       }  
       const goal = 0;
       const closest = minDifference.reduce(function(prev, curr) {
         return (Math.abs(curr - goal) < Math.abs(prev - goal) ? curr : prev);
       });
        
       const minIndex = minDifference.indexOf(closest);
       
  
       const cityName = data.city.name;
  
       let markers = showWeatherData(data.list[minIndex],locID, WeatherArray, map, cityName);
  
       for(let i = 0; i < markers.length; i++){
        markers[i].setMap(map);
       }
       
       weatherRadius(data.list[minIndex], map, locID, service, MarkerArray)
  
   })
   .catch(err => console.log('err', err))
  
  }
  function weatherRadius(data, map, locID, service, MarkerArray){
    var requestArr = [];
    var selectedArr = [];
    console.log(data);

    const hotSuggestions = ["Beach", "Ice Cream", "Swimming Pool", "Spa", "Camp Grounds", "Park"]
    const sunnySuggestions = ["Camp Grounds", "Park", "Hike"]
    const snowSuggestions = ["skiing"]
    const rainSuggestions = [ "Museum", "Restaraunt", "Library", "Castle"];

    if(data.weather[0].main.includes("Rain")){
     selectedArr = rainSuggestions;
    }
    else if(data.main.temp > 20 && !data.weather[0].main.includes("Rain")){
      selectedArr = hotSuggestions;
     }
     else if(data.weather[0].main.includes("Sunny")){
      selectedArr = sunnySuggestions;
     }
     else if(data.weather[0].main.includes("Snow")){
      selectedArr = snowSuggestions;
     }
     else{
      selectedArr = ["Restaraunt"];
     }
     
     
    
    //Get multiple input box to select multiple values which will be used as a type of array.
  
    //Have two arrays for activites for sunny and rainy weather. but also include the keyword function so the user can search for locations they want.
  
    //Create an array keyword requests then do a nearby search for all of them.
    let Map = map;
  
    for(let i = 0; i < selectedArr.length; i++){
    var request = {
      location: locID.location,
      radius: '500',
      keyword: selectedArr[i],
    };
    requestArr.push(request);
    }
    
    for(let i = 0; i < requestArr.length; i++){
    service.nearbySearch(requestArr[i], (results, status) => {
      if (status == google.maps.places.PlacesServiceStatus.OK) {
        console.log(results);
        for (var y = 0; y < results.length; y++) {
          createMarker(results[y], Map, MarkerArray);
        }
      }
    });
  }
  
  
  }
  
  function createMarker(place, map, MarkerArray) {
    if (!place.geometry || !place.geometry.location) return;  
    let infowindow;
    infowindow = new google.maps.InfoWindow();

  
    
    const marker = new google.maps.Marker({
      map: map,
      position: place.geometry.location,
      icon: place.icon,
    });
    MarkerArray.push(marker);

  
    google.maps.event.addListener(marker, "click", () => {
      
      var photoData;
      var photo = "";



      if(place.photos){
      photoData = place.photos[0];
      photoData.height = 200;
      photoData.width = 250;

      var PhotoUrl =  photoData.getUrl();
      photo = "<div style='float:left'>" +
      `<img src = "${PhotoUrl}">` +
      '</div>'

      }

      const placeName = place.name;
      var placeRating;
      if(place.rating !== 0){
        placeRating = place.rating + "/5";
      }
      else{
        placeRating = "Place unaviable";
      }

      const placeData = photo +
      "<div style='float:right; padding: 10px;'>" +
      "<b>"+ placeName +"</b><br/>" +
      `Rating: ${placeRating}<br/><br/>`
    

      infowindow.setContent(placeData);
      infowindow.open({
        anchor: marker,
        map: map,
      });
    });
  }
  
  
  //Function used to display the weather data present
  function showWeatherData(data,locID, WeatherArray, map, cityName){
   let WeatherInfo = data.weather[0];
   
  
   let weatherTemp = data.main.temp;
   let weatherWind = data.wind.speed;
   let destinationTime = data.dt_txt;
  
   //The Weather data of the current location including the description, temperture and windspeed.
   const weatherData = 
   "<div style='float:left'>" +
   `<img src = "https://openweathermap.org/img/wn/${WeatherInfo.icon}@2x.png">` +
   '</div>' +
   
   "<div style='float:right; padding: 10px;'>" +
   "<b>"+ cityName +"</b><br/>" +
   `${WeatherInfo.description}<br/><br/>Current Temperture: ${weatherTemp}<br/><br/>Wind Speed: ${weatherWind}<br/><br/>Time to Destination: ${destinationTime}<br/></div>`
    
   
   //New infoWindow created with weatherData, map cordinates and a label.
   let WeatherInfoWindow = new google.maps.InfoWindow({
     content: weatherData,
     position: locID.location,
     ariaLabel: "Current Weather of your destination"
   })
  
   let WeatherIcon = `https://openweathermap.org/img/wn/${WeatherInfo.icon}@2x.png`
  
   const marker = new google.maps.Marker({
     position: locID.location,
     icon: WeatherIcon,
     map: map,
   });
  
   marker.addListener("click", () => {
    WeatherInfoWindow.open({
      anchor: marker,
      map: map,
    });
  });
  
   WeatherArray.push(marker);
   //WeatherArray.push(WeatherInfoWindow);
   return WeatherArray;
  }
  
   //Class used to autocomplete search results and use them for directions
  class AutocompleteDirectionsHandler{
  map;
  originPlaceId;
  destinationPlaceId;
  waypointPlaceId;
  waypointArray;
  geometryPoint;
  geoArray;
  addressPoint;
  addressArray;
  travelMode;
  DestAddressPoint;
  DestGeometryPoint;
  directionsService;
  directionsRenderer;
  
  WeatherInfoWindowArr;
  WeatherIconArr;
  
  service;

  placeIconArray;
  
  constructor(map) {


    
  
   //Set up directions service
   this.map = map;
   this.originPlaceId = "";
   this.destinationPlaceId = "";
  
   this.waypointPlaceId = "";
   this.waypointArray = [];
   
   this.addressPoint = "";
   this.addressArray = [];
  
   this.geometryPoint = "";
   this.geoArray = [];
  
   this.DestGeometryPoint = "";
   this.DestAddressPoint = "";
  
   this.WeatherInfoWindowArr = [];
   this.WeatherIconArr = [];
  
   this.service = "";

   this.placeIconArray = [];
  
   this.travelMode = google.maps.TravelMode.DRIVING;
   this.directionsService = new google.maps.DirectionsService();
   this.directionsRenderer = new google.maps.DirectionsRenderer();
   this.directionsRenderer.setMap(map);
   this.service = new google.maps.places.PlacesService(map);
  
   //Get's the data from the two searchboxes
   const originInput = document.getElementById("origin-input");
   const destinationInput = document.getElementById("destination-input");
   const waypointInput = document.getElementById("waypoint-input");
  
   //Implements autocomplete functionality using the data from both searchboxes
   const originAutoComplete = new google.maps.places.Autocomplete(
     originInput,
     { fields: ["place_id", "geometry"]}
   );
   
   const destinationAutoComplete = new google.maps.places.Autocomplete(
     destinationInput,
     { fields: ["place_id", "geometry", "formatted_address"]}
   );
  
   const waypointAutoComplete = new google.maps.places.Autocomplete(
     waypointInput,
     { fields: ["place_id", "geometry", "formatted_address"]}
   );
  
  
   //Calls the method which is used to calculate the directions from the two locations
   this.routeCalc(originAutoComplete, "ORIG");
   this.routeCalc(destinationAutoComplete, "DEST");
   this.routeCalc(waypointAutoComplete, "WAY");
  
    //Waypoint clearer
  
    //Not too intuitive but get's the job dumb.
    const clearWaypoints = document.createElement("button");
    clearWaypoints.textContent = "Clear Waypoints";
    clearWaypoints.addEventListener("click", () => {
       this.waypointArray = [];
       this.geoArray = [];
       this.addressArray = [];
    });
    this.map.controls[google.maps.ControlPosition.BOTTOM_RIGHT].push(clearWaypoints);
  
   
   //Set's the position of the two searchboxes on the map
   this.map.controls[google.maps.ControlPosition.TOP_LEFT].push(originInput);
   this.map.controls[google.maps.ControlPosition.TOP_LEFT].push(destinationInput);
   this.map.controls[google.maps.ControlPosition.BOTTOM_RIGHT].push(waypointInput);
  }
  routeCalc(autocomplete, mode) {
    
   autocomplete.bindTo("bounds", this.map);
   autocomplete.addListener("place_changed", () => {
     const place = autocomplete.getPlace();
  
     if (!place.place_id) {
       return;
     }
  
     if (mode === "ORIG") {
       this.originPlaceId = place.place_id;
       
     } else if (mode == "DEST"){
       //If data isn't from the origin searchbox then get the destination place ID as well as the destinationGeometry
       this.destinationPlaceId = place.place_id;
  
       //Destination Geometry used to get the lat/long coords to call WeatherAPI
        this.DestGeometryPoint = place.geometry;
        this.DestAddressPoint = place.formatted_address;
  
     }
     else{
       this.waypointPlaceId = place.place_id;
  
       this.geometryPoint = place.geometry;
        this.addressPoint = place.formatted_address;
        this.addressArray.push(this.addressPoint);
  
        this.geoArray.push(this.geometryPoint);
       
       this.waypointArray.push({
         location: {placeId: this.waypointPlaceId},
         stopover: true,
       })
  
  
  
     }
       this.route();
   }
   );
  }
  //Route calculation
  route() {
   if (!this.originPlaceId || !this.destinationPlaceId || !this.waypointArray){
     return;
   }
   const me = this;
  
  
   
  
   this.directionsService.route(
     {
       origin: {placeId: this.originPlaceId},
       destination: {placeId: this.destinationPlaceId},
       waypoints: this.waypointArray,
       optimizeWaypoints: true,
       travelMode: "DRIVING",
     },
     (response, status) => {
       if (status === "OK") {
  
  
         me.directionsRenderer.setDirections(response);
  
         console.log(response);
         me.directionsRenderer.setPanel(document.getElementById("sidebar"));
  
  
  
        if(this.WeatherIconArr.length !== 0){
          for(let i = 0; i < this.WeatherIconArr.length; i++){
            this.WeatherIconArr[i].setMap(null);
          }
          this.WeatherIconArr = [];
        }

        if(this.placeIconArray.length !== 0){
          for(let i = 0; i < this.placeIconArray.length; i++){
            this.placeIconArray[i].setMap(null);
          }
          this.placeIconArray = [];
        }


         const legDuration = response.routes[0];
         for (let i = 0; i < this.geoArray.length; i++){
           const wayOrder = legDuration.waypoint_order;
  
           const legDestDuration = this.timeCalc(legDuration, this.addressArray[wayOrder[i]]);
           getWeatherData(this.map,this.geoArray[wayOrder[i]],legDestDuration,this.WeatherIconArr, this.service, this.placeIconArray);
         }
         const legDestDuration1 = this.timeCalc(legDuration, this.DestAddressPoint);
         getWeatherData(this.map,this.DestGeometryPoint,legDestDuration1,this.WeatherIconArr, this.service, this.placeIconArray);
  
  
  
       } else {
         window.alert("Directions request failed due to " + status);
       }
     }
   )
   
  }
  //Calculate legDestDuration the unix time taken to get to any leg of the journey.
  timeCalc(legDuration, addressPoint){
  
    //Conversion of unixTime to the current timezone of the user. EX: UTC to Irish Standard Time.
          const d = new Date(); 
          const localTime = d.getTime();
          const localOffset = d.getTimezoneOffset() * 60 * 1000;
          let unixTime = localTime - localOffset;
  
         unixTime = Math.round(unixTime/1000);
         let travelTime = 0;
  
         for(let i = 0; i < legDuration.legs.length; i++){
           if(addressPoint !== legDuration.legs[i].end_address){
              travelTime += legDuration.legs[i].duration.value;
           }
           else{
             travelTime += legDuration.legs[i].duration.value;
             break;
           }
         }
         unixTime += travelTime;
         return unixTime;
  }
  }
  
   //Error handler used if the Geolocation is invalid.
  function handleLocationError(browserHasGeolocation, infoWindow, pos) {
  infoWindow.setPosition(pos);
  infoWindow.setContent(
   browserHasGeolocation
     ? "Error: The Geolocation service failed."
     : "Error: Your browser doesn't support geolocation."
  );
  infoWindow.open(map);
  }