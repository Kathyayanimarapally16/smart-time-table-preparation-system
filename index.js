document.addEventListener('DOMContentLoaded', () => {
    // 1. Get data from Storage
    const timetable = Storage.getMasterTimetable(); // Use the Master Timetable

    // 2. Update the Greeting Text
    const sessionText = document.querySelector('main p.text-[#006c55]'); // Matches your HTML
    if (sessionText && timetable) {
        const count = timetable.length;
        sessionText.textContent = `Your system is ready. You have ${count} sections managed.`;
    }

    // This script no longer needs to handle clicks because we put 
    // onclick="" directly into the index.html file.
});