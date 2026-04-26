document.addEventListener('DOMContentLoaded', () => {
    const grid = document.getElementById('timetableGrid');
    const userHeading = document.getElementById('helloUser');
    
    // Set greeting
    userHeading.textContent = `Hello, ${Storage.getUserName()}.`;

    const subjects = Storage.getTimetable();
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
    
    // Define standard time slots for the grid
    const timeSlots = ["09:50", "10:40", "11:30", "12:20", "01:10", "01:50", "02:40", "03:30", "04:20"];

    timeSlots.forEach(slot => {
        let rowHtml = `<div class="grid grid-cols-6 min-h-[80px]">`;
        rowHtml += `<div class="p-4 text-xs font-bold text-gray-400 border-r border-gray-50">${slot}</div>`;

        days.forEach(day => {
            // Find subject that matches this day AND this hour
            const match = subjects.find(s => s.day === day && s.time.startsWith(slot.substring(0,2)));
            
            if (match) {
                rowHtml += `
                    <div class="p-2 border-r border-gray-50 bg-[#8defce]/20">
                        <div class="bg-white p-2 rounded-xl border border-[#006c55]/20 h-full shadow-sm">
                            <p class="text-[10px] font-extrabold text-[#006c55] leading-tight uppercase">${match.name}</p>
                            <p class="text-[9px] text-gray-500 mt-1 italic">${match.teacher}</p>
                        </div>
                    </div>`;
            } else {
                rowHtml += `<div class="p-2 border-r border-gray-50"></div>`;
            }
        });

        rowHtml += `</div>`;
        grid.innerHTML += rowHtml;
    });
});
// Function to find and display free teachers
function showFreeTeachers() {
    const day = document.getElementById('checkDay').value;
    const time = document.getElementById('checkTime').value;
    const resultContainer = document.getElementById('freeTeachersResult');

    const freeTeachers = Storage.getFreeTeachers(day, time);

    if (freeTeachers.length === 0) {
        resultContainer.innerHTML = `<span class="text-xs text-red-500 font-bold bg-red-50 px-3 py-2 rounded-lg">No teachers are free at this time.</span>`;
        return;
    }

    resultContainer.innerHTML = `<span class="text-[10px] font-bold text-gray-400 uppercase mr-2">Available:</span>` + 
        freeTeachers.map(name => `
            <span class="bg-white text-[#006c55] border border-green-200 px-3 py-1.5 rounded-full text-xs font-black shadow-sm flex items-center gap-1">
                <span class="material-symbols-outlined text-[14px]">check_circle</span>
                ${name}
            </span>
        `).join('');
}