async function initMap(){

    //Automatically center's the map to the user's current location on load.
    if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
     (position) => {
     var options = {
       zoom:15,
       center:{lat:position.coords.latitude,lng:position.coords.longitude},
       mapTypeId: "roadmap",
       disableDefaultUI: true,
     }
     
     //Creating the map using the definied options from above
     var map = new google.maps.Map(document.getElementById('map'), options);
     
     
  
     /**
      * Next block of code calculates and creates a popup of the current position
      */
  
     //Creating a popup info window
     infoWindow = new google.maps.InfoWindow();
  
     
     
     
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

    const userPlaces = [];
    const userInput = document.getElementById("placeTypes");
    console.log(userInput);

    for (let i = 0; i < userInput.length; i++) {
      if (userInput.options[i].selected) {
        userPlaces.push(userInput[i].value);   
      }
    }

    if(userPlaces.length !== 0 ){
      selectedArr = userPlaces;
    }
    else if(data.weather[0].main.includes("Rain")){
     selectedArr = rainSuggestions;
    }
    else if(data.main.temp > 20 && !data.weather[0].main.includes("Rain")){
      selectedArr = hotSuggestions;
     }
     else if(data.weather[0].main.includes("clear")){
      selectedArr = sunnySuggestions;
     }
     else if(data.weather[0].main.includes("Snow")){
      selectedArr = snowSuggestions;
     }
     
     
    console.log(locID);
    //Get multiple input box to select multiple values which will be used as a type of array.
  
    //Have two arrays for activites for sunny and rainy weather. but also include the keyword function so the user can search for locations they want.
  
    //Create an array keyword requests then do a nearby search for all of them.
    let Map = map;
     
    if(selectedArr === userPlaces){
      for(let i = 0; i < selectedArr.length; i++){
        var request = {
          location: locID.location,
          radius: '750',
          type: selectedArr[i],
        };
        requestArr.push(request);
        }
    }
    else{
    for(let i = 0; i < selectedArr.length; i++){
    var request = {
      location: locID.location,
      radius: '750',
      keyword: selectedArr[i],
    };
    requestArr.push(request);
    }
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

    let resizeIcon = {
      url: place.icon,
      scaledSize: new google.maps.Size(50, 50),
     }
  
    
    const marker = new google.maps.Marker({
      map: map,
      position: place.geometry.location,
      icon: resizeIcon,
    });
    MarkerArray.push(marker);

  
    google.maps.event.addListener(marker, "click", () => {
      
      var photoData;
      var photo = "";



      if(place.photos){
      photoData = place.photos[0];

      if(photoData.height > photoData.width){
        photoData.height = 250;
        photoData.width = 150;
      }
      else if (photoData.height < photoData.width){
        photoData.height = 150;
        photoData.width = 250;
      }
      else{
        photoData.height = 200;
        photoData.width = 200;
      }
      
      var PhotoUrl =  photoData.getUrl();
      photo = "<div style='float:left padding: 20px;'>" +
      `<img src = "${PhotoUrl}"
        width=${photoData.width}
        height=${photoData.height}/>` +
      '</div>'
    }
      
      const placeVacinity = place.vicinity;
      const placeName = place.name;
      console.log(placeName);
      var placeRating;
      if(place.rating !== 0){
        placeRating = place.rating + "/5";
      }
      else{
        placeRating = "Rating unavailable";
      }

      const placeData = photo +
      "<div style='float:right; margin:10px'>" +
      "<b>"+ placeName +"</b><br/><br/>" + "</br>" + placeVacinity + "</br></br>" +
      `Rating: ${placeRating}<br/><br/>` + "</div>"
    

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

   var windDeg = [0,45,90,135,180,225,270,315,360];
   var windDirectionsArr = ["North", "North-East", "East", "South-East", "South", "South-West", "West", "North West", "North"];
   var goal = data.wind.deg;
   const closest = windDeg.reduce(function(prev, curr) {
    return (Math.abs(curr - goal) < Math.abs(prev - goal) ? curr : prev);
  });

  var windDirections = windDirectionsArr[windDeg.indexOf(closest)];

   
  
   //The Weather data of the current location including the description, temperture and windspeed.
   const weatherData = 
   "<div style='float:left'>" +
   `<img src = "https://openweathermap.org/img/wn/${WeatherInfo.icon}@2x.png">` +
   '</div>' +
   
   "<div style='float:right; padding: 10px;'>" +
   "<b>"+ cityName +"</b><br/>" + "Upon arriving at the destination, the weather will be </br></br>" +
   `Weather type: ${WeatherInfo.description}<br/><br/>Temperture: ${weatherTemp}°C<br/><br/>${windDirections}ern speed at ${weatherWind} metres/second.<br/></div>`
    
   
   //New infoWindow created with weatherData, map cordinates and a label.
   let WeatherInfoWindow = new google.maps.InfoWindow({
     content: weatherData,
     position: locID.location,
     ariaLabel: "Current Weather of your destination"
   })
  
   let WeatherIcon = `https://openweathermap.org/img/wn/${WeatherInfo.icon}@2x.png`
   
   let resizeIcon = {
    url: WeatherIcon,
    scaledSize: new google.maps.Size(200, 200),
   }
  
   const marker = new google.maps.Marker({
     position: locID.location,
     icon: resizeIcon,
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

  locationButton;
  
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

   this.locationButton = "";

  
   this.travelMode = google.maps.TravelMode.DRIVING;
   this.directionsService = new google.maps.DirectionsService();
   this.directionsRenderer = new google.maps.DirectionsRenderer();
   this.directionsRenderer.setMap(map);
   this.service = new google.maps.places.PlacesService(map);
  
   //Get's the data from the two searchboxes
   const originInput = document.getElementById("origin-input");
   const destinationInput = document.getElementById("destination-input");
   const waypointInput = document.getElementById("waypoint-input");

   //Code for a submit button

    const submitButton = document.getElementById("updateRoute");
    submitButton.textContent = "Update Route";
    
    submitButton.addEventListener("click", () => {
      this.updateCalc();
    });

  

        
    //Creates a button, positions it in the top center
    this.locationButton = document.getElementById("CurrentLocation");
    this.locationButton.textContent = "Get Current Location";
    

    const control = document.getElementById("floating-select-panel");

    
     const geocoder = new google.maps.Geocoder();

     //When button is pushed execute the following code, which get's the current cordinates
     this.locationButton.addEventListener("click", () => {
       //Check if geolocation is possible on user's browser
       if (navigator.geolocation) {
         //USe "watchPosition" to continuosuly track the location
         //get's the current location of the user
         navigator.geolocation.getCurrentPosition(
           (position) => {
            console.log(position);
             const pos = {
               lat: position.coords.latitude,
               lng: position.coords.longitude,
             };

             geocoder.geocode({ location: pos})
             .then((response) => {
              if (response.results[0]){
                console.log(response.results[0]);
                this.originPlaceId = response.results[0].place_id;

                var getOrigin = document.getElementById("origin-input");
                getOrigin.value = response.results[0].formatted_address;
                getOrigin.innerHTML = response.results[0].formatted_address;
                this.updateCalc();
              }
             })
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

    //Not too intuitive but get's the job dumb.
    const clearWaypoints = document.getElementById("waypointClear");
    
    clearWaypoints.textContent = "Clear Waypoints";
    clearWaypoints.addEventListener("click", () => {
       this.waypointArray = [];
       this.geoArray = [];
       this.addressArray = [];
       //Calls the method which is used to calculate the directions from the two locations
       this.updateCalc();
    });
  
  
   //Calls the method which is used to calculate the directions from the two locations
   this.routeCalc(originAutoComplete, "ORIG");
   this.routeCalc(destinationAutoComplete, "DEST");
   this.routeCalc(waypointAutoComplete, "WAY");
  
    //Waypoint clearer
  
      if (window.innerWidth < 500) {
        this.map.controls[google.maps.ControlPosition.TOP_LEFT].push(originInput);
        this.map.controls[google.maps.ControlPosition.TOP_RIGHT].push(destinationInput);
        this.map.controls[google.maps.ControlPosition.RIGHT_TOP].push(waypointInput);
        this.map.controls[google.maps.ControlPosition.LEFT_TOP].push(this.locationButton);
        this.map.controls[google.maps.ControlPosition.LEFT_TOP].push(submitButton);
        this.map.controls[google.maps.ControlPosition.LEFT_BOTTOM].push(control);
        this.map.controls[google.maps.ControlPosition.RIGHT_TOP].push(clearWaypoints);
      }
     else {
      this.map.controls[google.maps.ControlPosition.TOP_LEFT].push(originInput);
      this.map.controls[google.maps.ControlPosition.LEFT_TOP].push(destinationInput);
      this.map.controls[google.maps.ControlPosition.TOP_RIGHT].push(waypointInput);
      this.map.controls[google.maps.ControlPosition.LEFT_TOP].push(this.locationButton);
      this.map.controls[google.maps.ControlPosition.LEFT_TOP].push(submitButton);
      this.map.controls[google.maps.ControlPosition.LEFT_BOTTOM].push(control);
      this.map.controls[google.maps.ControlPosition.RIGHT_TOP].push(clearWaypoints);
     }
    
   
   

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
  updateCalc(){
    this.route();
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