'use strict';
/* eslint-disable indent */

//////////////////////////////////////////////////////////////
// SEPARATION OF CONCERNS: TYPES OF FUNCTIONS
//
// Leaflet Map API shizzness:
//
// Yelp API shizzness:
// Miscellaneous (incl Fetch Request)
// Template Generators
// Rendering Functions
// Event Handlers
//////////////////////////////////////////////////////////////


// INIT //////////////////////////////////////////////////////
function init() {
  handleSubmission();
  handleSort();
 }

// $(() => {
//   console.log('jQuery working', $);
// });



//////////////////////////////////////////////////////////////
// LEAFLET MAP API SHIZZNESS /////////////////////////////////
//////////////////////////////////////////////////////////////

function renderMap(data) {

  const coordinates = [];
  for (let i = 0; i < data.businesses.length; i++) {
    // push restaurant coordinates to array
    const latitude = data.businesses[i].coordinates.latitude;
    const longitude = data.businesses[i].coordinates.longitude;
    coordinates.push([latitude, longitude]);
  }
  // console.log(coordinates);

  // [1] initialise map 
  // [2] setView(geographical coordinates [lat, long], zoomlevel)
  // setView() also returns the map object
  //
  // as I don't have general geographical coodinates from city/zipcode of searchbar
  // as stop gap I'm setting the view to the coordinates of the first restaurant
  // asset 'base view' of map
  const zoomLevel = 13;
  var mymap = L.map('mapid').setView([coordinates[0][0], coordinates[0][1]], zoomLevel);


  // [3] add a (mapbox) 'tile layer' to add to our map 
  L.tileLayer('https://api.mapbox.com/styles/v1/{id}/tiles/{z}/{x}/{y}?access_token={accessToken}', {
    attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors, <a href="https://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, Imagery © <a href="https://www.mapbox.com/">Mapbox</a>',
    maxZoom: 18,
    id: 'mapbox/streets-v11', // mapbox/satellite-v9 // mapbox/streets-v11 
    tileSize: 512,
    zoomOffset: -1,
    // mapbox.access.token
    accessToken: 'pk.eyJ1IjoiYXJ0aWZpY2lhbGFyZWEiLCJhIjoiY2s5ZGFyYmo2MDFyejNmbGVsOGQ3eWZ5cCJ9.TIWmboj0G4JnLfQ0GhTDdw' 
  }).addTo(mymap);


  // [4] add a marker(s)
  // var marker = L.marker([51.5, -0.09]).addTo(mymap);
  for (let i = 0; i < coordinates.length; i++) {
    var marker = L.marker([coordinates[i][0], coordinates[i][1]]).addTo(mymap);
  }
  
}



//////////////////////////////////////////////////////////////
// YELP API SHIZZNESS ////////////////////////////////////////
//////////////////////////////////////////////////////////////

// MISCELLANEOUS /////////////////////////////////////////////

function displayView(view) {
  if (view === 'results') {
    $('.view-results').removeClass('hidden');
    $('.branding').removeClass('hidden');
    $('.sortbar').removeClass('hidden');
    $('#mapid').removeClass('hidden');
    $('main').removeClass('mode-root');
    $('.view-root').addClass('hidden');
  } else {
    $('.view-results').addClass('hidden');
    $('.view-results').removeClass('hidden');
  }
}

function formatQueryParams(params) {
  const queryItems = Object.keys(params).map(key => {
    return `${encodeURIComponent(key)}=${encodeURIComponent(params[key])}`;
  });
  return queryItems.join('&');
}

function fetchRestaurantInfo(area, distance, diet, sort = 'best_match') {
 
  const baseURL = 'https://api.yelp.com/v3/businesses/search';
  const apiKey = 'IGnYDkKpA5hFg8el7-9WyyoLx5Z5sv2nssKYPflu_KGq26puqqFYSR9vikWHbTeSt9Vm1xzlQYKjzvf7uoJrkNTNfGdgJ5S7H3OW_CXlTJChkm-HxwgWNFnx-fOZXnYx';

  // get get past the CORS issue
  // bypass with a proxy
  const proxyBypassURL = 'https://galvanize-cors.herokuapp.com/'; 

  const options = {
    headers: new Headers({
      'Authorization': 'Bearer ' + apiKey,
    })
  };

  // apparently Yelp 'radius' value must be in meters (max value: 40000)
  // convert distance from miles to meters
  let distanceMeters = Math.floor(distance * 1609.344);
  const maxMeters = 40000;
  if (distanceMeters > maxMeters) {
    distanceMeters = maxMeters;
  }

  const params = {
    location: area,
    categories: diet,
    radius: distanceMeters,
    sort_by: sort
  };

  const queryString = formatQueryParams(params);
  const url = proxyBypassURL + baseURL + '?' + queryString;
  // console.log(url);

  fetch(url, options)
    .then(response => {
      if (!response.ok) {
        throw new Error(response.statusText);
      }
      return response.json();
    })
    .then(data => {
      // console.log(data);
      renderSearchResults(data);
      renderMap(data); 
      // renderMap(); 
      $('.please-wait').text('');
    })
    .catch(err => console.log(err));
  }  



// TEMPLATE GENERATORS ///////////////////////////////////////

function generateSearchResults(data) {

  const array = [];
  const arrCategories = [];
  
  for (let i = 0; i < data.businesses.length; i++) {

    for (let j = 0; j < data.businesses[i].categories.length; j++) {
      arrCategories.push(`
        <li class="cuisine">${data.businesses[i].categories[j].title}</li>
      `);
    }
    let strCategories = arrCategories.join('');

    array.push(`<li class="restaurant-item">
    <h2>${data.businesses[i].name}</h2>
    <ul class="food-types"> 
      <!--<li class="cuisine">${data.businesses[i].categories[0].title}</li>-->
      ${strCategories}
      <li class="price">${data.businesses[i].price}</li>
      <li class="diet">Rating:${data.businesses[i].rating}</li>
      <li class="diet">Reviews:${data.businesses[i].review_count}</li>
    </ul>
    <address>
      <p><b>Address:</b> ${data.businesses[i].location.address1}, ${data.businesses[i].location.city}, ${data.businesses[i].location.state} ${data.businesses[i].location.zip_code}</p>
      <p><b>Latitude:</b> ${data.businesses[i].coordinates.latitude} / <b>Longitude:</b> ${data.businesses[i].coordinates.longitude}<p>
      <p><b>Phone:</b> ${data.businesses[i].display_phone}</p>
    </address>
  </li>
    `);
    arrCategories.length = 0;
  }
  return array.join('');
}



// RENDERING FUNCTIONS ///////////////////////////////////////

function renderSearchResults(data) {
  const results = generateSearchResults(data);
  $('.js-results-list').html(results);
  displayView('results');
  
}



// EVENT HANDLERS ////////////////////////////////////////////

function handleSubmission() {
  $('.search-form').on('submit', event => {
    event.preventDefault();
    const sort = $('.sort-type').val();
    handleInputs(sort);
    $('.js-results-list').empty();
    $('.sortbar').addClass('hidden');
  });
}

function handleSort() {
  $('.sort-type').on('change', event => {
    const sort = $(event.target).val();
    handleInputs(sort);
    $('.please-wait').text('Please wait while we re-sort the results...');
  });
}

function handleInputs(sort) {
  const area = $('.area-input').val();
  $('.view-results').find('.area-input').val(area);
  const distance = $('.distance-input').val();
  // const sort = $('.sort-type').val();
  const diet = [];
  if ($('#gluten-free-check').is(':checked')) {
    diet.push('gluten_free');
    $('.view-results').find('#gluten-free-check').attr('checked', true);
  } 
  if ($('#vegan-check').is(':checked')) {
    diet.push('vegan');
    $('.view-results').find('#vegan-check').attr('checked', true);
  } 
  if ($('#vegetarian-check').is(':checked')) {
    diet.push('vegetarian');
    $('.view-results').find('#vegetarian-check').attr('checked', true);
  } 
  
  fetchRestaurantInfo(area, distance, diet, sort);
}



// INVOKE INIT
$(init);