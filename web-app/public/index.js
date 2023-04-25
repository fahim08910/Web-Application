function login() {
  var username = document.getElementById("username").value;
  var password = document.getElementById("password").value;
  var errorMessage = document.getElementById("error-message");

  var xhr = new XMLHttpRequest();
  xhr.open("POST", "/login");
  xhr.setRequestHeader("Content-Type", "application/json;charset=UTF-8");

  xhr.onreadystatechange = function() {
    if (this.readyState === XMLHttpRequest.DONE) {
      if (this.status === 200) {
        var response = JSON.parse(this.responseText);
        var loginForm = document.getElementById("login-form");
        loginForm.innerHTML = "Logged in as " + response.username + " ";

        localStorage.setItem("username", response.username);

        var logoutButton = document.createElement("button");
        logoutButton.innerText = "Logout";
        logoutButton.id = "logout-button";
        logoutButton.addEventListener("click", function() {
          logout();
        });
        loginForm.appendChild(logoutButton);
      } else {
        errorMessage.textContent = "Incorrect username or password. Please try again.";
      }
    }
  };

  xhr.send(JSON.stringify({username: username, password: password}));
}





window.addEventListener("load", function() {
  fetch('/login')
    .then(response => response.json())
    .then(data => {
      var username = data.username; 
      if (username) {
        var loginForm = document.getElementById("login-form");
        loginForm.innerHTML = "Logged in as " + username + " ";
        
        var logoutButton = document.createElement("button");
        logoutButton.innerText = "Logout";
        logoutButton.id = "logout-button";
        logoutButton.addEventListener("click", function() {
          logout();
        });
        loginForm.appendChild(logoutButton);
      }
    })
    .catch(error => console.log(error));
});





function logout() {
  localStorage.removeItem("username"); 

  var xhr = new XMLHttpRequest();
  xhr.open("POST", "/logout");

  xhr.onreadystatechange = function() {
    if (this.readyState === XMLHttpRequest.DONE) {
      if (this.status === 200) {
        window.location.href = document.referrer; 
      }
    }
  };

  xhr.send();
}






// Define Leaflet map
const mapDiv = document.getElementById("map");
const map = L.map(mapDiv).setView([0, 0], 2);
const attrib = "Map data &copy; <a href='https://www.openstreetmap.org/'>OpenStreetMap</a> contributors, <a href='https://creativecommons.org/licenses/by-sa/2.0/'>CC-BY-SA</a>";

L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
  attribution: attrib
}).addTo(map);

// Define function to add marker and popup to map
function addMarkerToMap(poi) {
  const latlng = [poi.lat, poi.lon];
  const marker = L.marker(latlng).addTo(map);
  marker.bindPopup(`<h3>${poi.name}</h3><p>${poi.description}</p>
    <form id="review-form">
      <label for="review-input">Enter review:</label><br>
      <textarea id="review-input" name="review-input" rows="4" cols="50"></textarea><br>
      <p id="review-message"></p>
      <button type="submit" id="review-submit-button">Submit Review</button>
    </form>
    <form id="photo-form">
      <label for="photo-input">Upload a photo:</label><br>
      <input type="file" id="photo-input" name="photo-input"><br>
      <p id="photo-message"></p>
      <button type="submit" id="photo-submit-button">Submit Photo</button>
    </form>`);
  
  // Event listener for review form
  marker.on('popupopen', () => {
    const reviewForm = document.getElementById('review-form');
    const reviewMessage = document.getElementById('review-message');
    const reviewSubmitButton = document.getElementById('review-submit-button');
    reviewForm.addEventListener('submit', function(event) {
      event.preventDefault();
      const reviewInput = document.getElementById('review-input');
      const review = reviewInput.value;
      const poiId = poi.id;
      const loggedIn = Boolean(localStorage.getItem("username"));
      const reviewsSubmitted = JSON.parse(localStorage.getItem(`${poiId}-${loggedIn}`)) || []; 
      const now = new Date();
      const reviewSubmittedToday = reviewsSubmitted.some(r => {
        const date = new Date(r.date);
        return date.toDateString() === now.toDateString() && (now - date) / (1000 * 60 * 60) < 24;
      }); 
      if (!loggedIn) {
        reviewMessage.innerHTML = 'Please log in to submit a review.';
      } else if (reviewSubmittedToday) {
        reviewMessage.innerHTML = 'You have already submitted a review for this place';
      } else if (!review.trim()) {
        reviewMessage.innerHTML = 'Please enter your review.';
      } else {
        fetch(`/points-of-interest/${poiId}/reviews`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          credentials: 'include', 
          body: JSON.stringify({ review: review })
        })        
        .then(response => {
          if(response.ok) {
            reviewInput.value = ''; 
            reviewMessage.innerHTML = 'Review added successfully!';
            reviewsSubmitted.push({ date: now.toISOString() }); 
            localStorage.setItem(`${poiId}-${loggedIn}`, JSON.stringify(reviewsSubmitted)); 
          } else {
            response.json().then(error => {
              if (
                response.status === 401) {
                  reviewMessage.innerHTML = 'Please log in to submit a review.';
                  loggedIn = false;
                  } else {
                  reviewMessage.innerHTML = `Failed to add review. ${error.message}`;
                  }
              });
            }
          })
        .catch(() => {
         reviewMessage.innerHTML = 'Failed to add review. Please try again.';
        })
        .finally(() => {
        reviewSubmitButton.disabled = false;
      });
    }
    });
    // Event listener for photo form
    const photoForm = document.getElementById('photo-form');
    const photoMessage = document.getElementById('photo-message');
    const photoSubmitButton = document.getElementById('photo-submit-button');
    photoForm.addEventListener('submit', function(event) {
        event.preventDefault();
        const photoInput = document.getElementById('photo-input');
        const photo = photoInput.files[0];
        const poiId = poi.id;
        const loggedIn = Boolean(localStorage.getItem("username"));
        if (!loggedIn) {
        photoMessage.innerHTML = 'Please log in to upload a photo.';
        } else {
          const formData = new FormData();
          formData.append('photo', photo);
            fetch(`/${poiId}/photos`, {
                  method: 'POST',
                  credentials: 'include',
                  body: formData
                })
                 .then(response => {
                   if(response.ok) {
                    photoMessage.innerHTML = 'Photo uploaded successfully!';
                 // Add photo to popup
                  const photoUrl = URL.createObjectURL(photo);
                  const popupContent = marker.getPopup().getContent();
                   marker.bindPopup(`${popupContent}<img src="${photoUrl}" alt="POI photo" width="300">`);
                    } else {
                      const errorMessage = response.status === 401 ? 'Please log in to upload a photo.' : 'Failed to upload photo.';
                      photoMessage.innerHTML = errorMessage;
                      console.error(`Error uploading photo: ${errorMessage}`);
                      }
                    })
                    .catch(error => {
                      photoMessage.innerHTML = 'Failed to upload photo. Please try again.';
                      console.error(`Error uploading photo: ${error.message}`);
                    })
                   .finally(() => {
                    photoSubmitButton.disabled = false; 
                   });      
               }
            });
        });
    }












 // Handle form submission
const searchForm = document.getElementById('search-form');
searchForm.addEventListener('submit', function(event) {
  event.preventDefault();
  const regionInput = document.getElementById('region-input');
  const region = regionInput.value;

  if (!region) {
    document.getElementById('results').innerHTML = '<p>Please enter a region name.</p>';
    return;
  }

  fetch(`/points-of-interest/${region}`)
    .then(response => {
      if (!response.ok) {
        throw new Error('Unable to find points of interest for the specified region.');
      }
      return response.json();
    })
    .then(pois => {
      if (!pois.length) {
        document.getElementById('results').innerHTML = `<p>No points of interest were found for the region '${region}'.</p>`;
        return;
      }

      const pos = [pois[0].lat, pois[0].lon];
      map.setView(pos, 13);
      pois.forEach(addMarkerToMap);

      let html = '';
      pois.forEach(poi => {
        html += `<div>
          <h3>${poi.name}</h3>
          <p>${poi.description}</p>
          <p>Recommendations: <span class="recommendations-count">${poi.recommendations}</span></p>
          <button class="recommend-button" data-id="${poi.id}">Recommend</button>
        </div>`;
      });
      document.getElementById('results').innerHTML = html;
      const recommendButtons = document.querySelectorAll('.recommend-button');
      recommendButtons.forEach(button => {
        button.addEventListener('click', function(event) {
          const poiId = event.target.dataset.id;
          fetch(`/points-of-interest/${poiId}/recommend`, { method: 'POST' })
            .then(response => response.json())
            .then(result => {
              if (result.success) {
                const poiDiv = event.target.closest('div');
                const poiRecommendations = poiDiv.querySelector('.recommendations-count');
                const currentRecommendations = Number(poiRecommendations.innerText);
                poiRecommendations.innerText = currentRecommendations + 1;
                const pos = [pois[0].lat, pois[0].lon];
                map.setView(pos, 13);
                alert('Recommendation added!');
              } else {
                console.error('An error occurred while recommending this POI.');
              }
            })
            .catch(error => {
              console.error(error);
              console.error('An error occurred while recommending this POI.');
            });
        });
      });
    })
    .catch(error => {
      console.error(error);
      document.getElementById('results').innerHTML = '<p>An error occurred while searching for points of interest.</p>';
    });
});




const addLink = document.querySelector('#add-link');

addLink.addEventListener('click', (event) => {
  event.preventDefault();

  fetch('/login')
  .then(response => response.json())
  .then(data => {
    if (data.username) {
      window.location.href = '/add';
    } else {
      const errorMessage = 'Please log in to add a point of interest.';
      const errorElement = document.getElementById('error');
      errorElement.textContent = errorMessage;
    }
  })

    .catch(error => {
      console.error(error);
      console.error('An error occurred while checking if the user is logged in.');
      alert('An error occurred while checking if the user is logged in.');
    });
});
















// Create a click event listener for the map
map.on('click', async (e) => {
  const response = await fetch('/login');
  const data = await response.json();
  if (!data.username) {
    const loginPrompt = document.createElement('div');
    loginPrompt.id = 'login-prompt';
    loginPrompt.innerHTML = `
      
      <p>Please login to add a new point of interest.</p>
      <button id="login-prompt-ok">OK</button>
      
    `;
    document.body.appendChild(loginPrompt);
    const okButton = document.getElementById('login-prompt-ok');
    okButton.addEventListener('click', () => {
      loginPrompt.remove();
    });
    return;
  }


const confirmDialog = document.createElement('div');
confirmDialog.innerHTML = `<div id="confirm">
  <p>Do you want to add a new point of interest?</p>
  <button id="yesBtn">Yes</button>
  <button id="noBtn">No</button>
</div>`;
confirmDialog.classList.add('modal-dialog');

document.body.appendChild(confirmDialog);

const yesBtn = document.getElementById('yesBtn');
const noBtn = document.getElementById('noBtn');

yesBtn.addEventListener('click', () => {
  document.body.removeChild(confirmDialog);

  const poiDialog = document.createElement('div');
  poiDialog.id = 'addpoi';
  poiDialog.innerHTML = `
    <p>Please enter the POI details:</p>
    <div>
      <label for="nameInput">Name:</label>
      <input type="text" id="nameInput">
    </div>
    <div>
      <label for="typeInput">Type:</label>
      <input type="text" id="typeInput">
    </div>
    <div>
      <label for="countryInput">Country:</label>
      <input type="text" id="countryInput">
    </div>
    <div>
      <label for="regionInput">Region:</label>
      <input type="text" id="regionInput">
    </div>
    <div>
      <label for="descriptionInput">Description:</label>
      <textarea id="descriptionInput"></textarea>
    </div>
    <div id="error-mes"></div>
    <button id="addBtn">Add</button>
    <button id="cancelBtn">Cancel</button>
  `;
  poiDialog.classList.add('modal-dialog');

  document.body.appendChild(poiDialog);

  const addBtn = document.getElementById('addBtn');
  const cancelBtn = document.getElementById('cancelBtn');

  addBtn.addEventListener('click', async () => {
    const name = document.getElementById('nameInput').value;
    const type = document.getElementById('typeInput').value;
    const country = document.getElementById('countryInput').value;
    const region = document.getElementById('regionInput').value;
    const description = document.getElementById('descriptionInput').value;
    let missingFields = [];

        if (!name) {
          missingFields.push("Name");
        }
        if (!type) {
          missingFields.push("Type");
        }
        if (!country) {
          missingFields.push("Country");
        }
        if (!region) {
          missingFields.push("Region");
        }
        if (!description) {
          missingFields.push("Description");
        }

        if (missingFields.length > 0) {
          const messageDiv = document.getElementById('error-mes');
          messageDiv.textContent = missingFields.join(', ') + ' missing';
          return;
        }

    const poi = {
      "name": name,
      "type": type,
      "country": country,
      "region": region,
      "lat": e.latlng.lat,
      "lon": e.latlng.lng,
      "description": description
    };

      try {
        const response = await fetch('/points-of-interest/create', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(poi)
        });

        if(response.status == 200) {
            const marker = L.marker([poi.lat, poi.lon]).addTo(map);
            marker.bindPopup(`<b>${poi.name}</b><br>${poi.description}`).openPopup();
            
            poiDialog.style.display = 'none';
        } else if (response.status == 400) {
            alert("Blank fields");
        } else {
            alert(`Unknown error: code ${response.status}`);
        }
      } catch(e) {
        alert(`Error: ${e}`);
      }
    });

    cancelBtn.addEventListener('click', () => {
      document.body.removeChild(poiDialog);
    });

  });

  noBtn.addEventListener('click', () => {
    document.body.removeChild(confirmDialog);
  });

});
















