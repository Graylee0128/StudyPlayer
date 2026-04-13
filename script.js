// 1. 初始化資料
const INITIAL_UNITS = {
    "演算法": 16, "作業系統": 56, "離散數學": 46,
    "線性代數": 44, "計組與計結": 106, "資料結構": 70
};

let studyProgress = JSON.parse(localStorage.getItem('study_units_left')) || { ...INITIAL_UNITS };
let myEvents = JSON.parse(localStorage.getItem('study_planner_v3')) || {};

// 2. 頁面切換
function switchPage(pageId) {
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.querySelectorAll('.tab-nav button').forEach(b => b.classList.remove('active'));
    document.getElementById(pageId).classList.add('active');
    document.getElementById(pageId === 'calendar-page' ? 'nav-calendar' : 'nav-config').classList.add('active');
}

// 3. 更新選單顯示
function initCourseOptions() {
    const select = document.getElementById('courseSelect');
    if (!select) return;
    const currentVal = select.value;
    select.innerHTML = '';

    for (let name in studyProgress) {
        let units = studyProgress[name];
        let full = Math.floor(units / 2);
        let half = units % 2;
        let option = document.createElement('option');
        option.value = name;
        option.textContent = `${name} (剩 ${full} 堂${half ? ' + 半堂' : ''})`;
        select.appendChild(option);
    }
    if (currentVal) select.value = currentVal;
    updateUnitsDisplay();
}

function updateUnitsDisplay() {
    const name = document.getElementById('courseSelect').value;
    const units = studyProgress[name];
    const hint = document.getElementById('unitsLeftHint');
    if (hint) hint.textContent = `剩餘庫存：${units} 個半堂時段`;
}

// 4. 重點修正：自動排課邏輯 (循環分配直到排完數量)
// 修改後的排課函式，加入除錯訊息
function autoSchedule() {
    const courseName = document.getElementById('courseSelect').value;
    const selectedPeriods = Array.from(document.querySelectorAll('.period-pref:checked')).map(el => el.value);
    const selectedDays = Array.from(document.querySelectorAll('.day-pref:checked')).map(el => parseInt(el.value));
    let unitsToPlace = parseInt(document.getElementById('unitCount').value) || 0;

    console.log("開始排課:", courseName, "目標數量:", unitsToPlace);

    if (unitsToPlace <= 0 || selectedDays.length === 0 || selectedPeriods.length === 0) {
        alert("請確認數量、星期、時段皆已選擇！");
        return;
    }

    let dateOffset = 0;
    let placedCount = 0; // 紀錄實際塞進去了幾個

    while (unitsToPlace > 0 && dateOffset < 90) {
        let d = new Date();
        d.setDate(d.getDate() + dateOffset);
        let dateKey = d.toISOString().split('T')[0];
        let dayOfWeek = d.getDay();

        if (selectedDays.includes(dayOfWeek)) {
            if (!myEvents[dateKey]) myEvents[dateKey] = { "早": null, "中": null, "晚": null };
            for (let p of selectedPeriods) {
                if (unitsToPlace > 0 && !myEvents[dateKey][p]) {
                    myEvents[dateKey][p] = { name: courseName, color: "#58cc02" };
                    unitsToPlace--;
                    studyProgress[courseName]--;
                    placedCount++;
                }
            }
        }
        dateOffset++;
    }

    console.log("排課結束，實際放入數量:", placedCount);
    saveAndAll();
    render(); // 強制重新渲染
    switchPage('calendar-page');
}

// 5. 其他功能 (保持不變)
function handleTask(date, period, isSuccess) {
    const task = myEvents[date][period];
    delete myEvents[date][period];
    if (!isSuccess) {
        studyProgress[task.name]++;
        alert("已取消並將該時段數量還原至庫存。");
    } else {
        alert(`完成！${task.name} 還剩下 ${studyProgress[task.name]} 個半堂。`);
    }
    saveAndAll();
}

function saveAndAll() {
    localStorage.setItem('study_units_left', JSON.stringify(studyProgress));
    localStorage.setItem('study_planner_v3', JSON.stringify(myEvents));
    initCourseOptions();
    render();
}

function render() {
    const calendar = document.getElementById('calendar');
    if (!calendar) return;
    calendar.innerHTML = '';
    const weekDays = ["日", "一", "二", "三", "四", "五", "六"];

    for (let i = 0; i < 21; i++) { // 顯示未來 21 天
        let d = new Date();
        d.setDate(d.getDate() + i);
        let dateKey = d.toISOString().split('T')[0];
        let dayData = myEvents[dateKey] || { "早": null, "中": null, "晚": null };

        let html = `<div class="card"><strong>${dateKey} (週${weekDays[d.getDay()]})</strong>`;
        ["早", "中", "晚"].forEach(p => {
            let item = dayData[p];
            html += `
            <div class="period-row">
                <span class="period-label">${p}</span>
                ${item ? `
                    <span class="course-tag">${item.name}</span>
                    <div class="action-btns">
                        <button class="btn-icon btn-success" onclick="handleTask('${dateKey}','${p}', true)">✔️</button>
                        <button class="btn-icon btn-fail" onclick="handleTask('${dateKey}','${p}', false)">❌</button>
                    </div>
                ` : '<span class="empty-text">空閒</span>'}
            </div>`;
        });
        calendar.innerHTML += html + `</div>`;
    }
}

function clearAll() {
    if (confirm("這會清空所有排程並重置數量至初始狀態，確定嗎？")) {
        studyProgress = { ...INITIAL_UNITS };
        myEvents = {};
        saveAndAll();
    }
}

// 初始化執行
initCourseOptions();
render();