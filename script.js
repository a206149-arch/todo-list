const todoForm = document.getElementById("todoForm");
const todoInput = document.getElementById("todoInput");
const todoDate = document.getElementById("todoDate");
const todoTime = document.getElementById("todoTime");
const todoStartDate = document.getElementById("todoStartDate");
const todoEndDate = document.getElementById("todoEndDate");
const singleFields = document.getElementById("singleFields");
const rangeFields = document.getElementById("rangeFields");
const todoList = document.getElementById("todoList");
const emptyMessage = document.getElementById("emptyMessage");
const totalCount = document.getElementById("totalCount");
const doneCount = document.getElementById("doneCount");
const historyList = document.getElementById("historyList");
const historyEmpty = document.getElementById("historyEmpty");
const historyCount = document.getElementById("historyCount");

const STORAGE_KEY = "kennyTodoList";

let todos = JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];

function saveTodos() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(todos));
}

function formatDate(dateText) {
  if (!dateText) {
    return "未选择日期";
  }

  const [year, month, day] = dateText.split("-");
  return `${year}年${month}月${day}日`;
}

function formatTime(timeText) {
  if (!timeText) {
    return "";
  }

  const [hour, minute] = timeText.split(":");
  return `${hour}:${minute}`;
}

function getTodoMode() {
  return document.querySelector('input[name="todoMode"]:checked').value;
}

function formatTodoSchedule(todo) {
  if (todo.type === "range") {
    return `${formatDate(todo.startDate)} 至 ${formatDate(todo.endDate)}`;
  }

  const dateText = formatDate(todo.date);
  const timeText = formatTime(todo.time);
  return timeText ? `${dateText} ${timeText}` : dateText;
}

function formatDateTime(dateText) {
  if (!dateText) {
    return "之前已完成";
  }

  const date = new Date(dateText);

  if (Number.isNaN(date.getTime())) {
    return "之前已完成";
  }

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hour = String(date.getHours()).padStart(2, "0");
  const minute = String(date.getMinutes()).padStart(2, "0");

  return `${year}年${month}月${day}日 ${hour}:${minute}`;
}

function setDefaultDate() {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");

  todoDate.value = `${year}-${month}-${day}`;
  todoStartDate.value = `${year}-${month}-${day}`;
  todoEndDate.value = `${year}-${month}-${day}`;
}

function updateDateMode() {
  const isRange = getTodoMode() === "range";

  singleFields.hidden = isRange;
  rangeFields.hidden = !isRange;
}

function updateSummary() {
  const doneTodos = todos.filter((todo) => todo.done).length;

  totalCount.textContent = `${todos.length} 个任务`;
  doneCount.textContent = `${doneTodos} 个已完成`;
  emptyMessage.classList.toggle("show", todos.length === 0);
}

function showRewardEffect() {
  const reward = document.createElement("div");
  reward.className = "reward-effect";
  reward.textContent = "完成 +1";

  for (let index = 0; index < 6; index += 1) {
    const dot = document.createElement("span");
    dot.className = "reward-dot";
    dot.style.setProperty("--dot-x", `${Math.cos(index) * 34}px`);
    dot.style.setProperty("--dot-y", `${Math.sin(index) * 26}px`);
    reward.appendChild(dot);
  }

  document.body.appendChild(reward);

  reward.addEventListener("animationend", (event) => {
    if (event.target === reward) {
      reward.remove();
    }
  });
}

function renderHistory() {
  const completedTodos = todos
    .filter((todo) => todo.done)
    .sort((firstTodo, secondTodo) => {
      const firstTime = new Date(firstTodo.completedAt || 0).getTime();
      const secondTime = new Date(secondTodo.completedAt || 0).getTime();
      return secondTime - firstTime;
    });

  historyList.innerHTML = "";
  historyCount.textContent = `${completedTodos.length} 条记录`;
  historyEmpty.classList.toggle("show", completedTodos.length === 0);

  completedTodos.forEach((todo) => {
    const item = document.createElement("li");
    item.className = "history-item";

    const content = document.createElement("div");
    content.className = "history-content";

    const text = document.createElement("span");
    text.className = "history-text";
    text.textContent = todo.text;

    const taskDate = document.createElement("span");
    taskDate.className = "history-date";
    taskDate.textContent = `任务时间：${formatTodoSchedule(todo)}`;

    const completedTime = document.createElement("span");
    completedTime.className = "history-time";
    completedTime.textContent = `完成时间：${formatDateTime(todo.completedAt)}`;

    const deleteButton = document.createElement("button");
    deleteButton.className = "history-delete-btn";
    deleteButton.type = "button";
    deleteButton.textContent = "删除";
    deleteButton.addEventListener("click", () => {
      todos = todos.filter((currentTodo) => currentTodo.id !== todo.id);
      saveTodos();
      renderTodos();
    });

    content.append(text, taskDate);
    item.append(content, completedTime, deleteButton);
    historyList.appendChild(item);
  });
}

function renderTodos() {
  todoList.innerHTML = "";

  todos.forEach((todo) => {
    const item = document.createElement("li");
    item.className = "todo-item";
    item.classList.toggle("completed", todo.done);

    const checkbox = document.createElement("input");
    checkbox.className = "todo-check";
    checkbox.type = "checkbox";
    checkbox.checked = todo.done;
    checkbox.addEventListener("change", () => {
      const wasDone = todo.done;
      todo.done = checkbox.checked;
      todo.completedAt = checkbox.checked ? new Date().toISOString() : null;
      saveTodos();
      renderTodos();

      if (!wasDone && checkbox.checked) {
        showRewardEffect();
      }
    });

    const content = document.createElement("div");
    content.className = "todo-content";

    const text = document.createElement("span");
    text.className = "todo-text";
    text.textContent = todo.text;

    const date = document.createElement("span");
    date.className = "todo-date";
    date.textContent = formatTodoSchedule(todo);

    const deleteButton = document.createElement("button");
    deleteButton.className = "delete-btn";
    deleteButton.type = "button";
    deleteButton.textContent = "删除";
    deleteButton.addEventListener("click", () => {
      todos = todos.filter((currentTodo) => currentTodo.id !== todo.id);
      saveTodos();
      renderTodos();
    });

    content.append(text, date);
    item.append(checkbox, content, deleteButton);
    todoList.appendChild(item);
  });

  updateSummary();
  renderHistory();
}

todoForm.addEventListener("submit", (event) => {
  event.preventDefault();

  const text = todoInput.value.trim();
  const mode = getTodoMode();

  if (text === "") {
    todoInput.focus();
    return;
  }

  if (mode === "range" && todoStartDate.value > todoEndDate.value) {
    todoEndDate.focus();
    return;
  }

  todos.unshift({
    id: Date.now(),
    type: mode,
    text,
    date: mode === "single" ? todoDate.value : "",
    time: mode === "single" ? todoTime.value : "",
    startDate: mode === "range" ? todoStartDate.value : "",
    endDate: mode === "range" ? todoEndDate.value : "",
    done: false,
    completedAt: null
  });

  saveTodos();
  todoInput.value = "";
  todoTime.value = "";
  todoInput.focus();
  renderTodos();
});

document.querySelectorAll('input[name="todoMode"]').forEach((modeInput) => {
  modeInput.addEventListener("change", updateDateMode);
});

setDefaultDate();
updateDateMode();
renderTodos();

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("./sw.js");
  });
}
