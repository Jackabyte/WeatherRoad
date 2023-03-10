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

      //What does this do even???? Delete if Unneccesary!!!
      //locationButton.classList.add("custom-map-control-button");

      //set's the location for the map button.
      map.controls[google.maps.ControlPosition.TOP_CENTER].push(locationButton);

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
function getWeatherData(map, locID){
        
  const API_KEY = '21917a0e0803572232357c75d94699c0';

        let lat = locID.location.lat();
        let lng = locID.location.lng();

      fetch(`https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lng}&appid=${API_KEY}&units=metric`)
    .then(res => res.json())
    .then(data => {
      console.log(data)
      let window = showWeatherData(data,locID);
      window.open(map);
    })
    .catch(err => console.log('err', err))
  
  }
//Function used to display the weather data present
function showWeatherData(data,locID){
    let WeatherInfo = data.weather[0];
    let weatherTemp = data.main.temp;
    let weatherWind = data.wind.speed;

    //The Weather data of the current location including the description, temperture and windspeed.
    const weatherData = 
    "<div style='float:left'>" +
    `<img src = "https://openweathermap.org/img/wn/${WeatherInfo.icon}@2x.png">` +
    '</div>' +
    
    "<div style='float:right; padding: 10px;'>" +
    `<b>Current Weather</b><br/>${WeatherInfo.description}<br/><br/>Current Temperture: ${weatherTemp}<br/><br/>Wind Speed: ${weatherWind}<br/></div>`
    
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
  travelMode;
  directionsService;
  directionsRenderer;
  constructor(map) {
    //Set up directions service
    this.map = map;
    this.originPlaceId = "";
    this.destinationPlaceId = "";
    this.travelMode = google.maps.TravelMode.DRIVING;
    this.directionsService = new google.maps.DirectionsService();
    this.directionsRenderer = new google.maps.DirectionsRenderer();
    this.directionsRenderer.setMap(map);

    //Get's the data from the two searchboxes
    const originInput = document.getElementById("origin-input");
    const destinationInput = document.getElementById("destination-input");

    //Implements autocomplete functionality using the data from both searchboxes
    const originAutoComplete = new google.maps.places.Autocomplete(
      originInput,
      { fields: ["place_id", "geometry"]}
    );

    const destinationAutoComplete = new google.maps.places.Autocomplete(
      destinationInput,
      { fields: ["place_id", "geometry"]}
    );

    //Calls the method which is used to calculate the directions from the two locations
    this.routeCalc(originAutoComplete, "ORIG");
    this.routeCalc(destinationAutoComplete, "DEST");

    //Set's the position of the two searchboxes on the map
    this.map.controls[google.maps.ControlPosition.TOP_LEFT].push(originInput);
    this.map.controls[google.maps.ControlPosition.TOP_LEFT].push(destinationInput);

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
      } else {
        //If data isn't from the origin searchbox then get the destination place ID as well as the destinationGeometry
        this.destinationPlaceId = place.place_id;

        //Destination Geometry used to get the lat/long coords to call WeatherAPI
        const destinationGeometry = place.geometry;
        getWeatherData(this.map,destinationGeometry)
        
      }
      this.route();
    });
  }
  //Route calculation
  route() {
    if (!this.originPlaceId || !this.destinationPlaceId){
      return;
    }

    const me = this;

    this.directionsService.route(
      {
        origin: {placeId: this.originPlaceId},
        destination: {placeId: this.destinationPlaceId},
        travelMode: "DRIVING",
      },
      (response, status) => {
        if (status === "OK") {
          me.directionsRenderer.setDirections(response);
        } else {
          window.alert("Directions request failed due to " + status);
        }
      }
    )
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