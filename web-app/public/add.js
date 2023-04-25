document.getElementById('add-form').addEventListener('submit', function(event) {
    event.preventDefault();
    const nameInput = document.getElementById('name-input');
    const typeInput = document.getElementById('type-input');
    const countryInput = document.getElementById('country-input');
    const regionInput = document.getElementById('region-input');
    const lonInput = document.getElementById('lon-input');
    const latInput = document.getElementById('lat-input');
    const descriptionInput = document.getElementById('description-input');
    const messageDiv = document.getElementById('message');
  
    
    messageDiv.textContent = '';
  
    let missingFields = [];
    if (!nameInput.value.trim()) {
      missingFields.push('Name');
    }
    if (!typeInput.value.trim()) {
      missingFields.push('Type');
    }
    if (!countryInput.value.trim()) {
      missingFields.push('Country');
    }
    if (!regionInput.value.trim()) {
      missingFields.push('Region');
    }
    

    

    if (missingFields.length > 0) {
      messageDiv.textContent = missingFields.join(', ') + ' missing';
      return;
    }
    if (isNaN(parseFloat(lonInput.value))) {
      messageDiv.textContent = 'Invalid longitude';
      return;
    }

    if (isNaN(parseFloat(latInput.value))) {
      messageDiv.textContent = 'Invalid latitude';
      return;
    }
  
    const poi = {
      "name": nameInput.value.trim(),
      "type": typeInput.value.trim(),
      "country": countryInput.value.trim(),
      "region": regionInput.value.trim(),
      "lon": parseFloat(lonInput.value),
      "lat": parseFloat(latInput.value),
      "description": descriptionInput.value.trim(),
      "recommendations": 0
    };
  
    fetch(`/points-of-interest/create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(poi)
    })
    .then(response => {
      if (response.status === 200) {
        messageDiv.textContent = 'Point of interest added successfully';
        nameInput.value = '';
        typeInput.value = '';
        countryInput.value = '';
        regionInput.value = '';
        lonInput.value = '';
        latInput.value = '';
        descriptionInput.value = '';
      } else if (response.status === 400) {
        response.json().then(data => {
          const errorMessage = Object.values(data)[0];
          messageDiv.textContent = errorMessage;
        });
      } else {
        messageDiv.textContent = 'Error adding point of interest';
      }
    })
    .catch(error => {
      console.error(error);
      messageDiv.textContent = 'Error adding point of interest';
    });
  });
