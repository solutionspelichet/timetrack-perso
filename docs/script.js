let calendarMonth = new Date().getMonth();
let calendarYear = new Date().getFullYear();

// Gestion des onglets
document.querySelectorAll(".tab-button").forEach(button => {
  button.addEventListener("click", () => {
    document.querySelectorAll(".tab-button").forEach(b => b.classList.remove("bg-blue-200"));
    document.querySelectorAll(".tab-content").forEach(c => c.classList.add("hidden"));

    button.classList.add("bg-blue-200");
    const tabId = button.getAttribute("data-tab");
    document.getElementById(tabId).classList.remove("hidden");

    if (tabId === "hebdo") loadWeeklyView();
    if (tabId === "calendrier") loadCalendarView();
  });
});

// Pointage début
document.getElementById("start").onclick = async () => {
  const now = new Date();
  const isoDate = now.toISOString().split('T')[0];
  const manualStart = document.getElementById("manualStart").value;
  const startTime = manualStart || now.toTimeString().substring(0, 5);
  if (!manualStart) document.getElementById("manualStart").value = startTime;

  const res = await fetch("https://timetrack-api.onrender.com/api/start", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ date: isoDate, start: startTime }),
  });

  const data = await res.json();
  localStorage.setItem("row", data.row);
  alert(`Début enregistré à ${startTime}`);
};

// Pointage fin
document.getElementById("stop").onclick = () => {
  const now = new Date();
  const time = now.toTimeString().substring(0, 5);
  document.getElementById("manualEnd").value = time;
  alert("Heure de fin prête à enregistrer !");
};

// Enregistrement
document.getElementById("submit").onclick = async () => {
  const row = localStorage.getItem("row");
  const end = document.getElementById("manualEnd").value;
  const pause = document.getElementById("pause").value || 60;
  const note = document.getElementById("note").value || "";

  await fetch("https://timetrack-api.onrender.com/api/finish", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ row, end, pause, note }),
  });

  alert(`Fin de journée enregistrée à ${end}`);
};

// Vue hebdomadaire
async function loadWeeklyView() {
  const today = new Date();
  const startDate = new Date();
  startDate.setDate(today.getDate() - 6);
  const formattedStart = startDate.toISOString().split("T")[0];
  const formattedEnd = today.toISOString().split("T")[0];

  const res = await fetch(`https://timetrack-api.onrender.com/api/range?start=${formattedStart}&end=${formattedEnd}`);
  const data = await res.json();
  const tbody = document.getElementById("hebdo-body");
  tbody.innerHTML = "";

  let totalMinutes = 0;

  data.forEach(row => {
    const [date, debut, fin, pause, durée, note] = row;
    const tr = document.createElement("tr");

    const tdDate = document.createElement("td");
    tdDate.textContent = date;
    tdDate.className = "p-2 border";
    tr.appendChild(tdDate);

    const tdStart = document.createElement("td");
    const inputStart = document.createElement("input");
    inputStart.type = "time";
    inputStart.value = debut || "";
    inputStart.className = "border px-2";
    inputStart.onchange = () => updateCell(date, inputStart.value, null, pause, tr);
    tdStart.appendChild(inputStart);
    tdStart.className = "p-2 border";
    tr.appendChild(tdStart);

    const tdEnd = document.createElement("td");
    const inputEnd = document.createElement("input");
    inputEnd.type = "time";
    inputEnd.value = fin || "";
    inputEnd.className = "border px-2";
    inputEnd.onchange = () => updateCell(date, null, inputEnd.value, pause, tr);
    tdEnd.appendChild(inputEnd);
    tdEnd.className = "p-2 border";
    tr.appendChild(tdEnd);

    const tdPause = document.createElement("td");
    tdPause.textContent = pause || "60 min";
    tdPause.className = "p-2 border";
    tr.appendChild(tdPause);

    const tdDurée = document.createElement("td");
    const durationMinutes = timeDiffInMinutes(debut, fin) - parseInt(pause || 60);
    totalMinutes += durationMinutes > 0 ? durationMinutes : 0;
    tdDurée.textContent = formatMinutes(durationMinutes);
    tdDurée.className = "p-2 border text-center";
    tdDurée.dataset.durationCell = "true";
    tr.appendChild(tdDurée);

    const tdNote = document.createElement("td");
    tdNote.textContent = note || "";
    tdNote.className = "p-2 border";
    tr.appendChild(tdNote);

    tbody.appendChild(tr);
  });

  const totalRow = document.createElement("tr");
  totalRow.innerHTML = `<td colspan="4" class="p-2 border text-right font-bold">Total</td>
                        <td class="p-2 border font-bold">${formatMinutes(totalMinutes)}</td>
                        <td class="p-2 border"></td>`;
  tbody.appendChild(totalRow);
}

// Mise à jour ligne hebdo
async function updateCell(date, newStart, newEnd, pause, rowElement) {
  const rowInputs = rowElement.querySelectorAll("input[type='time']");
  const start = newStart || rowInputs[0].value;
  const end = newEnd || rowInputs[1].value;
  const pauseMinutes = parseInt((pause || "60").toString().replace(" min", ""));

  const res = await fetch("https://timetrack-api.onrender.com/api/update", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ date, start, end, pause: pauseMinutes }),
  });

  const durationCell = rowElement.querySelector("[data-duration-cell]");
  const minutes = timeDiffInMinutes(start, end) - pauseMinutes;
  durationCell.textContent = formatMinutes(minutes);
}

// Calcul durée et format
function timeDiffInMinutes(start, end) {
  if (!start || !end) return 0;
  const [sh, sm] = start.split(":").map(Number);
  const [eh, em] = end.split(":").map(Number);
  return (eh * 60 + em) - (sh * 60 + sm);
}

function formatMinutes(minutes) {
  if (minutes <= 0 || isNaN(minutes)) return "00h00";
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${h.toString().padStart(2, '0')}h${m.toString().padStart(2, '0')}`;
}
