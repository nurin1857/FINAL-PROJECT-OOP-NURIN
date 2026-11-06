
const { ipcRenderer } = require('electron');

// Get HTML elements
const foodInput = document.getElementById('foodInput');
const searchButton = document.getElementById('searchButton');
const foodResults = document.getElementById('foodResults');
const dietSelect = document.getElementById('dietSelect');
const recommendationResults = document.getElementById('recommendationResults');
const saveRecommendationButton = document.getElementById('saveRecommendationButton');
const saveMessage = document.getElementById('saveMessage');

let selectedFoodNutrition = null;
let latestRecommendation = '';
let recommendationReady = false;

// Search food using CalorTracker API
async function searchFood() {
    const foodName = foodInput.value.trim();

    if (foodName === '') {
        alert('Invalid Input!\nFood name cannot be empty. Please enter a food name before searching.');
        return;
    }

    selectedFoodNutrition = null;
    recommendationReady = false;
    latestRecommendation = '';

    recommendationResults.textContent = 'Your food recommendations will appear here.';
    saveMessage.textContent = '';
    foodResults.textContent = 'Searching...';

    try {
        const results = await ipcRenderer.invoke('search-food', foodName);

        if (!Array.isArray(results)) {
            foodResults.textContent = results.error || 'Something went wrong.';
            return;
        }

        if (results.length === 0) {
            foodResults.textContent = 'No food found. Try another name.';
            return;
        }

        foodResults.innerHTML = '';

        results.forEach(food => {
            const foodCard = document.createElement('div');
            const foodInfo = document.createElement('div');
            const foodTitle = document.createElement('h3');
            const viewButton = document.createElement('button');
            const nutritionArea = document.createElement('div');

            foodCard.style.display = 'flex';
            foodCard.style.alignItems = 'center';
            foodCard.style.gap = '20px';
            foodCard.style.flexWrap = 'wrap';

            foodInfo.style.width = '150px';
            foodInfo.style.flexShrink = '0';

            foodTitle.textContent = food.name;
            viewButton.textContent = 'View Nutrition';

            viewButton.addEventListener('click', () => {
                getNutrition(food.slug, food.name, nutritionArea);
            });

            foodInfo.appendChild(foodTitle);
            foodInfo.appendChild(viewButton);

            nutritionArea.style.display = 'flex';
            nutritionArea.style.alignItems = 'center';
            nutritionArea.style.gap = '15px';
            nutritionArea.style.flex = '1';
            nutritionArea.style.minWidth = '250px';

            foodCard.appendChild(foodInfo);
            foodCard.appendChild(nutritionArea);

            foodResults.appendChild(foodCard);
        });

    } catch (error) {
        foodResults.textContent = 'Unable to search for food. Please try again.';
    }
}

// Retrieve and display nutrition information
async function getNutrition(foodSlug, foodName, nutritionArea) {
    nutritionArea.textContent = 'Loading nutrition information...';

    recommendationReady = false;
    latestRecommendation = '';
    selectedFoodNutrition = null;
    saveMessage.textContent = '';

    try {
        const data = await ipcRenderer.invoke('get-food-nutrition', foodSlug);

        if (data.error) {
            nutritionArea.textContent = data.error;
            return;
        }

        const nutrition = data.nutrition;

        const calories = nutrition.energyKcal;
        const protein = nutrition.proteinG;
        const carbs = nutrition.carbsG;
        const fat = nutrition.fatG;

        selectedFoodNutrition = {
            name: foodName,
            calories: calories,
            protein: protein,
            carbs: carbs,
            fat: fat,
            imageUrl: '',
            sourceUrl: '',
            license: ''
        };

        nutritionArea.innerHTML = '';

        const imageArea = document.createElement('div');
        imageArea.style.width = '140px';
        imageArea.style.flexShrink = '0';

        const detailsArea = document.createElement('div');

        nutritionArea.appendChild(imageArea);
        nutritionArea.appendChild(detailsArea);

        // Search for food picture
        try {
            const picture = await ipcRenderer.invoke('search-food-image', foodName);

            if (picture && picture.imageUrl) {
                selectedFoodNutrition.imageUrl = picture.imageUrl;
                selectedFoodNutrition.sourceUrl = picture.sourceUrl || '';
                selectedFoodNutrition.license = picture.license || '';

                const foodImage = document.createElement('img');

                foodImage.src = picture.imageUrl;
                foodImage.alt = foodName;
                foodImage.style.width = '130px';
                foodImage.style.height = '100px';
                foodImage.style.objectFit = 'cover';
                foodImage.style.borderRadius = '8px';

                imageArea.appendChild(foodImage);

                const imageCredit = document.createElement('p');
                const sourceLink = document.createElement('a');

                sourceLink.href = picture.sourceUrl;
                sourceLink.textContent = 'Photo source';
                sourceLink.target = '_blank';
                sourceLink.rel = 'noopener noreferrer';

                imageCredit.appendChild(sourceLink);
                imageCredit.appendChild(
                    document.createTextNode(' | ' + picture.license)
                );

                imageArea.appendChild(imageCredit);

            } else {
                imageArea.textContent = 'No matching picture found.';
            }

        } catch (error) {
            imageArea.textContent = 'Unable to load picture.';
        }

        // Display nutrition details
        const details = [
            ['Calories', calories, 'kcal'],
            ['Protein', protein, 'g'],
            ['Carbohydrates', carbs, 'g'],
            ['Fat', fat, 'g']
        ];

        details.forEach(item => {
            const paragraph = document.createElement('p');

            paragraph.textContent =
                item[0] + ': ' +
                (typeof item[1] === 'number'
                    ? item[1].toFixed(2)
                    : 'N/A') +
                ' ' + item[2];

            detailsArea.appendChild(paragraph);
        });

        generateRecommendation();

    } catch (error) {
        nutritionArea.textContent =
            'Unable to load nutrition information. Please try again.';
    }
}

// Generate food recommendations
function generateRecommendation() {
    const preference = dietSelect.value;

    recommendationReady = false;
    latestRecommendation = '';
    saveMessage.textContent = '';

    if (!selectedFoodNutrition) {
        recommendationResults.textContent =
            'Search for a food and view its nutrition first.';
        return;
    }

    if (preference === '') {
        recommendationResults.textContent =
            'Please select a dietary preference.';
        return;
    }

    const food = selectedFoodNutrition;
    let message = '';

    if (preference === 'high-protein') {
        if (typeof food.protein === 'number' && food.protein >= 10) {
            message = food.name + ' is suitable for a high-protein diet :)';
        } else if (typeof food.protein !== 'number') {
            message = 'Protein information is unavailable !';
        } else {
            message = food.name + ' is low in protein. Try another food !!';
        }

    } else if (preference === 'low-calorie') {
        if (typeof food.calories === 'number' && food.calories <= 100) {
            message = food.name + ' is suitable for a low-calorie diet :)';
        } else if (typeof food.calories !== 'number') {
            message = 'Calorie information is unavailable !';
        } else {
            message = food.name + ' is high in calories. Try another food !!';
        }

    } else if (preference === 'low-carb') {
        if (typeof food.carbs === 'number' && food.carbs <= 15) {
            message = food.name + ' is suitable for a low-carb diet :)';
        } else if (typeof food.carbs !== 'number') {
            message = 'Carbohydrate information is unavailable !';
        } else {
            message = food.name + ' is high in carbohydrates. Try another food !!';
        }

    } else if (preference === 'balanced') {
        if (
            typeof food.protein === 'number' &&
            typeof food.carbs === 'number' &&
            typeof food.fat === 'number' &&
            food.protein >= 3 &&
            food.carbs >= 5 &&
            food.carbs <= 25 &&
            food.fat <= 10
        ) {
            message = food.name + ' is suitable for a balanced diet.';
        } else {
            message = food.name +
                ' is not suitable for a balanced diet !! It does not meet all the balanced diet conditions.';
        }
    }

    latestRecommendation = message;
    recommendationReady = true;
    recommendationResults.textContent = message;
}

// Save recommendation and picture to Local Storage
saveRecommendationButton.addEventListener('click', function() {
    if (!recommendationReady || latestRecommendation === '') {
        saveMessage.textContent =
            'Please generate a food recommendation first.';
        return;
    }

    let savedRecommendations =
        JSON.parse(localStorage.getItem('savedRecommendations')) || [];

    const newRecommendation = {
        food: selectedFoodNutrition.name,
        preference: dietSelect.value,
        recommendation: latestRecommendation,
        imageUrl: selectedFoodNutrition.imageUrl,
        sourceUrl: selectedFoodNutrition.sourceUrl,
        license: selectedFoodNutrition.license,
        date: new Date().toLocaleDateString()
    };

    savedRecommendations.push(newRecommendation);

    localStorage.setItem(
        'savedRecommendations',
        JSON.stringify(savedRecommendations)
    );

    saveMessage.textContent = 'Yeayy, food recommendation is saved successfully !!';
});

// Search button event
searchButton.addEventListener('click', searchFood);

// Enter key event
foodInput.addEventListener('keydown', function(event) {
    if (event.key === 'Enter') {
        searchFood();
    }
});

// Dietary preference event
dietSelect.addEventListener('change', generateRecommendation);
