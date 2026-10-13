
const goalForm = document.querySelector("#goal-form");
const goalInput = document.querySelector("#daily-goal");

const foodForm = document.querySelector("#food-form");
const foodNameInput = document.querySelector("#food-name");
const foodCaloriesInput = document.querySelector("#food-calories");

const totalCaloriesElement = document.querySelector("#total-calories");
const remainingCaloriesElement = document.querySelector("#remaining-calories");
const progressBar = document.querySelector("#progress-bar");
const progressTrack = document.querySelector("#progress-track");
const progressLabel = document.querySelector("#progress-label");

const foodList = document.querySelector("#food-list");
const foodCount = document.querySelector("#food-count");
const clearButton = document.querySelector("#clear-button");

const STORAGE_KEY = "calorie-counter-data";

function getToday() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
}

function createInitialState() {
    return {
        date: getToday(),
        goal: 2000,
        foods: []
    };
}

function loadData() {
    try {
        const savedData = localStorage.getItem(STORAGE_KEY);

        if (!savedData) {
            return createInitialState();
        }

        const data = JSON.parse(savedData);

        if (
            !data ||
            typeof data !== "object" ||
            !Array.isArray(data.foods) ||
            !Number.isSafeInteger(data.goal) ||
            data.goal < 1 ||
            data.goal > 100000 ||
            typeof data.date !== "string"
        ) {
            return createInitialState();
        }

        // O diário alimentar começa novamente em um novo dia.
        if (data.date !== getToday()) {
            return {
                ...createInitialState(),
                goal: data.goal
            };
        }

        const validFoods = data.foods.every((food) =>
            food &&
            Number.isSafeInteger(food.id) &&
            typeof food.name === "string" &&
            food.name.trim().length > 0 &&
            Number.isSafeInteger(food.calories) &&
            food.calories >= 0 &&
            food.calories <= 100000
        );

        if (!validFoods) {
            return createInitialState();
        }

        return data;
    } catch (error) {
        console.error("Não foi possível carregar os dados:", error);
        return createInitialState();
    }
}

let state = loadData();

function saveData() {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (error) {
        console.error("Não foi possível salvar os dados:", error);
        alert("Não foi possível salvar os dados neste navegador.");
    }
}

function getTotalCalories() {
    return state.foods.reduce((total, food) => {
        return total + food.calories;
    }, 0);
}

function formatNumber(value) {
    return new Intl.NumberFormat("pt-BR").format(value);
}

function updateSummary() {
    const total = getTotalCalories();
    const remaining = state.goal - total;

    const percentage = Math.min(
        100,
        Math.round((total / state.goal) * 100)
    );

    totalCaloriesElement.textContent = formatNumber(total);

    remainingCaloriesElement.textContent = formatNumber(
        Math.max(0, remaining)
    );

    progressBar.style.width = `${percentage}%`;

    progressTrack.setAttribute("aria-valuenow", percentage);

    progressLabel.textContent = remaining < 0
        ? `Meta ultrapassada em ${formatNumber(Math.abs(remaining))} kcal`
        : `${percentage}% da meta atingida`;

    progressBar.style.backgroundColor = remaining < 0
        ? "#dc4545"
        : "#16a36a";
}

function renderFoods() {
    foodList.replaceChildren();

    foodCount.textContent = state.foods.length === 1
        ? "1 alimento registrado"
        : `${state.foods.length} alimentos registrados`;

    if (state.foods.length === 0) {
        const emptyMessage = document.createElement("li");

        emptyMessage.className = "empty-state";
        emptyMessage.textContent =
            "Nenhum alimento registrado. Adicione sua primeira refeição!";

        foodList.appendChild(emptyMessage);
        return;
    }

    state.foods.forEach((food) => {
        const item = document.createElement("li");
        item.className = "food-item";

        const info = document.createElement("div");
        info.className = "food-info";

        const name = document.createElement("strong");
        name.textContent = food.name;

        const caloriesDescription = document.createElement("span");
        caloriesDescription.textContent = "Valor energético";

        info.append(name, caloriesDescription);

        const actions = document.createElement("div");
        actions.className = "food-actions";

        const calories = document.createElement("span");
        calories.className = "food-calories";
        calories.textContent = `${formatNumber(food.calories)} kcal`;

        const deleteButton = document.createElement("button");
        deleteButton.type = "button";
        deleteButton.className = "delete-button";
        deleteButton.textContent = "Excluir";
        deleteButton.setAttribute(
            "aria-label",
            `Excluir ${food.name}`
        );

        deleteButton.addEventListener("click", () => {
            removeFood(food.id);
        });

        actions.append(calories, deleteButton);
        item.append(info, actions);
        foodList.appendChild(item);
    });
}

function renderApp() {
    goalInput.value = state.goal;
    updateSummary();
    renderFoods();
}

function addFood(name, calories) {
    const food = {
        id: Date.now() + Math.floor(Math.random() * 1000),
        name,
        calories
    };

    state.foods.push(food);

    saveData();
    renderApp();
}

function removeFood(id) {
    state.foods = state.foods.filter((food) => food.id !== id);

    saveData();
    renderApp();
}

foodForm.addEventListener("submit", (event) => {
    event.preventDefault();

    const name = foodNameInput.value.trim();
    const calories = Number(foodCaloriesInput.value);

    if (!name) {
        alert("Digite o nome do alimento.");
        return;
    }

    if (
        !Number.isSafeInteger(calories) ||
        calories < 0 ||
        calories > 100000
    ) {
        alert("Informe uma quantidade válida de calorias.");
        return;
    }

    addFood(name, calories);

    foodForm.reset();
    foodNameInput.focus();
});

goalForm.addEventListener("submit", (event) => {
    event.preventDefault();

    const goal = Number(goalInput.value);

    if (
        !Number.isSafeInteger(goal) ||
        goal < 1 ||
        goal > 100000
    ) {
        alert("Informe uma meta entre 1 e 100.000 kcal.");
        return;
    }

    state.goal = goal;

    saveData();
    renderApp();
});

clearButton.addEventListener("click", () => {
    if (state.foods.length === 0) {
        alert("Não há alimentos para remover.");
        return;
    }

    const confirmed = confirm(
        "Deseja realmente apagar todos os alimentos registrados hoje?"
    );

    if (!confirmed) {
        return;
    }

    state.foods = [];

    saveData();
    renderApp();
});

renderApp();
