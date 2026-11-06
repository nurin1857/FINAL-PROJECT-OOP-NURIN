
const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');

// API 1: Search Food
ipcMain.handle('search-food', async (event, foodName) => {
    try {
        const url = `https://calortracker.com/api/v1/foods?q=${encodeURIComponent(foodName)}&limit=5`;

        const response = await fetch(url);
        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.error?.message || 'Unable to search for food.');
        }

        return result.data.map(food => ({
            slug: food.slug,
            name: food.name
        }));

    } catch (error) {
        return { error: error.message };
    }
});

// API 2: Retrieve Food Nutrition
ipcMain.handle('get-food-nutrition', async (event, foodSlug) => {
    try {
        const url = `https://calortracker.com/api/v1/foods/${encodeURIComponent(foodSlug)}`;

        const response = await fetch(url);
        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.error?.message || 'Unable to retrieve nutrition information.');
        }

        return {
            nutrition: result.data.per100g
        };

    } catch (error) {
        return { error: error.message };
    }
});

// API 3: Search for Food Pictures
ipcMain.handle('search-food-image', async (event, foodName) => {
    try {
        const url = `https://commons.wikimedia.org/w/api.php?action=query&generator=search&gsrsearch=${encodeURIComponent(foodName)}&gsrnamespace=6&gsrlimit=10&prop=imageinfo&iiprop=url|extmetadata&iiurlwidth=500&format=json`;

        const response = await fetch(url, {
            headers: {
                'User-Agent': 'NutritionPlan/1.0 (student project)'
            }
        });

        const result = await response.json();

        if (!response.ok) {
            throw new Error('Unable to search for food pictures.');
        }

        if (!result.query || !result.query.pages) {
            return null;
        }

        const searchWords = foodName.toLowerCase()
            .replace(/[^a-z0-9 ]/g, ' ')
            .trim()
            .split(/\s+/)
            .map(word => word.endsWith('s') ? word.slice(0, -1) : word);

        const pictures = Object.values(result.query.pages);

        pictures.forEach(picture => {
            const title = picture.title
                .replace(/^File:/i, '')
                .replace(/\.[^.]+$/, '')
                .toLowerCase()
                .replace(/[^a-z0-9 ]/g, ' ');

            const titleWords = title.split(/\s+/)
                .map(word => word.endsWith('s') ? word.slice(0, -1) : word);

            const matches = searchWords.filter(word =>
                titleWords.includes(word)
            ).length;

            picture.score = matches * 10 - (titleWords.length - matches) * 1.5;

            if (title.includes(foodName.toLowerCase())) {
                picture.score += 20;
            }
        });

        pictures.sort((a, b) => b.score - a.score);

        const picture = pictures.find(item =>
            item.score > 0 &&
            item.imageinfo &&
            item.imageinfo.length > 0
        );

        if (!picture) {
            return null;
        }

        const image = picture.imageinfo[0];

        return {
            imageUrl: image.thumburl || image.url,
            sourceUrl: image.descriptionurl,
            license: image.extmetadata?.LicenseShortName?.value || 'Check source page'
        };

    } catch (error) {
        return { error: error.message };
    }
});

// Create application window
function createWindow() {
    const win = new BrowserWindow({
        width: 1200,
        height: 800,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false
        }
    });

    win.loadFile(path.join(__dirname, 'renderer', 'index.html'));
}

app.whenReady().then(() => {
    createWindow();
});
