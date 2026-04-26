document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('setupForm');
    const qList = document.getElementById('qList');
    const genBtn = document.getElementById('genBtn');
    let subjects = Storage.getSubjects();

    const render = () => {
        qList.innerHTML = subjects.map((s, i) => `
            <div class="bg-white p-4 rounded-xl flex justify-between border border-gray-100">
                <span><b>${s.name}</b> (${s.day})</span>
                <button onclick="remove(${i})" class="text-red-400">Delete</button>
            </div>
        `).join('');
    };

    form.onsubmit = (e) => {
        e.preventDefault();
        subjects.push({
            name: document.getElementById('sName').value,
            teacher: document.getElementById('sTeacher').value,
            day: document.getElementById('sDay').value,
            time: document.getElementById('sTime').value,
            id: Date.now()
        });
        Storage.saveSubjects(subjects);
        render();
        form.reset();
    };

    window.remove = (i) => {
        subjects.splice(i, 1);
        Storage.saveSubjects(subjects);
        render();
    };

    genBtn.onclick = () => {
        Storage.saveTimetable(subjects);
        window.location.href = 'timetable.html';
    };

    render();
});