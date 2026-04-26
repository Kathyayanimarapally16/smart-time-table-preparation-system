const Storage = {
    saveData: (key, data) => localStorage.setItem(key, JSON.stringify(data)),
    getData: (key, defaultVal = []) => {
        const val = localStorage.getItem(key);
        try { return val ? JSON.parse(val) : defaultVal; } catch (e) { return defaultVal; }
    },

    // --- AUTHENTICATION ---
    getAllUsers: () => Storage.getData('app_users', []),
    saveUserToSystem: (user) => {
        const users = Storage.getAllUsers();
        users.push(user);
        Storage.saveData('app_users', users);
    },
    setCurrentUser: (user) => Storage.saveData('current_logged_in_user', user),
    getCurrentUser: () => Storage.getData('current_logged_in_user', null),
    saveUserName: (name) => {
        const user = Storage.getCurrentUser() || {};
        user.name = name;
        Storage.setCurrentUser(user);
    },
    logout: () => { 
        localStorage.removeItem('current_logged_in_user'); 
        window.location.href = 'login.html'; 
    },

    // --- DATA MANAGEMENT ---
    getStructure: () => Storage.getData('app_structure', { years: [] }),
    saveStructure: (struct) => Storage.saveData('app_structure', struct),
    getSubjects: () => Storage.getData('app_subjects', []), 
    saveSubjects: (subs) => Storage.saveData('app_subjects', subs),
    getHeaderInfo: () => Storage.getData('timetable_header', {
        dept: "", acadYear: "", date: "", incharge: "", yearSem: "", coord: "", room: "", signCoord: "", signHOD: ""
    }),
    saveHeaderInfo: (info) => Storage.saveData('timetable_header', info),

   // --- GENERATION ALGORITHM (COLLISION-FREE & SLOT-SHUFFLED) ---
    generateTimetable: () => {
        const struct = Storage.getStructure();
        const allSubs = Storage.getSubjects();
        const masterSchedules = [];
        const globalTeacherBusy = {}; // Format: "NAME-DAY-SLOT"

        const days = ["MON", "TUE", "WED", "THU", "FRI", "SAT"];
        const slots = [1, 2, 3, 4, 5, 6, 7]; 

        // Helper: Split multi-teachers and normalize
        const getTeacherList = (str) => {
            if (!str) return [];
            return str.split(/[&,]|and|\//).map(s => s.trim().toUpperCase()).filter(s => s !== "");
        };

        const isBusy = (teacherStr, day, slot) => {
            return getTeacherList(teacherStr).some(name => globalTeacherBusy[`${name}-${day}-${slot}`]);
        };

        const setBusy = (teacherStr, day, slot) => {
            getTeacherList(teacherStr).forEach(name => {
                globalTeacherBusy[`${name}-${day}-${slot}`] = true;
            });
        };

        // Helper: Check if the same subject was in this slot the day before
        const isSlotRepeat = (grid, subName, day, slot) => {
            const dayIdx = days.indexOf(day);
            if (dayIdx === 0) return false; // Monday has no yesterday
            const yesterday = days[dayIdx - 1];
            return grid[`${yesterday}-${slot}`]?.name === subName;
        };

        struct.years.forEach(y => {
            y.branches.forEach(b => {
                b.sections.forEach((secId) => {
                    const grid = {}; 
                    const secFullId = `${y.name} - ${b.name} - Sec ${secId}`;
                    const secSubs = allSubs.filter(s => s.sectionId === secFullId);
                    if(secSubs.length === 0) return;

                    const labDays = new Set();
                    const dailySpecCount = { MON: 0, TUE: 0, WED: 0, THU: 0, FRI: 0, SAT: 0 };
                    const dayHasTwoPeriodSpec = { MON: false, TUE: false, WED: false, THU: false, FRI: false, SAT: false };

                    const labs = secSubs.filter(s => s.isLab);
                    const specials = secSubs.filter(s => s.isSpecial);
                    const theorySubs = secSubs.filter(s => !s.isLab && !s.isSpecial);

                    // 1. PLACE LABS (Morning/Afternoon Balance)
                    const morningTarget = Math.ceil(labs.length / 2);
                    labs.sort(() => Math.random() - 0.5).forEach((lab, idx) => {
                        let placed = false;
                        const shuffledDays = [...days].sort(() => Math.random() - 0.5);
                        const preferMorning = idx < morningTarget;
                        for (let day of shuffledDays) {
                            if (placed || labDays.has(day)) continue;
                            const blocks = preferMorning ? [[1, 2, 3], [5, 6, 7]] : [[5, 6, 7], [1, 2, 3]];
                            for (let block of blocks) {
                                if (block.every(s => !grid[`${day}-${s}`] && !isBusy(lab.teacher, day, s))) {
                                    block.forEach(s => {
                                        grid[`${day}-${s}`] = { name: lab.name, teacher: lab.teacher, type: 'LAB' };
                                        setBusy(lab.teacher, day, s);
                                    });
                                    labDays.add(day);
                                    placed = true; break;
                                }
                            }
                        }
                    });

                    // 2. PLACE SPECIALS (2+1 Rule, No Period 1, No Repeat Slot)
                    specials.sort((a, b) => parseInt(b.specialCount) - parseInt(a.specialCount)).forEach(spec => {
                        let placed = false;
                        const duration = parseInt(spec.specialCount);
                        const shuffledDays = [...days].sort(() => Math.random() - 0.5);
                        for (let day of shuffledDays) {
                            if (placed || labDays.has(day)) continue;
                            if (dailySpecCount[day] >= 2 || (duration === 2 && dayHasTwoPeriodSpec[day])) continue;

                            const availSlots = slots.filter(s => {
                                if (s === 1) return false;
                                let block = Array.from({length: duration}, (_, i) => s + i);
                                return !block.some(sl => sl > 7 || (sl === 4 && duration > 1)) &&
                                       block.every(sl => !grid[`${day}-${sl}`] && !isBusy(spec.teacher, day, sl) && !isSlotRepeat(grid, spec.name, day, sl));
                            });

                            if (availSlots.length > 0) {
                                let s = availSlots[Math.floor(Math.random() * availSlots.length)];
                                for (let i=0; i<duration; i++) {
                                    grid[`${day}-${s+i}`] = { name: spec.name, teacher: spec.teacher, type: 'SPEC' };
                                    setBusy(spec.teacher, day, s+i);
                                }
                                dailySpecCount[day]++;
                                if (duration === 2) dayHasTwoPeriodSpec[day] = true;
                                placed = true;
                            }
                        }
                    });

                    // 3. INITIAL THEORY PLACEMENT (Mandatory 5, No Slot Repeat)
                    const subWeeklyCount = {};
                    theorySubs.forEach(s => subWeeklyCount[s.id] = 0);
                    theorySubs.forEach(sub => {
                        let attempts = 0;
                        while (subWeeklyCount[sub.id] < 5 && attempts < 200) {
                            const d = days[Math.floor(Math.random() * days.length)];
                            const s = slots[Math.floor(Math.random() * slots.length)];
                            
                            if (!grid[`${d}-${s}`] && !isBusy(sub.teacher, d, s) && !isSlotRepeat(grid, sub.name, d, s)) {
                                const existsToday = Object.keys(grid).some(key => key.startsWith(d) && grid[key].name === sub.name);
                                if (!existsToday) {
                                    grid[`${d}-${s}`] = { name: sub.name, teacher: sub.teacher, type: 'CLASS' };
                                    setBusy(sub.teacher, d, s);
                                    subWeeklyCount[sub.id]++;
                                }
                            }
                            attempts++;
                        }
                    });

                    // 4. AGGRESSIVE FILL (Collision-Free, Try to avoid Slot Repeat)
                    let subIndex = 0;
                    days.forEach(d => {
                        slots.forEach(s => {
                            if (!grid[`${d}-${s}`]) {
                                let found = false;
                                let startIdx = subIndex;
                                do {
                                    const sub = theorySubs[subIndex];
                                    // Layer 1 Check: Global Teacher Busy? (MANDATORY)
                                    // Layer 2 Check: Slot Repeat? (PREFERRED)
                                    if (!isBusy(sub.teacher, d, s)) {
                                        if (!isSlotRepeat(grid, sub.name, d, s) || theorySubs.length < 3) {
                                            grid[`${d}-${s}`] = { name: sub.name, teacher: sub.teacher, type: 'CLASS' };
                                            setBusy(sub.teacher, d, s);
                                            found = true;
                                        }
                                    }
                                    subIndex = (subIndex + 1) % theorySubs.length;
                                } while (!found && subIndex !== startIdx);

                                // Extreme Fallback
                                if (!found) grid[`${d}-${s}`] = { name: "REVISION", teacher: "-", type: "CLASS" };
                            }
                        });
                    });

                    masterSchedules.push({ id: secFullId, grid });
                });
            });
        });
        Storage.saveData('master_timetable', masterSchedules);
    },

    getMasterTimetable: () => Storage.getData('master_timetable', []),
    getRoutine: () => {
        const user = Storage.getCurrentUser();
        return user ? Storage.getData(`routine_${user.email}`, []) : [];
    },
    saveRoutine: (tasks) => {
        const user = Storage.getCurrentUser();
        if (user) Storage.saveData(`routine_${user.email}`, tasks);
    }
};