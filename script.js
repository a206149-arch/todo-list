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
const historyList = document.getElementById("historyList");
const historyEmpty = document.getElementById("historyEmpty");
const confirmModal = document.getElementById("confirmModal");
const confirmNo = document.getElementById("confirmNo");
const confirmYes = document.getElementById("confirmYes");

const STORAGE_KEY = "kennyTodoList";
const HISTORY_STORAGE_KEY = "kennyTodoHistory";

let todos = JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
const savedHistory = localStorage.getItem(HISTORY_STORAGE_KEY);
let completionHistory = savedHistory
  ? JSON.parse(savedHistory)
  : todos.filter((todo) => todo.done).map((todo) => createCompletionRecord(todo));
let pendingDeleteId = null;
let pendingDeleteType = null;

function saveTodos() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(todos));
}

function saveCompletionHistory() {
  localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(completionHistory));
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

function getTodoSortTime(todo) {
  const dateText = todo.type === "range" ? todo.startDate : todo.date;
  const timeText = todo.type === "range" ? "00:00" : todo.time || "00:00";

  if (!dateText) {
    return Number.MAX_SAFE_INTEGER;
  }

  const sortTime = new Date(`${dateText}T${timeText}`).getTime();
  return Number.isNaN(sortTime) ? Number.MAX_SAFE_INTEGER : sortTime;
}

function createCompletionRecord(todo) {
  return {
    id: todo.id,
    type: todo.type || "single",
    text: todo.text,
    date: todo.date || "",
    time: todo.time || "",
    startDate: todo.startDate || "",
    endDate: todo.endDate || "",
    completedAt: todo.completedAt || new Date().toISOString()
  };
}

function addCompletionRecord(todo) {
  completionHistory = completionHistory.filter((record) => record.id !== todo.id);
  completionHistory.unshift(createCompletionRecord(todo));
  saveCompletionHistory();
}

function removeCompletionRecord(todoId) {
  completionHistory = completionHistory.filter((record) => record.id !== todoId);
  saveCompletionHistory();
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

function updateEmptyMessage() {
  emptyMessage.classList.toggle("show", todos.length === 0);
}

function showRewardEffect() {
  const reward = document.createElement("div");
  reward.className = "reward-effect";
  reward.textContent = "完成 +1";

  for (let index = 0; index < 10; index += 1) {
    const dot = document.createElement("span");
    dot.className = "reward-dot";
    const angle = (Math.PI * 2 * index) / 10;
    dot.style.setProperty("--dot-x", `${Math.cos(angle) * 54}px`);
    dot.style.setProperty("--dot-y", `${Math.sin(angle) * 38}px`);
    reward.appendChild(dot);
  }

  document.body.appendChild(reward);

  reward.addEventListener("animationend", (event) => {
    if (event.target === reward) {
      reward.remove();
    }
  });
}

function deleteTodo(todoId) {
  const todoToDelete = todos.find((todo) => todo.id === todoId);

  if (todoToDelete && todoToDelete.done) {
    addCompletionRecord(todoToDelete);
  }

  todos = todos.filter((currentTodo) => currentTodo.id !== todoId);
  saveTodos();
  renderTodos();
}

function deleteHistoryRecord(recordId) {
  completionHistory = completionHistory.filter((record) => record.id !== recordId);
  saveCompletionHistory();
  renderTodos();
}

function openDeleteModal(todoId, deleteType) {
  pendingDeleteId = todoId;
  pendingDeleteType = deleteType;
  confirmModal.hidden = false;
}

function closeDeleteModal() {
  pendingDeleteId = null;
  pendingDeleteType = null;
  confirmModal.hidden = true;
}

function setupDeleteButton(button, todoId, deleteType) {
  button.addEventListener("click", () => {
    openDeleteModal(todoId, deleteType);
  });
}

function renderHistory() {
  const completedTodos = [...completionHistory]
    .sort((firstTodo, secondTodo) => {
      return getTodoSortTime(secondTodo) - getTodoSortTime(firstTodo);
  });

  historyList.innerHTML = "";
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
    taskDate.textContent = `任务：${formatTodoSchedule(todo)}`;

    const completedTime = document.createElement("span");
    completedTime.className = "history-time";
    completedTime.textContent = `完成：${formatDateTime(todo.completedAt)}`;

    const meta = document.createElement("div");
    meta.className = "history-meta";
    meta.append(taskDate, completedTime);

    const deleteButton = document.createElement("button");
    deleteButton.className = "history-delete-btn";
    deleteButton.type = "button";
    deleteButton.textContent = "删除";
    setupDeleteButton(deleteButton, todo.id, "history");

    content.append(text, meta);
    item.append(content, deleteButton);
    historyList.appendChild(item);
  });
}

function renderTodos() {
  todoList.innerHTML = "";

  const sortedTodos = [...todos].sort((firstTodo, secondTodo) => {
      return getTodoSortTime(firstTodo) - getTodoSortTime(secondTodo);
    });

  sortedTodos.forEach((todo) => {
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

      if (todo.done) {
        addCompletionRecord(todo);
      } else {
        removeCompletionRecord(todo.id);
      }

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
    setupDeleteButton(deleteButton, todo.id, "todo");

    content.append(text, date);
    item.append(checkbox, content, deleteButton);
    todoList.appendChild(item);
  });

  updateEmptyMessage();
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

confirmNo.addEventListener("click", closeDeleteModal);

confirmYes.addEventListener("click", () => {
  if (pendingDeleteId !== null) {
    if (pendingDeleteType === "history") {
      deleteHistoryRecord(pendingDeleteId);
    } else {
      deleteTodo(pendingDeleteId);
    }
  }

  closeDeleteModal();
});

confirmModal.addEventListener("click", (event) => {
  if (event.target === confirmModal) {
    closeDeleteModal();
  }
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && !confirmModal.hidden) {
    closeDeleteModal();
  }
});

if (savedHistory === null) {
  saveCompletionHistory();
}

setDefaultDate();
updateDateMode();
renderTodos();

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("./sw.js");
  });
}
