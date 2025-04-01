const { ipcRenderer } = require('electron');

class TodoFloatWindow {
    constructor() {
        this.floatWindow = document.querySelector('.float-window');
        this.hoverTrigger = document.getElementById('hoverTrigger');
        this.closeBtn = document.getElementById('closeBtn');
        this.todoList = document.getElementById('todoList');

        // this.initEventListeners();
        this.initTodoListRendering();
        // this.autoCollapse();
    }

    initEventListeners() {
        // 鼠标进入窗口或悬停触发区域时展开
        this.floatWindow.addEventListener('mouseenter', () => this.expandWindow());
        this.hoverTrigger.addEventListener('mouseenter', () => this.expandWindow());

        // 鼠标离开窗口时收起
        this.floatWindow.addEventListener('mouseleave', () => this.collapseWindow());

        // 关闭按钮事件
        this.closeBtn.addEventListener('click', () => {
            ipcRenderer.send('close-float-window');
        });
    }

    expandWindow() {
        this.floatWindow.classList.remove('collapsed');
    }

    collapseWindow() {
        this.floatWindow.classList.add('collapsed');
    }

    // autoCollapse() {
    //     // 2秒后自动收起窗口
    //     setTimeout(() => {
    //         this.collapseWindow();
    //     }, 2000);
    // }

    getTodayDateString() {
        const today = new Date();
        return today.toISOString().split('T')[0];
    }

    getTodayUnfinishedTodos() {
        const todos = JSON.parse(localStorage.getItem('todos')) || [];
        const todayDate = this.getTodayDateString();
        
        return todos.filter(todo => 
            todo.date === todayDate && !todo.completed
        );
    }

    renderTodoList() {
        const unfinishedTodos = this.getTodayUnfinishedTodos();
        
        this.todoList.innerHTML = '';
        
        if (unfinishedTodos.length === 0) {
            this.todoList.innerHTML = '<div class="no-todos">今天没有未完成的待办事项</div>';
            return;
        }
        
        unfinishedTodos.forEach(todo => {
            const li = document.createElement('li');
            li.className = 'todo-item';
            li.innerHTML = `<span class="todo-text">${todo.text}</span>`;
            
            // 添加点击事件跳转到主窗口
            li.addEventListener('click', () => {
                ipcRenderer.send('show-main-window');
            });
            
            this.todoList.appendChild(li);
        });
    }

    initTodoListRendering() {
        // 初始渲染
        this.renderTodoList();

        // 每分钟刷新一次待办事项列表
        setInterval(() => this.renderTodoList(), 60000);

        // 监听主窗口的待办事项更新
        ipcRenderer.on('todos-updated', () => this.renderTodoList());
    }
}

// 确保 DOM 加载完成后初始化
document.addEventListener('DOMContentLoaded', () => {
    new TodoFloatWindow();
});