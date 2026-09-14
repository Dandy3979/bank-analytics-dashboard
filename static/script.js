/**
 * Bank Analytics Dashboard - script.js
 * Flask API: http://127.0.0.1:5050
 */

const API = window.location.origin;

const COLORS = [
  "#1565c0","#2e7d32","#e65100","#6a1b9a","#00695c",
  "#f57f17","#c62828","#0277bd","#4527a0","#558b2f",
  "#00838f","#ad1457","#6d4c41","#37474f","#1b5e20",
];

const fmtMoney = (n) =>
  n >= 1e9 ? `$${(n/1e9).toFixed(2)}B`
  : n >= 1e6 ? `$${(n/1e6).toFixed(2)}M`
  : `$${n?.toLocaleString("en-US",{minimumFractionDigits:0,maximumFractionDigits:0}) ?? 0}`;
const fmtNum = (n) => n?.toLocaleString("vi-VN") ?? "--";

// ═══════════════════════════════
// SAFE FETCH
// ═══════════════════════════════
async function api(url) {
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err) {
    if (url.includes("/api/")) {
      console.error(`[${url}]`, err.message);
      if (err.message.includes("Failed to fetch")) {
        document.getElementById("err-banner").classList.remove("hidden");
      }
    }
    return null;
  }
}

// ═══════════════════════════════
// CHART BUILDERS
// ═══════════════════════════════
function doughnut(id, labels, data, colors) {
  const ctx = document.getElementById(id)?.getContext("2d");
  if (!ctx) return;
  return new Chart(ctx, {
    type: "doughnut",
    data: { labels, datasets: [{ data, backgroundColor: colors||COLORS.slice(0,labels.length), borderWidth:2, hoverOffset:8 }] },
    options: {
      responsive:true, maintainAspectRatio:false, animation:{duration:700},
      plugins: {
        legend: { position:"bottom", labels:{font:{family:"Poppins",size:10}, padding:10, boxWidth:12} },
        tooltip: { callbacks: { label:(c)=>` ${c.label}: ${fmtNum(c.parsed)}` } },
      },
    },
  });
}

function vbar(id, labels, data, colors) {
  const ctx = document.getElementById(id)?.getContext("2d");
  if (!ctx) return;
  return new Chart(ctx, {
    type:"bar",
    data:{ labels, datasets:[{ data, backgroundColor:colors||COLORS.slice(0,labels.length), borderRadius:5, borderWidth:0 }] },
    options:{
      responsive:true, maintainAspectRatio:false, animation:{duration:700},
      plugins:{ legend:{display:false}, tooltip:{callbacks:{label:(c)=>` ${fmtNum(c.parsed.y)}`}} },
      scales:{
        x:{ticks:{font:{family:"Poppins",size:9},maxRotation:40}, grid:{display:false}},
        y:{beginAtZero:true, ticks:{font:{family:"Poppins",size:9}}, grid:{color:"#f0f4f8"}},
      },
    },
  });
}

function hbar(id, labels, data, colors) {
  const ctx = document.getElementById(id)?.getContext("2d");
  if (!ctx) return;
  return new Chart(ctx, {
    type:"bar",
    data:{ labels, datasets:[{ data, backgroundColor:colors||COLORS.slice(0,labels.length), borderRadius:5, borderWidth:0 }] },
    options:{
      indexAxis:"y", responsive:true, maintainAspectRatio:false, animation:{duration:700},
      plugins:{ legend:{display:false}, tooltip:{callbacks:{label:(c)=>` ${fmtNum(c.parsed.x)}`}} },
      scales:{
        x:{beginAtZero:true, ticks:{font:{family:"Poppins",size:9}}, grid:{color:"#f0f4f8"}},
        y:{ticks:{font:{family:"Poppins",size:9}}, grid:{display:false}},
      },
    },
  });
}

// ═══════════════════════════════
// 1. KPI
// ═══════════════════════════════
async function loadOverview() {
  const d = await api(`${API}/api/overview`);
  if (!d) return;
  document.getElementById("k-customers").textContent   = fmtNum(d.total_customers);
  document.getElementById("k-accounts").textContent    = fmtNum(d.total_accounts);
  document.getElementById("k-loans").textContent       = fmtNum(d.total_loans);
  document.getElementById("k-cards").textContent       = fmtNum(d.total_cards);
  document.getElementById("k-employees").textContent   = fmtNum(d.total_employees);
  document.getElementById("k-branches").textContent    = fmtNum(d.total_branches);
  document.getElementById("k-balance").textContent     = fmtMoney(d.total_balance);
  document.getElementById("k-loan-amount").textContent = fmtMoney(d.total_loan_amount);
  document.getElementById("k-credit").textContent      = d.avg_credit_score;
  document.getElementById("k-interest").textContent    = `${d.avg_interest_rate}%`;
  document.getElementById("k-late").textContent        = fmtNum(d.late_payments);
  // Nếu load thành công thì ẩn banner
  document.getElementById("err-banner").classList.add("hidden");
}

// ═══════════════════════════════
// 2. ACCOUNTS
// ═══════════════════════════════
async function loadAccounts() {
  const [byType, byStatus] = await Promise.all([
    api(`${API}/api/accounts-by-type`),
    api(`${API}/api/accounts-by-status`),
  ]);
  if (byType?.length)   doughnut("chartAccType",   byType.map(d=>d.account_type), byType.map(d=>d.count));
  if (byStatus?.length) doughnut("chartAccStatus", byStatus.map(d=>d.status),     byStatus.map(d=>d.count));
}

// ═══════════════════════════════
// 3. CUSTOMERS BY OCCUPATION
// ═══════════════════════════════
async function loadOccupation() {
  const d = await api(`${API}/api/customers-by-occupation`);
  if (!d?.length) return;
  hbar("chartOccupation", d.map(x=>x.occupation), d.map(x=>x.count));
}

// ═══════════════════════════════
// 4. CUSTOMERS BY STATE + FILTER
// ═══════════════════════════════
let allStates = [];
let stateChart = null;

async function loadCustomersByState() {
  const d = await api(`${API}/api/customers-by-state`);
  if (!d?.length) return;
  allStates = d;

  const sel = document.getElementById("state-filter");
  [...d].sort((a,b)=>a.state.localeCompare(b.state)).forEach(({state,total})=>{
    const o = document.createElement("option");
    o.value = state; o.textContent = `${state} (${fmtNum(total)})`;
    sel.appendChild(o);
  });
  renderStateChart(allStates);
}

function renderStateChart(data) {
  if (stateChart) stateChart.destroy();
  document.getElementById("badge-state").textContent =
    data.length === allStates.length ? "Tất cả bang" : data[0]?.state;
  stateChart = vbar("chartStateBar", data.map(d=>d.state), data.map(d=>d.total));
}

document.getElementById("state-filter").addEventListener("change", e=>{
  const v = e.target.value;
  renderStateChart(v==="ALL" ? allStates : allStates.filter(d=>d.state===v));
});
document.getElementById("btn-reset-state").addEventListener("click", ()=>{
  document.getElementById("state-filter").value="ALL";
  renderStateChart(allStates);
});

// ═══════════════════════════════
// 5. CARDS
// ═══════════════════════════════
async function loadCards() {
  const [byType, byStatus] = await Promise.all([
    api(`${API}/api/cards-by-type`),
    api(`${API}/api/cards-by-status`),
  ]);
  if (byType?.length)   doughnut("chartCardType",   byType.map(d=>d.card_type), byType.map(d=>d.count));
  if (byStatus?.length) doughnut("chartCardStatus", byStatus.map(d=>d.status),  byStatus.map(d=>d.count));
}

// ═══════════════════════════════
// 6. EMPLOYEES
// ═══════════════════════════════
async function loadEmployees() {
  const d = await api(`${API}/api/employees-by-role`);
  if (!d?.length) return;
  hbar("chartEmployeeRole", d.map(x=>x.role), d.map(x=>x.count));
}

// ═══════════════════════════════
// 7. LOANS
// ═══════════════════════════════
async function loadLoans() {
  const [byType, byStatus, payments] = await Promise.all([
    api(`${API}/api/loans-by-type`),
    api(`${API}/api/loans-by-status`),
    api(`${API}/api/loan-payments-summary`),
  ]);
  if (byType?.length)   doughnut("chartLoanType",   byType.map(d=>d.loan_type), byType.map(d=>d.count));
  if (byStatus?.length) doughnut("chartLoanStatus", byStatus.map(d=>d.status),  byStatus.map(d=>d.count));
  if (payments?.length) {
    doughnut("chartPaymentStatus",
      payments.map(d=>d.late_payment_flag),
      payments.map(d=>d.count),
      ["#2e7d32","#c62828"]
    );
  }
}

// ═══════════════════════════════
// 8. TOP BRANCHES (chart + table)
// ═══════════════════════════════
let branchChart = null;

async function loadTopBranches() {
  const d = await api(`${API}/api/top-branches`);
  if (!d?.length) return;

  // Chart
  if (branchChart) branchChart.destroy();
  branchChart = new Chart(document.getElementById("chartBranches").getContext("2d"), {
    type:"bar",
    data:{
      labels: d.map(x=>x.branch_name.replace(" Branch ","#")),
      datasets:[{ label:"Tài khoản", data:d.map(x=>x.account_count),
        backgroundColor:COLORS.slice(0,d.length), borderRadius:5, borderWidth:0 }],
    },
    options:{
      responsive:true, maintainAspectRatio:false, animation:{duration:700},
      plugins:{legend:{display:false}, tooltip:{callbacks:{label:(c)=>` ${fmtNum(c.parsed.y)} TK`}}},
      scales:{
        x:{ticks:{font:{family:"Poppins",size:8},maxRotation:40}, grid:{display:false}},
        y:{beginAtZero:true, ticks:{font:{family:"Poppins",size:9}}, grid:{color:"#f0f4f8"}},
      },
    },
  });

  // Table
  const tbody = document.getElementById("branch-tbody");
  tbody.innerHTML = d.map(({branch_name,city,state,account_count,total_balance},i)=>{
    const rc = i===0?"r1":i===1?"r2":i===2?"r3":"";
    const pct = ((account_count/d[0].account_count)*100).toFixed(1);
    return `<tr>
      <td class="rank ${rc}">${i===0?"🥇":i===1?"🥈":i===2?"🥉":i+1}</td>
      <td><strong>${branch_name}</strong></td>
      <td>${city}</td><td>${state}</td>
      <td><div class="bar-c"><div class="bar-t"><div class="bar-f" style="width:${pct}%"></div></div>
      <span class="bar-p">${fmtNum(account_count)}</span></div></td>
      <td>${fmtMoney(total_balance)}</td>
    </tr>`;
  }).join("");
}

// ═══════════════════════════════
// 9. LOAN FILTER TABLE
// ═══════════════════════════════
let loanPage = 1;
const PER = 50;
let loanData = [];

async function loadLoanFilters() {
  const d = await api(`${API}/api/loans/filters`);
  if (!d) return;
  const sType   = document.getElementById("f-loan-type");
  const sStatus = document.getElementById("f-loan-status");
  d.loan_types.forEach(t=>{ const o=document.createElement("option"); o.value=t; o.textContent=t; sType.appendChild(o); });
  d.statuses.forEach(s=>{ const o=document.createElement("option"); o.value=s; o.textContent=s; sStatus.appendChild(o); });
}

async function fetchLoans(page=1) {
  const loanType = document.getElementById("f-loan-type").value;
  const status   = document.getElementById("f-loan-status").value;
  const params   = new URLSearchParams({ page, per_page: PER });
  if (loanType) params.append("loan_type", loanType);
  if (status)   params.append("status", status);

  document.getElementById("loan-loading").classList.remove("hidden");
  const d = await api(`${API}/api/loans?${params}`);
  document.getElementById("loan-loading").classList.add("hidden");

  if (!d?.success) return;
  loanData = d.data;

  // Summary
  const s = d.summary;
  document.getElementById("loan-summary").classList.remove("hidden");
  document.getElementById("ls-count").textContent  = fmtNum(s.total_count);
  document.getElementById("ls-amount").textContent = fmtMoney(s.total_amount);
  document.getElementById("ls-avg").textContent    = fmtMoney(s.avg_amount);
  document.getElementById("ls-rate").textContent   = `${s.avg_rate}%`;

  // Table
  const tbody = document.getElementById("loan-tbody");
  if (!d.data.length) {
    tbody.innerHTML = `<tr><td colspan="8" style="text-align:center;padding:24px;color:#90a4ae">Không tìm thấy kết quả</td></tr>`;
  } else {
    const statusClass = s => s==="Active"?"s-active":s==="Closed"?"s-closed":"s-inactive";
    tbody.innerHTML = d.data.map(r=>`
      <tr>
        <td>${r.loan_id}</td>
        <td>${r.customer_id}</td>
        <td><span style="background:#e3f2fd;color:#1565c0;padding:2px 8px;border-radius:12px;font-size:0.74rem;font-weight:600">${r.loan_type}</span></td>
        <td><strong>${fmtMoney(r.loan_amount)}</strong></td>
        <td>${r.interest_rate}%</td>
        <td>${r.term_months} tháng</td>
        <td>${r.start_date}</td>
        <td><span class="${statusClass(r.status)}">${r.status}</span></td>
      </tr>`).join("");
  }

  // Pagination
  const totalPages = Math.ceil(d.total/PER);
  document.getElementById("loan-pagi").classList.remove("hidden");
  document.getElementById("pg-info").textContent   = `Trang ${page} / ${totalPages||1}`;
  document.getElementById("btn-prev").disabled = page <= 1;
  document.getElementById("btn-next").disabled = page >= totalPages;
  loanPage = page;
}

document.getElementById("btn-apply").addEventListener("click", ()=>fetchLoans(1));
document.getElementById("btn-reset").addEventListener("click", ()=>{
  document.getElementById("f-loan-type").value="";
  document.getElementById("f-loan-status").value="";
  fetchLoans(1);
});
document.getElementById("btn-prev").addEventListener("click", ()=>fetchLoans(loanPage-1));
document.getElementById("btn-next").addEventListener("click", ()=>fetchLoans(loanPage+1));

// ═══════════════════════════════
// EXPORT CSV
// ═══════════════════════════════
document.getElementById("btn-export-csv").addEventListener("click", ()=>{
  if (!loanData.length) { alert("Tìm kiếm trước để có dữ liệu xuất."); return; }
  const headers = ["loan_id","customer_id","branch_id","loan_type","loan_amount","interest_rate","term_months","start_date","status"];
  const rows    = loanData.map(r=>headers.map(h=>`"${r[h]??''}"`).join(","));
  const csv     = [headers.join(","),...rows].join("\n");
  const blob    = new Blob(["\uFEFF"+csv], {type:"text/csv;charset=utf-8;"});
  const url     = URL.createObjectURL(blob);
  const link    = document.createElement("a");
  link.href=url; link.download=`loans_export_${Date.now()}.csv`; link.click();
  URL.revokeObjectURL(url);
});

// ═══════════════════════════════
// EXPORT CHART IMAGE
// ═══════════════════════════════
document.getElementById("btn-export-chart").addEventListener("click", ()=>{
  const canvas = document.getElementById("chartBranches");
  const link   = document.createElement("a");
  link.href     = canvas.toDataURL("image/png");
  link.download = `branches-${Date.now()}.png`;
  link.click();
});

// ═══════════════════════════════
// INIT
// ═══════════════════════════════
async function init() {
  await Promise.allSettled([
    loadOverview(),
    loadAccounts(),
    loadOccupation(),
    loadCustomersByState(),
    loadCards(),
    loadEmployees(),
    loadLoans(),
    loadTopBranches(),
    loadLoanFilters(),
  ]);
  fetchLoans(1);
}

document.addEventListener("DOMContentLoaded", init);
