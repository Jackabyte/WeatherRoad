//Everything that is displayed on the map once it has been intitalised.

    function initMap(){
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

//Function to get the weather data of your current location
function getWeatherData(map, locID, legDestDuration){
        
  const API_KEY = '21917a0e0803572232357c75d94699c0';

        let lat = locID.location.lat();
        let lng = locID.location.lng();

      fetch(`https://pro.openweathermap.org/data/2.5/forecast/hourly?lat=${lat}&lon=${lng}&appid=${API_KEY}&units=metric`)
      
    .then(res => res.json())
    .then(data => {
      let minDifference = [];
        for(let i = 0; i < data.list.length; i++){
          minDifference.push(data.list[i].dt - legDestDuration);
        }  

        const goal = 0;
        const closest = minDifference.reduce(function(prev, curr) {
          return (Math.abs(curr - goal) < Math.abs(prev - goal) ? curr : prev);
        });
         
        const minIndex = minDifference.indexOf(closest);
      
      let window = showWeatherData(data.list[minIndex],locID);
      window.open(map);
      
    })
    .catch(err => console.log('err', err))
  
  }
//Function used to display the weather data present
function showWeatherData(data,locID){
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
    `<b>Current Weather</b><br/>${WeatherInfo.description}<br/><br/>Current Temperture: ${weatherTemp}<br/><br/>Wind Speed: ${weatherWind}<br/><br/>Time to Destination: ${destinationTime}<br/></div>`
    
    /**
       * Problem
       * Can't figure out a way for the previous infowindow to close itself once a new infoWindow has been made.
       */

    //New infoWindow created with weatherData, map cordinates and a label.
    let WeatherInfoWindow = new google.maps.InfoWindow({
      content: weatherData,
      position: locID.location,
      ariaLabel: "Current Weather of your destination"
    })

    return WeatherInfoWindow;
  }
    //Class used to autocomplete search results and use them for directions
class AutocompleteDirectionsHandler{
  map;
  originPlaceId;
  destinationPlaceId;
  waypointPlaceId;
  waypointArray;

  geometryPoint;

  travelMode;
  directionsService;
  directionsRenderer;
  constructor(map) {
    //Set up directions service
    this.map = map;
    this.originPlaceId = "";
    this.destinationPlaceId = "";
    this.waypointPlaceId = "";
    this.waypointArray = [];

    this.geometryPoint = "";

    this.travelMode = google.maps.TravelMode.DRIVING;
    this.directionsService = new google.maps.DirectionsService();
    this.directionsRenderer = new google.maps.DirectionsRenderer();
    this.directionsRenderer.setMap(map);

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
      { fields: ["place_id", "geometry"]}
    );

    const waypointAutoComplete = new google.maps.places.Autocomplete(
      waypointInput,
      { fields: ["place_id", "geometry"]}
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
      console.log(place);
      if (!place.place_id) {
        return;
      }

      if (mode === "ORIG") {
        this.originPlaceId = place.place_id;
      } else if (mode == "DEST"){
        //If data isn't from the origin searchbox then get the destination place ID as well as the destinationGeometry
        this.destinationPlaceId = place.place_id;

        //Destination Geometry used to get the lat/long coords to call WeatherAPI
         this.geometryPoint = place.geometry;
        
      }
      else{
        this.waypointPlaceId = place.place_id;

        this.geometryPoint = place.geometry;
        
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
          

          const legDuration = response.routes[0];

          //Keep looping until the waypoint has found the matching name via PlaceId info.
          //When found keep adding the time until you reach that index leg.

          const legDestDuration = this.timeCalc(legDuration);
          getWeatherData(this.map,this.geometryPoint,legDestDuration)

        } else {
          window.alert("Directions request failed due to " + status);
        }
      }
    )
  }
  //Calculate legDestDuration the unix time taken to get to any leg of the journey.
  timeCalc(legDuration){
          let unixTime = Date.now();
          unixTime = Math.round(unixTime/1000);

          unixTime += legDuration.legs[0].duration.value;
           
          
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