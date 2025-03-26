class ResponsiveCalendar {
    constructor() {
        this.currentDate = new Date(2025, 2, 1);
        // 从本地存储获取todos，如果没有则使用示例数据
        this.todos = JSON.parse(localStorage.getItem('todos')) || [
        ];

        this.events = this.organizeEventsByDate();
        this.holidays = {
            '2025-3-1': '龙头节',
            '2025-3-8': '三八妇女节',
            '2025-3-12': '植树节',
            '2025-3-31': '上巳节'
        };
        this.init();
    }

    // 将todos组织成按日期的events
    organizeEventsByDate() {
        const eventsByDate = {};
        console.log('todos', this.todos);
        this.todos.forEach(todo => {
            if (!eventsByDate[todo.date]) {
                eventsByDate[todo.date] = [];
            }
            // 根据完成状态添加不同的前缀
            const eventText = `${todo.completed ? '✓ ' : ''}${todo.text}`;
            eventsByDate[todo.date].push(eventText);
        });
        console.log('eventsByDate', eventsByDate);
        return eventsByDate;
    }

    init() {
        this.renderCalendar();
    }

    renderCalendar() {
        const container = document.getElementById('days-container');
        container.innerHTML = '';

        const year = this.currentDate.getFullYear();
        const month = this.currentDate.getMonth();

        document.getElementById('current-month').textContent = `${year}年${month + 1}月`;

        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);

        const startingDay = firstDay.getDay() === 0 ? 6 : firstDay.getDay() - 1;

        // 前一个月的日期
        for (let i = 0; i < startingDay; i++) {
            const prevDay = new Date(year, month, -startingDay + i + 1);
            this.createDayElement(prevDay, container, true);
        }

        // 本月日期
        for (let day = 1; day <= lastDay.getDate(); day++) {
            const currentDay = new Date(year, month, day);
            this.createDayElement(currentDay, container);
        }

        // 下一个月的日期
        const remainingCells = 42 - (startingDay + lastDay.getDate());
        for (let i = 1; i <= remainingCells; i++) {
            const nextDay = new Date(year, month + 1, i);
            this.createDayElement(nextDay, container, true);
        }
    }

    createDayElement(date, container, isOtherMonth = false) {
        const dateKey = this.formatDate(date);
        const day = document.createElement('div');
        day.classList.add('day');
        
        if (isOtherMonth) day.classList.add('other-month');
        
        const today = new Date();
        if (this.formatDate(date) === this.formatDate(today)) {
            day.classList.add('today');
        }

        const holiday = this.holidays[dateKey];
        const event = this.events[dateKey] || [];
        console.log('datekey',dateKey,'events', event);

        day.innerHTML = `
            <div class="day-header">
                <span class="day-number ${holiday ? 'holiday' : ''}">${date.getDate()}</span>
                <span class="holiday">${holiday || ''}</span>
            </div>
            <div class="day-events">
                ${this.renderEvents(dateKey)}
            </div>
        `;
        day.addEventListener('click', () => this.onDateSelect(date));

        // 如果有事件，添加has-events类
        if (event.length > 0) {
            day.classList.add('has-events');
            // 添加title属性，鼠标悬停时显示完整事件
            day.title = event.join('\n');
        }

        container.appendChild(day);
    }

    renderEvents(dateKey) {
        const event = this.events[dateKey] || [];
        return event.slice(0, 3).map(event => 
            `<div class="day-event">${event}</div>`
        ).join('');
    }

    // 修复日期格式化方法
    formatDate(date) {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }

    changeMonth(delta) {
        this.currentDate.setMonth(this.currentDate.getMonth() + delta);
        this.renderCalendar();
    }

    onDateSelect(date) {
        // 跳转到待办事项页面，并选中当前日期
        const formattedDate = this.formatDate(date);
        console.log('date', formattedDate);
        window.location.href = `../../index.html?date=${formattedDate}`;
    }
}

// 创建全局changeMonth函数
function changeMonth(delta) {
    window.calendar.changeMonth(delta);
}

// 在页面加载后初始化日历
document.addEventListener('DOMContentLoaded', () => {
    window.calendar = new ResponsiveCalendar();
});