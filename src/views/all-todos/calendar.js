class Calendar {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        this.currentDate = new Date();
        this.render();
        this.attachEventListeners();
    }

    getTodos() {
        return JSON.parse(localStorage.getItem('todos')) || [];
    }

    render() {
        const month = this.currentDate.getMonth();
        const year = this.currentDate.getFullYear();
        
        // Update month header
        document.getElementById('current-month').textContent = `${year}年${month + 1}月`;
        
        // Get first and last day of the month
        const firstDay = new Date(year, month, 1).getDay();
        const lastDate = new Date(year, month + 1, 0).getDate();
        
        const datesContainer = document.getElementById('calendar-dates');
        datesContainer.innerHTML = '';
        
        // Add previous month's dates
        for (let i = 0; i < firstDay; i++) {
            const dateEl = document.createElement('div');
            dateEl.classList.add('other-month');
            datesContainer.appendChild(dateEl);
        }
        
        // Add current month's dates
        const todos = this.getTodos();
        const holidays = this.getHolidays(year, month); // For example: {'2025-03-01': '植树节'}
    
        for (let date = 1; date <= lastDate; date++) {
            const dateEl = document.createElement('div');
            const currentDate = new Date(year, month, date);
            const formattedDate = this.formatDate(currentDate);
        
            const todosForDate = todos.filter(todo => todo.date === formattedDate);
        
            dateEl.classList.add('date-cell');
            dateEl.innerHTML = `
                <span class="date-number">${date}</span>
                <div class="todo-preview">${todosForDate.map(t =>t.text).join('<br/>')}</div>
            `;
        
            // Tooltip
            if (todosForDate.length > 0) {
                dateEl.setAttribute('title', todosForDate.map(todo => `${todo.completed ? '✓ ' : ''}${todo.text}`).join('\n'));
            }
        
            // Mark today
            if (this.isSameDate(currentDate, new Date())) {
                dateEl.classList.add('today');
            }
        
            if (todosForDate.length > 0) {
                dateEl.classList.add('has-events');
            }
        
            dateEl.addEventListener('click', () => this.onDateSelect(currentDate));
            datesContainer.appendChild(dateEl);
        }
    }
    

    // Get holidays for the month (just an example, can be expanded for lunar or more holidays)
    getHolidays(year, month) {
        const holidays = {
            // '2025-03-01': '植树节',
            // '2025-03-08': '妇女节',
            // '2025-03-12': '白色情人节',
        };
        return holidays;
    }

    attachEventListeners() {
        document.querySelector('.prev-month').addEventListener('click', () => this.changeMonth(-1));
        document.querySelector('.next-month').addEventListener('click', () => this.changeMonth(1));
    }

    changeMonth(delta) {
        this.currentDate.setMonth(this.currentDate.getMonth() + delta);
        this.render();
    }

    onDateSelect(date) {
        // 跳转到待办事项页面，并选中当前日期
        console.log(date);
        const formattedDate = this.formatDate(date);

        window.location.href = `../../index.html?date=${formattedDate}`;
    }

    formatDate(date) {
        const year = date.getFullYear();
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const day = date.getDate().toString().padStart(2, '0');
        return `${year}-${month}-${day}`;
    }

    isSameDate(date1, date2) {
        return date1.getFullYear() === date2.getFullYear() &&
               date1.getMonth() === date2.getMonth() &&
               date1.getDate() === date2.getDate();
    }
}

// Initialize calendar when page loads
document.addEventListener('DOMContentLoaded', () => {
    new Calendar('calendar-dates');
});
