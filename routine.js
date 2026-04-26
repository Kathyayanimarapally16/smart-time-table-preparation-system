document.addEventListener('DOMContentLoaded', () => {
    const timeline = document.querySelector('.routine-timeline');
    const fab = document.querySelector('button.fixed.bottom-28'); 

    const render = () => {
        const tasks = Storage.getRoutine();
        timeline.innerHTML = tasks.length ? '' : '<p class="text-center p-10 text-gray-400">No daily tasks added.</p>';
        
        // Sort tasks by time
        tasks.sort((a, b) => a.time.localeCompare(b.time)).forEach(task => {
            const isCompleted = task.completed ? 'checked' : '';
            const textStyle = task.completed ? 'line-through opacity-50' : '';

            timeline.innerHTML += `
                <div class="relative pl-10 pb-8 border-l-2 border-gray-100 ml-4">
                    <!-- The Dot on the timeline -->
                    <div class="absolute -left-[9px] top-0 w-4 h-4 rounded-full ${task.completed ? 'bg-gray-300' : 'bg-[#006c55]'} transition-colors"></div>
                    
                    <div class="bg-white p-5 rounded-3xl shadow-sm border border-gray-100 flex items-center gap-4">
                        <!-- THE TICK BOX -->
                        <input type="checkbox" ${isCompleted} 
                            onclick="toggleTask(${task.id})" 
                            class="w-5 h-5 rounded border-gray-300 text-[#006c55] focus:ring-[#006c55] cursor-pointer">
                        
                        <div class="flex-grow">
                            <div class="flex justify-between items-start">
                                <span class="text-[10px] font-bold ${task.completed ? 'text-gray-400' : 'text-[#006c55]'}">${task.time}</span>
                                <button onclick="deleteTask(${task.id})" class="text-gray-300 hover:text-red-500 transition-colors">
                                    <span class="material-symbols-outlined text-sm">delete</span>
                                </button>
                            </div>
                            <h3 class="font-bold text-on-surface ${textStyle}">${task.name}</h3>
                        </div>
                    </div>
                </div>`;
        });
    };

    // Toggle Task Status (Completed vs Not Completed)
    window.toggleTask = (id) => {
        let tasks = Storage.getRoutine();
        tasks = tasks.map(task => {
            if (task.id === id) {
                return { ...task, completed: !task.completed };
            }
            return task;
        });
        Storage.saveRoutine(tasks);
        render(); // Refresh the list
    };

    // Add New Task with default completed: false
    fab.onclick = () => {
        const name = prompt("Daily Task Name:");
        const time = prompt("Time (HH:MM):", "07:00");
        if(name && time) {
            const tasks = Storage.getRoutine();
            tasks.push({ 
                id: Date.now(), 
                name, 
                time, 
                completed: false // Default state
            });
            Storage.saveRoutine(tasks);
            render();
        }
    };

    window.deleteTask = (id) => {
        const tasks = Storage.getRoutine().filter(t => t.id !== id);
        Storage.saveRoutine(tasks);
        render();
    };

    render();
});