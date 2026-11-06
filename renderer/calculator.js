
const foodInput = document.getElementById('calculatorFoodInput');
const searchButton = document.getElementById('calculatorSearchButton');
const searchResults = document.getElementById('calculatorSearchResults');
const foodList = document.getElementById('calculatorFoodList');
const totalNutrition = document.getElementById('totalNutrition');

let addedFoods = [];

// Search for food
async function searchFood() {
    const foodName = foodInput.value.trim();

    if (foodName === '') {
        searchResults.textContent = 'Please enter a food name.';
        return;
    }

    searchResults.textContent = 'Searching...';
    searchButton.disabled = true;

    try {
        const results = await ipcRenderer.invoke('search-food', foodName);

        if (!Array.isArray(results)) {
            searchResults.textContent = results.error || 'Unable to search for food.';
            return;
        }

        if (results.length === 0) {
            searchResults.textContent = 'No food found.';
            return;
        }

        searchResults.innerHTML = '';

        results.forEach(food => {
            const item = document.createElement('div');
            item.className = 'calculator-search-item';

            const name = document.createElement('span');
            name.textContent = food.name;

            const addButton = document.createElement('button');
            addButton.textContent = 'Add Food';
            addButton.className = 'calculator-add-button';

            addButton.addEventListener('click', function () {
                addFood(food.slug, food.name);
            });

            item.appendChild(name);
            item.appendChild(addButton);
            searchResults.appendChild(item);
        });

    } catch (error) {
        searchResults.textContent = 'Unable to search for food.';
    } finally {
        searchButton.disabled = false;
    }
}

// Add food and retrieve nutrition information
async function addFood(foodSlug, foodName) {
    try {
        const result = await ipcRenderer.invoke('get-food-nutrition', foodSlug);

        if (!result || result.error || !result.nutrition) {
            alert('Unable to retrieve nutrition information.');
            return;
        }

        const nutrition = result.nutrition;

        addedFoods.push({
            name: foodName,
            calories: Number(nutrition.energyKcal),
            protein: Number(nutrition.proteinG),
            carbs: Number(nutrition.carbsG),
            fat: Number(nutrition.fatG)
        });

        displayFoods();

    } catch (error) {
        alert('Unable to add food. Please try again.');
    }
}

// Display food table
function displayFoods() {
    foodList.innerHTML = '';

    if (addedFoods.length === 0) {
        foodList.textContent = 'No food added yet.';
        calculateTotal();
        return;
    }

    const wrapper = document.createElement('div');
    wrapper.className = 'calculator-table-wrapper';

    const table = document.createElement('table');
    table.className = 'calculator-table';

    const headers = ['Food', 'Calories', 'Protein', 'Carbs', 'Fat', 'Action'];
    const headerRow = document.createElement('tr');

    headers.forEach(header => {
        const th = document.createElement('th');
        th.textContent = header;
        headerRow.appendChild(th);
    });

    table.appendChild(headerRow);

    addedFoods.forEach((food, index) => {
        const row = document.createElement('tr');

        const values = [
            food.name,
            formatValue(food.calories, ' kcal'),
            formatValue(food.protein, ' g'),
            formatValue(food.carbs, ' g'),
            formatValue(food.fat, ' g')
        ];

        values.forEach((value, columnIndex) => {
            const cell = document.createElement('td');
            cell.textContent = value;

            if (columnIndex === 0) {
                cell.className = 'calculator-food-name';
            }

            row.appendChild(cell);
        });

        const actionCell = document.createElement('td');

        const removeButton = document.createElement('button');
        removeButton.textContent = 'Remove';
        removeButton.className = 'calculator-remove-button';

        removeButton.addEventListener('click', function () {
            addedFoods.splice(index, 1);
            displayFoods();
        });

        actionCell.appendChild(removeButton);
        row.appendChild(actionCell);

        table.appendChild(row);
    });

    wrapper.appendChild(table);
    foodList.appendChild(wrapper);

    calculateTotal();
}

// Format nutrition values
function formatValue(value, unit) {
    if (!Number.isFinite(value)) {
        return '-';
    }

    return Number(value.toFixed(2)) + unit;
}

// Calculate total nutrition
function calculateTotal() {
    let calories = 0;
    let protein = 0;
    let carbs = 0;
    let fat = 0;

    addedFoods.forEach(food => {
        if (Number.isFinite(food.calories)) calories += food.calories;
        if (Number.isFinite(food.protein)) protein += food.protein;
        if (Number.isFinite(food.carbs)) carbs += food.carbs;
        if (Number.isFinite(food.fat)) fat += food.fat;
    });

    totalNutrition.innerHTML = '';

    const totals = [
        'Total Calories: ' + calories.toFixed(2) + ' kcal',
        'Total Protein: ' + protein.toFixed(2) + ' g',
        'Total Carbohydrates: ' + carbs.toFixed(2) + ' g',
        'Total Fat: ' + fat.toFixed(2) + ' g'
    ];

    totals.forEach(item => {
        const paragraph = document.createElement('p');
        paragraph.textContent = item;
        totalNutrition.appendChild(paragraph);
    });
}

// Search button
searchButton.addEventListener('click', searchFood);

// Search using Enter key
foodInput.addEventListener('keydown', function (event) {
    if (event.key === 'Enter') {
        searchFood();
    }
});

// Display initial food list
displayFoods();
