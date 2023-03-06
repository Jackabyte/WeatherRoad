//Everything that is displayed on the map once it has been intitalised.
    function initMap(){
      
     var DS = new google.maps.DirectionsService();    
     var directionDisplay = new google.maps.DirectionsRenderer();
    
      var options = {
        zoom:8,
        center:{lat:53.2740,lng:-9.0513},
        mapTypeId: "roadmap",
      }
      
      //Creating the map using the definied options from above
      var map = new google.maps.Map(document.getElementById('map'), options);

      /**
       * Next block of code creates a search box which get's any location
       */
      
      //Turn the inputbox into a google maps position box
      const input = document.getElementById("pac-input");
      const searchBox = new google.maps.places.SearchBox(input);

      //Positions the searchbox to the top left of the map
      map.controls[google.maps.ControlPosition.TOP_LEFT].push(input);
      
      //bounds_changed is when the bounds/edges of the map are shifted in any way.
      map.addListener("bounds_changed", () => {
        searchBox.setBounds(map.getBounds());
      });

      let markers = [];

      //Places changed is when a different place is entered in the search box
      searchBox.addListener("places_changed", () => {
        const places = searchBox.getPlaces();

        //If "" is entered in the searchbox then do nothing
        if(places.length == 0){
          return;
        }

      //Upon new input remove previous marker placed
      markers.forEach((marker) => {
        marker.setMap(null);
      });
      markers = [];

      const bounds = new google.maps.LatLngBounds();

      //Checks to see if there is no geometry for the location inputed
      places.forEach((place) => {
      if (!place.geometry || !place.geometry.location) {
        console.log("Returned place contains no geometry");
        return;
      }

      //Initialising the icon for placement
      const icon = {
        url: place.icon,
        size: new google.maps.Size(71, 71),
        origin: new google.maps.Point(0, 0),
        anchor: new google.maps.Point(17, 34),
        scaledSize: new google.maps.Size(25, 25),
      };

      //placing the icon in question
      markers.push(
        new google.maps.Marker({
          map,
          icon,
          title: place.name,
          position: place.geometry.location,
        })
      );

      //The viewport is the lat/lng range that encompasses a certain area. While location is the exact area in question.
      if (place.geometry.viewport) {
        bounds.union(place.geometry.viewport);
      } else {
        bounds.extend(place.geometry.location);
      }
    });
    //Makes the map go to the location of the inputed viewport.
    map.fitBounds(bounds);
  });
  

      directionDisplay.setMap(map);

      const onChangeHandler = function () {
        calcRoute(DS, directionDisplay);
      };
    
      document.getElementById("start").addEventListener("change", onChangeHandler);
      document.getElementById("end").addEventListener("change", onChangeHandler);


      /**
       * Next block of code calculates the current position
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
        //Get the lat and long of your current location
        if (navigator.geolocation) {
          navigator.geolocation.watchPosition(
            
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
              //Error handler so in the case the current location can't be got.
              handleLocationError(true, infoWindow, map.getCenter());
            }
          );
        } else {
          // Browser doesn't support Geolocation
          handleLocationError(false, infoWindow, map.getCenter());
        }
      });

      

    }

    function calcRoute(DS, directionDisplay) {
        DS
        .route({
            origin: {
              query: document.getElementById("start").value,
            },
            destination: {
              query: document.getElementById("end").value,
            },
            travelMode: google.maps.TravelMode.DRIVING,
          })
          .then((response) => {
            directionDisplay.setDirections(response);
          })
          .catch((e) => window.alert("Directions request failed due to " + status));
      }
   

    function handleLocationError(browserHasGeolocation, infoWindow, pos) {
  infoWindow.setPosition(pos);
  infoWindow.setContent(
    browserHasGeolocation
      ? "Error: The Geolocation service failed."
      : "Error: Your browser doesn't support geolocation."
  );
  infoWindow.open(map);
}