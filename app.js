const STORAGE_KEY = "todo-app:v1";

const state = {
  todos: [],
  filter: "all",
};

const form = document.getElementById("todo-form");
const input = document.getElementById("todo-input");
const list = document.getElementById("todo-list");
const itemsLeft = document.getElementById("items-left");
const clearCompletedButton = document.getElementById("clear-completed");
const filterButtons = Array.from(document.querySelectorAll(".filter-btn"));
const itemTemplate = document.getElementById("todo-item-template");

function generateId() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }

  return `todo-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function loadTodos() {
  try {
    const rawValue = localStorage.getItem(STORAGE_KEY);
    const parsed = rawValue ? JSON.parse(rawValue) : [];

    if (Array.isArray(parsed)) {
      state.todos = parsed;
    }
  } catch (error) {
    console.error("Не удалось загрузить задачи:", error);
    state.todos = [];
  }
}

function saveTodos() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state.todos));
}

function matchesFilter(todo, filter) {
  if (filter === "active") {
    return !todo.completed;
  }

  if (filter === "completed") {
    return todo.completed;
  }

  return true;
}

function getEmptyMessage(filter) {
  if (filter === "active") {
    return "Нет активных задач. Все под контролем.";
  }

  if (filter === "completed") {
    return "Пока нет выполненных задач.";
  }

  return "Список пуст. Добавьте первую задачу выше.";
}

function updateFooter() {
  const activeCount = state.todos.filter((todo) => !todo.completed).length;
  const completedCount = state.todos.length - activeCount;

  itemsLeft.textContent = `Осталось: ${activeCount}`;
  clearCompletedButton.disabled = completedCount === 0;
}

function updateFilterButtons() {
  filterButtons.forEach((button) => {
    const isActive = button.dataset.filter === state.filter;
    button.classList.toggle("is-active", isActive);
    button.setAttribute("aria-selected", String(isActive));
  });
}

function createTodoNode(todo, index) {
  const node = itemTemplate.content.firstElementChild.cloneNode(true);
  const checkbox = node.querySelector(".todo-toggle");
  const text = node.querySelector(".todo-text");

  node.dataset.id = todo.id;
  node.style.setProperty("--delay", `${index * 35}ms`);
  node.classList.toggle("is-complete", todo.completed);

  checkbox.checked = todo.completed;
  text.textContent = todo.text;

  return node;
}

function render() {
  const filtered = state.todos.filter((todo) => matchesFilter(todo, state.filter));

  list.innerHTML = "";

  if (filtered.length === 0) {
    const empty = document.createElement("li");
    empty.className = "empty-state";
    empty.textContent = getEmptyMessage(state.filter);
    list.appendChild(empty);
  } else {
    const fragment = document.createDocumentFragment();
    filtered.forEach((todo, index) => fragment.appendChild(createTodoNode(todo, index)));
    list.appendChild(fragment);
  }

  updateFooter();
  updateFilterButtons();
}

function addTodo(text) {
  state.todos.unshift({
    id: generateId(),
    text,
    completed: false,
    createdAt: Date.now(),
  });
}

function setInputErrorState() {
  input.classList.add("shake");
  window.setTimeout(() => input.classList.remove("shake"), 220);
}

form.addEventListener("submit", (event) => {
  event.preventDefault();

  const value = input.value.trim();
  if (!value) {
    setInputErrorState();
    return;
  }

  addTodo(value);
  saveTodos();
  render();
  input.value = "";
  input.focus();
});

list.addEventListener("change", (event) => {
  const target = event.target;
  if (!(target instanceof HTMLInputElement) || !target.classList.contains("todo-toggle")) {
    return;
  }

  const item = target.closest(".todo-item");
  if (!item) {
    return;
  }

  const todo = state.todos.find((entry) => entry.id === item.dataset.id);
  if (!todo) {
    return;
  }

  todo.completed = target.checked;
  saveTodos();
  render();
});

list.addEventListener("click", (event) => {
  const target = event.target;
  if (!(target instanceof HTMLElement)) {
    return;
  }

  const deleteButton = target.closest(".delete-btn");
  if (!deleteButton) {
    return;
  }

  const item = deleteButton.closest(".todo-item");
  if (!item) {
    return;
  }

  state.todos = state.todos.filter((entry) => entry.id !== item.dataset.id);
  saveTodos();
  render();
});

filterButtons.forEach((button) => {
  button.addEventListener("click", () => {
    state.filter = button.dataset.filter || "all";
    render();
  });
});

clearCompletedButton.addEventListener("click", () => {
  state.todos = state.todos.filter((todo) => !todo.completed);
  saveTodos();
  render();
});

loadTodos();
render();
