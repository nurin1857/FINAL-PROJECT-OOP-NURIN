
const foodForm = document.getElementById('foodForm');
const diaryFood = document.getElementById('diaryFood');
const diaryDate = document.getElementById('diaryDate');
const diaryCalories = document.getElementById('diaryCalories');
const diaryProtein = document.getElementById('diaryProtein');
const diaryCarbs = document.getElementById('diaryCarbs');
const diaryFat = document.getElementById('diaryFat');
const foodRecords = document.getElementById('foodRecords');
const dailyTotals = document.getElementById('dailyTotals');
const summaryDate = document.getElementById('summaryDate');
const saveButton = document.getElementById('saveButton');
const savedRecommendationsArea = document.getElementById('savedRecommendations');

// Get today's date
function getTodayDate() {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');

    return year + '-' + month + '-' + day;
}

// Get saved food records from Local Storage
let foodList = JSON.parse(localStorage.getItem('foodList')) || [];
let editingIndex = -1;

// Add today's date to older records that do not have a date
foodList.forEach(food => {
    if (!food.date) {
        food.date = getTodayDate();
    }
});

localStorage.setItem('foodList', JSON.stringify(foodList));

// Set default dates
diaryDate.value = getTodayDate();
summaryDate.value = getTodayDate();

// Display food records
function displayRecords() {
    foodRecords.innerHTML = '';

    if (foodList.length === 0) {
        foodRecords.textContent = 'No food records yet.';
        updateTotals();
        return;
    }

    foodList.forEach((food, index) => {
        const foodCard = document.createElement('div');
        const foodName = document.createElement('h3');
        const foodDetails = document.createElement('p');
        const foodDate = document.createElement('p');
        const editButton = document.createElement('button');
        const deleteButton = document.createElement('button');

        foodName.textContent = food.name;
        foodDate.textContent = 'Date: ' + food.date;

        foodDetails.textContent =
            'Calories: ' + food.calories + ' kcal | ' +
            'Protein: ' + food.protein + ' g | ' +
            'Carbs: ' + food.carbs + ' g | ' +
            'Fat: ' + food.fat + ' g';

        editButton.textContent = 'Edit';
        deleteButton.textContent = 'Delete';

        editButton.addEventListener('click', function() {
            editRecord(index);
        });

        deleteButton.addEventListener('click', function() {
            deleteRecord(index);
        });

        foodCard.appendChild(foodName);
        foodCard.appendChild(foodDate);
        foodCard.appendChild(foodDetails);
        foodCard.appendChild(editButton);
        foodCard.appendChild(deleteButton);

        foodRecords.appendChild(foodCard);
    });

    updateTotals();
}

// Calculate total nutrition for the selected date
function updateTotals() {
    let totalCalories = 0;
    let totalProtein = 0;
    let totalCarbs = 0;
    let totalFat = 0;

    const selectedDate = summaryDate.value;

    foodList.forEach(food => {
        if (food.date === selectedDate) {
            totalCalories += food.calories;
            totalProtein += food.protein;
            totalCarbs += food.carbs;
            totalFat += food.fat;
        }
    });

    dailyTotals.innerHTML = '';

    const totals = [
        'Total Calories: ' + totalCalories.toFixed(2) + ' kcal',
        'Total Protein: ' + totalProtein.toFixed(2) + ' g',
        'Total Carbohydrates: ' + totalCarbs.toFixed(2) + ' g',
        'Total Fat: ' + totalFat.toFixed(2) + ' g'
    ];

    totals.forEach(item => {
        const paragraph = document.createElement('p');
        paragraph.textContent = item;
        dailyTotals.appendChild(paragraph);
    });
}

// Save food record
foodForm.addEventListener('submit', function(event) {
    event.preventDefault();

    const food = {
        name: diaryFood.value.trim(),
        date: diaryDate.value,
        calories: Number(diaryCalories.value),
        protein: Number(diaryProtein.value),
        carbs: Number(diaryCarbs.value),
        fat: Number(diaryFat.value)
    };

    if (food.name === '' || food.date === '') {
        alert('Please enter the food name and date.');
        return;
    }

    if (editingIndex === -1) {
        foodList.push(food);
    } else {
        foodList[editingIndex] = food;
        editingIndex = -1;
        saveButton.textContent = 'Add Record';
    }

    localStorage.setItem('foodList', JSON.stringify(foodList));

    displayRecords();
    foodForm.reset();
    diaryDate.value = getTodayDate();
});

// Edit food record
function editRecord(index) {
    const food = foodList[index];

    diaryFood.value = food.name;
    diaryDate.value = food.date;
    diaryCalories.value = food.calories;
    diaryProtein.value = food.protein;
    diaryCarbs.value = food.carbs;
    diaryFat.value = food.fat;

    editingIndex = index;
    saveButton.textContent = 'Update Record';

    diaryFood.focus();
}

// Delete food record
function deleteRecord(index) {
    const confirmDelete = confirm(
        'Are you sure you want to delete this food record?'
    );

    if (confirmDelete) {
        foodList.splice(index, 1);

        localStorage.setItem('foodList', JSON.stringify(foodList));

        displayRecords();

        if (editingIndex === index) {
            editingIndex = -1;
            foodForm.reset();
            diaryDate.value = getTodayDate();
            saveButton.textContent = 'Add Record';
        }
    }
}

// Display saved recommendations with pictures and delete buttons
function displaySavedRecommendations() {
    savedRecommendationsArea.innerHTML = '';

    const savedRecommendations =
        JSON.parse(localStorage.getItem('savedRecommendations')) || [];

    if (savedRecommendations.length === 0) {
        savedRecommendationsArea.textContent =
            'No saved recommendations yet.';
        return;
    }

    savedRecommendations.forEach((item, index) => {
        const recommendationCard = document.createElement('div');
        const foodName = document.createElement('h3');
        const preference = document.createElement('p');
        const recommendation = document.createElement('p');
        const savedDate = document.createElement('p');
        const deleteButton = document.createElement('button');

        foodName.textContent = item.food;
        preference.textContent = 'Diet: ' + item.preference;
        recommendation.textContent = item.recommendation;
        savedDate.textContent = 'Saved on: ' + item.date;

        // Display food picture
        if (item.imageUrl) {
            const foodImage = document.createElement('img');

            foodImage.src = item.imageUrl;
            foodImage.alt = item.food;
            foodImage.style.width = '150px';
            foodImage.style.height = '110px';
            foodImage.style.objectFit = 'cover';
            foodImage.style.borderRadius = '8px';
            foodImage.style.marginBottom = '10px';

            recommendationCard.appendChild(foodImage);
        }

        // Delete saved recommendation
        deleteButton.textContent = 'Delete';

        deleteButton.addEventListener('click', function() {
            const confirmDelete = confirm(
                'Are you sure you want to delete this saved recommendation?'
            );

            if (confirmDelete) {
                savedRecommendations.splice(index, 1);

                localStorage.setItem(
                    'savedRecommendations',
                    JSON.stringify(savedRecommendations)
                );

                displaySavedRecommendations();
            }
        });

        recommendationCard.appendChild(foodName);
        recommendationCard.appendChild(preference);
        recommendationCard.appendChild(recommendation);
        recommendationCard.appendChild(savedDate);
        recommendationCard.appendChild(deleteButton);

        savedRecommendationsArea.appendChild(recommendationCard);
    });
}

// Update summary when the selected date changes
summaryDate.addEventListener('change', updateTotals);

// Display saved records and recommendations when the page opens
displayRecords();
displaySavedRecommendations();
