// 获取DOM元素
const newTodoInput = document.getElementById('newTodoInput');
const todoDueDate = document.getElementById('todoDueDate');
const addTodoBtn = document.getElementById('addTodoBtn');
const todoList = document.getElementById('todoList');
const prevWeekBtn = document.getElementById('prevWeek');
const nextWeekBtn = document.getElementById('nextWeek');
const weekDisplay = document.getElementById('weekDisplay');

// 待办事项数组 - 从本地存储读取
let todos = JSON.parse(localStorage.getItem('todos')) || [];

// 获取当前日期
const today = new Date();
let currentSelectedDate = formatDate(today);
let currentWeekStart = getMondayOfCurrentWeek(today);  // 设置为周一

// 保存todos到本地存储
function saveTodosToLocalStorage() {
    localStorage.setItem('todos', JSON.stringify(todos));
}

// 格式化日期为 YYYY-MM-DD
function formatDate(date) {
    return date.toISOString().split('T')[0];
}

// 获取传入日期所在周的周一
function getMondayOfCurrentWeek(date) {
    const d = new Date(date);
    const day = d.getDay();
    const diff = day === 0 ? -6 : 1 - day; // 周日偏移为 -6，周一为0，周二为-1...
    d.setDate(d.getDate() + diff);
    return d;
}

// 生成当前周的日期
function generateWeekDates(startDate) {
    const weekDates = [];
    for (let i = 0; i < 7; i++) {
        const date = new Date(startDate);
        date.setDate(startDate.getDate() + i);
        weekDates.push(date);
    }
    return weekDates;
}

// 更新周显示
function updateWeekDisplay() {
    const weekDays = weekDisplay.querySelectorAll('.week-days span');
    const weekDates = generateWeekDates(currentWeekStart);
    const weekNames = ['周一','周二','周三','周四','周五','周六','周日'];

    weekDays.forEach((day, index) => {
        const date = weekDates[index];
        const formattedDate = formatDate(date);

        // 更新日期显示
        day.innerHTML = `${weekNames[index]}<br>${formattedDate.slice(5).replace('-', '-')}`;

        // 设置日期属性
        day.setAttribute('data-date', formattedDate);

        // 切换active状态
        day.classList.toggle('active', formattedDate === currentSelectedDate);

        // 点击事件
        day.onclick = () => {
            currentSelectedDate = formattedDate;
            updateWeekDisplay();
            renderTodos();
        };
    });

    // 设置日期输入框默认值
    todoDueDate.value = currentSelectedDate;
    // todoDueDate.min = formatDate(currentWeekStart);
    // todoDueDate.max = formatDate(new Date(currentWeekStart.getFullYear(), currentWeekStart.getMonth(), currentWeekStart.getDate() + 6));
}

// 渲染待办事项列表
function renderTodos() {
    todoList.innerHTML = '';
    const filteredTodos = todos.filter(todo => todo.date === currentSelectedDate);

    filteredTodos.forEach(todo => {
        const li = document.createElement('li');
        li.classList.add('todo-item');
        if (todo.completed) {
            li.classList.add('completed');
        }

        li.innerHTML = `
            <input type="checkbox" ${todo.completed ? 'checked' : ''}>
            <span class="todo-text">${todo.text}</span>
            <button class="btn-edit">✏️</button>
            <button class="btn-delete">🗑️</button>
        `;

        // 切换完成状态
        const checkbox = li.querySelector('input[type="checkbox"]');
        checkbox.addEventListener('click', () => {
            todo.completed = !todo.completed;
            renderTodos();
            saveTodosToLocalStorage();
        });

        // 编辑按钮
        const editBtn = li.querySelector('.btn-edit');
        editBtn.addEventListener('click', () => {
            const todoText = li.querySelector('.todo-text');
            const currentText = todoText.textContent;

            li.innerHTML = `
                <input type="text" class="edit-input" value="${currentText}">
                <button class="btn-save">保存</button>
            `;

            const saveBtn = li.querySelector('.btn-save');
            const editInput = li.querySelector('.edit-input');

            editInput.focus();

            saveBtn.addEventListener('click', () => {
                todo.text = editInput.value.trim();
                renderTodos();
                saveTodosToLocalStorage();
            });

            editInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    todo.text = editInput.value.trim();
                    renderTodos();
                    saveTodosToLocalStorage();
                }
            });
        });

        // 删除按钮
        const deleteBtn = li.querySelector('.btn-delete');
        deleteBtn.addEventListener('click', () => {
            todos = todos.filter(t => t.id !== todo.id);
            renderTodos();
            saveTodosToLocalStorage();
        });

        todoList.appendChild(li);
    });
}

// 添加新的待办事项
function addTodo() {
    const newTodoText = newTodoInput.value.trim();
    const dueDate = todoDueDate.value || currentSelectedDate;

    if (newTodoText) {
        todos.push({
            id: Date.now(),
            text: newTodoText,
            completed: false,
            date: dueDate
        });

        newTodoInput.value = '';
        todoDueDate.value = '';

        currentSelectedDate = dueDate;
        currentWeekStart = getMondayOfCurrentWeek(new Date(currentSelectedDate));

        updateWeekDisplay();
        renderTodos();
        saveTodosToLocalStorage();
    }
}

// 绑定添加按钮事件
addTodoBtn.addEventListener('click', addTodo);

// 回车键添加
newTodoInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        addTodo();
    }
});

// 切换上一周
prevWeekBtn.addEventListener('click', () => {
    currentWeekStart.setDate(currentWeekStart.getDate() - 7);
    const newSelectedDate = new Date(currentSelectedDate);
    newSelectedDate.setDate(newSelectedDate.getDate() - 7);
    currentSelectedDate = formatDate(newSelectedDate);
    updateWeekDisplay();
    renderTodos();
});

// 切换下一周
nextWeekBtn.addEventListener('click', () => {
    currentWeekStart.setDate(currentWeekStart.getDate() + 7);
    const newSelectedDate = new Date(currentSelectedDate);
    newSelectedDate.setDate(newSelectedDate.getDate() + 7);
    currentSelectedDate = formatDate(newSelectedDate);
    updateWeekDisplay();
    renderTodos();
});

// 阻止输入框冒泡，解决输入问题
todoDueDate.addEventListener('click', (e) => e.stopPropagation());
newTodoInput.addEventListener('click', (e) => e.stopPropagation());

// 初始渲染
todoDueDate.value = currentSelectedDate;
updateWeekDisplay();
renderTodos();

// URL 参数处理：跳转到指定日期
const urlParams = new URLSearchParams(window.location.search);
const selectedDateFromUrl = urlParams.get('date');

if (selectedDateFromUrl) {
    currentSelectedDate = selectedDateFromUrl;
    currentWeekStart = getMondayOfCurrentWeek(new Date(currentSelectedDate));
    updateWeekDisplay();
    renderTodos();
}


function generateWeeklyReport() {
    alert("正在生成周报...（此功能可进一步扩展）");
    // 后续可以添加生成PDF、弹出模态框等逻辑
}

// 回到今天
function backToToday() {
    currentSelectedDate = formatDate(today);
    currentWeekStart = getMondayOfCurrentWeek(today);
    updateWeekDisplay();
    renderTodos();
}
