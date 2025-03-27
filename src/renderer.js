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
    console.log('todos', todos);
    console.log("保存到本地存储完成");

    // 通知悬浮窗更新数据
    if (window.require) {
        const { ipcRenderer } = require('electron');
        ipcRenderer.send('todos-updated');
    }
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

// 迁移昨天未完成的任务并删除昨天未完成的任务
function migrateUnfinishedTasks() {
    console.log('todos1', todos);
    const storedLastCheckDate = localStorage.getItem('lastCheckDate');
    // 为空则初始化为昨天
    if (!storedLastCheckDate) {
        const yesterday = new Date(today);
        yesterday.setDate(today.getDate() - 1);
        localStorage.setItem('lastCheckDate', formatDate(yesterday));
        console.log('localStorage', localStorage.getItem('lastCheckDate'));
        return;
    }
    const currentDate = formatDate(today);

    // 如果是新的一天
    if (storedLastCheckDate !== currentDate) {
        // 找出昨天的日期
        const yesterday = new Date(today);
        yesterday.setDate(today.getDate() - 1);
        const yesterdayDate = formatDate(yesterday);

        // 找出昨天未完成的任务
        const unfinishedTasks = todos.filter(todo => 
            todo.date === yesterdayDate && !todo.completed
        );

        // 将未完成任务迁移到今天
        unfinishedTasks.forEach(task => {
            todos.push({
                id: Date.now() + Math.random(), // 确保唯一ID
                text: task.text,
                completed: false,
                date: currentDate
            });
        });

        // 删除昨天未完成的任务
        console.log('todos2', todos);
        todos = todos.filter(todo => !(todo.date === yesterdayDate && !todo.completed));
        console.log('todos3', todos);
        // 更新最后检查日期
        localStorage.setItem('lastCheckDate', currentDate);

        // 保存更新后的任务列表
        saveTodosToLocalStorage();
    }
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
            id: Date.now() + Math.random(), // 确保唯一ID
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
// 初始渲染前先迁移未完成任务
migrateUnfinishedTasks();
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

// 日期选择器
function changeWeekDisplay() {
    // 获取当前日期选择器选中的日期
    const selectedDate = new Date(todoDueDate.value);
    // 获取选中日期的周
    const selectedWeek = getMondayOfCurrentWeek(selectedDate);

    // 更新当前选中日期和周
    currentSelectedDate = formatDate(selectedDate);
    currentWeekStart = selectedWeek;
    updateWeekDisplay();
    renderTodos();

}

function setMidnightListener() {
    // 计算下一个零点的精确时间
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    
    const timeUntilMidnight = tomorrow - now;
    
    // 设置零点触发的定时器
    const midnightTimer = setTimeout(() => {
        console.log('零点同步触发');
        
        // 更新当前日期
        const currentDate = formatDate(new Date());
        
        // 更新选中日期为今天
        currentSelectedDate = currentDate;
        
        // 获取今天所在周的周一
        currentWeekStart = getMondayOfCurrentWeek(new Date());
        
        // 迁移未完成任务
        migrateUnfinishedTasks();
        
        // 更新周显示
        updateWeekDisplay();
        
        // 渲染待办事项
        renderTodos();
        
        // 重新设置下一个零点的监听器
        setMidnightListener();
    }, timeUntilMidnight);
    
    console.log(`下次同步将在 ${timeUntilMidnight/1000/60} 分钟后进行`);
    
    // 返回定时器，以便可以在需要时清除
    return midnightTimer;
}

// 全局变量，存储当前的零点定时器
let midnightSyncTimer;

// 初始化零点同步
function initMidnightSync() {
    // 清除之前可能存在的定时器
    if (midnightSyncTimer) {
        clearTimeout(midnightSyncTimer);
    }
    
    // 设置新的零点同步定时器
    midnightSyncTimer = setMidnightListener();
}

// 在页面加载时初始化零点同步
initMidnightSync();

// 可选：在页面获得焦点时重新检查并同步
window.addEventListener('focus', () => {
    const now = new Date();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    
    // 如果当前时间已经过了零点，立即触发同步
    if (currentHour === 0 && currentMinute === 0) {
        initMidnightSync();
    }
});