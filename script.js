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
const editModal = document.getElementById("editModal");
const editForm = document.getElementById("editForm");
const editInput = document.getElementById("editInput");
const editDate = document.getElementById("editDate");
const editTime = document.getElementById("editTime");
const editStartDate = document.getElementById("editStartDate");
const editEndDate = document.getElementById("editEndDate");
const editSingleFields = document.getElementById("editSingleFields");
const editRangeFields = document.getElementById("editRangeFields");
const editCancel = document.getElementById("editCancel");

const STORAGE_KEY = "kennyTodoList";
const HISTORY_STORAGE_KEY = "kennyTodoHistory";

let todos = JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
const savedHistory = localStorage.getItem(HISTORY_STORAGE_KEY);
let completionHistory = savedHistory
  ? JSON.parse(savedHistory)
  : todos.filter((todo) => todo.done).map((todo) => createCompletionRecord(todo));
let pendingDeleteId = null;
let pendingDeleteType = null;
let pendingEditId = null;

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

function getTodoSortDate(todo) {
  return todo.type === "range" ? todo.startDate : todo.date;
}

function getTodoTypePriority(todo) {
  return todo.type === "range" ? 1 : 0;
}

function compareTodosBySchedule(firstTodo, secondTodo) {
  const firstDate = getTodoSortDate(firstTodo);
  const secondDate = getTodoSortDate(secondTodo);
  const firstDateTime = firstDate ? new Date(`${firstDate}T00:00`).getTime() : Number.MAX_SAFE_INTEGER;
  const secondDateTime = secondDate ? new Date(`${secondDate}T00:00`).getTime() : Number.MAX_SAFE_INTEGER;

  if (firstDateTime !== secondDateTime) {
    return firstDateTime - secondDateTime;
  }

  const typePriorityDiff = getTodoTypePriority(firstTodo) - getTodoTypePriority(secondTodo);

  if (typePriorityDiff !== 0) {
    return typePriorityDiff;
  }

  return getTodoSortTime(firstTodo) - getTodoSortTime(secondTodo);
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

function syncCompletionRecord(todo) {
  completionHistory = completionHistory.map((record) => {
    if (record.id !== todo.id) {
      return record;
    }

    return {
      ...record,
      type: todo.type || "single",
      text: todo.text,
      date: todo.date || "",
      time: todo.time || "",
      startDate: todo.startDate || "",
      endDate: todo.endDate || ""
    };
  });
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

function getEditMode() {
  return document.querySelector('input[name="editMode"]:checked').value;
}

function setEditMode(mode) {
  const modeInput = document.querySelector(`input[name="editMode"][value="${mode}"]`);

  if (modeInput) {
    modeInput.checked = true;
  }

  updateEditDateMode();
}

function updateEditDateMode() {
  const isRange = getEditMode() === "range";

  editSingleFields.hidden = isRange;
  editRangeFields.hidden = !isRange;
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

function openEditModal(todoId) {
  const todo = todos.find((currentTodo) => currentTodo.id === todoId);

  if (!todo) {
    return;
  }

  pendingEditId = todoId;
  setEditMode(todo.type || "single");
  editInput.value = todo.text;
  editDate.value = todo.date || todo.startDate || "";
  editTime.value = todo.time || "";
  editStartDate.value = todo.startDate || todo.date || "";
  editEndDate.value = todo.endDate || todo.date || "";
  editModal.hidden = false;
  editInput.focus();
}

function closeEditModal() {
  pendingEditId = null;
  editModal.hidden = true;
  editForm.reset();
  setEditMode("single");
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

  const sortedTodos = [...todos].sort(compareTodosBySchedule);

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

    const editButton = document.createElement("button");
    editButton.className = "edit-btn";
    editButton.type = "button";
    editButton.textContent = "编辑";
    editButton.addEventListener("click", () => {
      openEditModal(todo.id);
    });

    const actions = document.createElement("div");
    actions.className = "todo-actions";
    actions.append(editButton, deleteButton);

    content.append(text, date);
    item.append(checkbox, content, actions);
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

document.querySelectorAll('input[name="editMode"]').forEach((modeInput) => {
  modeInput.addEventListener("change", updateEditDateMode);
});

editCancel.addEventListener("click", closeEditModal);

editForm.addEventListener("submit", (event) => {
  event.preventDefault();

  const todo = todos.find((currentTodo) => currentTodo.id === pendingEditId);
  const text = editInput.value.trim();
  const mode = getEditMode();

  if (!todo) {
    closeEditModal();
    return;
  }

  if (text === "") {
    editInput.focus();
    return;
  }

  if (mode === "range" && editStartDate.value > editEndDate.value) {
    editEndDate.focus();
    return;
  }

  todo.type = mode;
  todo.text = text;
  todo.date = mode === "single" ? editDate.value : "";
  todo.time = mode === "single" ? editTime.value : "";
  todo.startDate = mode === "range" ? editStartDate.value : "";
  todo.endDate = mode === "range" ? editEndDate.value : "";

  saveTodos();

  if (todo.done) {
    syncCompletionRecord(todo);
  }

  closeEditModal();
  renderTodos();
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

editModal.addEventListener("click", (event) => {
  if (event.target === editModal) {
    closeEditModal();
  }
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && !confirmModal.hidden) {
    closeDeleteModal();
  }

  if (event.key === "Escape" && !editModal.hidden) {
    closeEditModal();
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
