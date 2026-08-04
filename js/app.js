// App State
const API_URL = ''; // Same domain for API calls
let currentRole = 'Finance Manager';
let allRequests = [];
let allRegister = [];
let pendingFiles = [];

// Highrise ERP Cost Centers List
const COST_CENTERS = [
  'Pune Head Office (CC-101)',
  'Mumbai Metro Line 3 Project (CC-102)',
  'Nashik Highway Phase 1 (CC-103)',
  'Delhi Airport Expansion (CC-104)',
  'Goregaon Residential Complex (CC-105)',
  'Kolkata IT Park Project (CC-106)'
];

// DOM Elements cache
const viewTitle = document.getElementById('view-title');
const userRoleSelect = document.getElementById('user-role-select');
const userRoleDisplay = document.getElementById('user-role-display');
const userAvatarInitials = document.getElementById('user-avatar-initials');

// Format Currency — displays in Indian short notation (Cr. / L.)
function formatCurrency(amount) {
  const num = parseFloat(amount) || 0;
  if (num >= 10000000) {
    // 1 Crore or more
    const cr = num / 10000000;
    return '₹' + (Number.isInteger(cr) ? cr.toFixed(0) : cr.toFixed(2)) + ' Cr.';
  } else if (num >= 100000) {
    // 1 Lakh or more
    const lakh = num / 100000;
    return '₹' + (Number.isInteger(lakh) ? lakh.toFixed(0) : lakh.toFixed(2)) + ' L';
  } else if (num > 0) {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(num);
  }
  return '₹0';
}

// Format Date — validates year is in realistic range (1990–2099)
function formatDate(dateStr) {
  if (!dateStr) return 'N/A';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return '—';
    const year = d.getFullYear();
    if (year < 1990 || year > 2099) return '—';
    return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  } catch (e) {
    return '—';
  }
}

// Populate Cost Center elements
function populateCostCenters() {
  const selects = [
    document.getElementById('req-cost-center-select'),
    document.getElementById('bg-form-cost-center-select'),
    document.getElementById('cc-report-select')
  ];
  
  selects.forEach(select => {
    if (!select) return;
    select.innerHTML = '';
    
    // Add empty option first for the report filter
    if (select.id === 'cc-report-select') {
      const emptyOpt = document.createElement('option');
      emptyOpt.value = '';
      emptyOpt.textContent = '-- Select Cost Center --';
      select.appendChild(emptyOpt);
    }
    
    COST_CENTERS.forEach(cc => {
      const opt = document.createElement('option');
      opt.value = cc;
      opt.textContent = cc;
      select.appendChild(opt);
    });
  });
}

// Toggle between select and input for Cost Center based on type
function toggleCostCenterField(selectId, inputId, bgType) {
  const select = document.getElementById(selectId);
  const input = document.getElementById(inputId);
  if (!select || !input) return;
  
  if (bgType === 'EMD') {
    select.style.display = 'none';
    select.required = false;
    input.style.display = 'block';
    input.required = true;
  } else {
    select.style.display = 'block';
    select.required = true;
    input.style.display = 'none';
    input.required = false;
  }
}

// Initializer
window.addEventListener('DOMContentLoaded', () => {
  // Select initial role from dropdown
  handleRoleChange(userRoleSelect.value);
  
  // Set default dates
  const today = new Date().toISOString().split('T')[0];
  const reqDueDateInput = document.getElementById('req-due-date');
  if (reqDueDateInput) reqDueDateInput.min = today;
  
  // Populate cost center lists
  populateCostCenters();
  
  // Initialize cost center view fields to match default EMD selection
  toggleCostCenterField('req-cost-center-select', 'req-cost-center-input', 'EMD');
  toggleCostCenterField('bg-form-cost-center-select', 'bg-form-cost-center-input', 'EMD');
  
  // Load initial view
  switchView('dashboard');
});

// View Routing
function switchView(viewId) {
  // Hide all sections
  document.querySelectorAll('.view-section').forEach(section => {
    section.classList.remove('active');
  });
  
  // Deactivate all navigation items
  document.querySelectorAll('.menu-item').forEach(item => {
    item.classList.remove('active');
  });
  
  // Show target section
  const targetSection = document.getElementById(`view-${viewId}`);
  if (targetSection) targetSection.classList.add('active');
  
  // Activate target menu item
  const targetMenuItem = document.getElementById(`nav-${viewId}`);
  if (targetMenuItem) targetMenuItem.classList.add('active');
  
  // Update Header Title
  switch (viewId) {
    case 'dashboard':
      viewTitle.textContent = 'Dashboard Overview';
      loadDashboard();
      break;
    case 'raise-request':
      viewTitle.textContent = 'Raise Bank Guarantee Request';
      resetRequestForm();
      break;
    case 'raise-renewal':
      viewTitle.textContent = 'Raise Bank Guarantee Renewal Request';
      resetRenewalForm();
      break;
    case 'requests-tracker':
      viewTitle.textContent = 'BG Request Tracker';
      loadRequests();
      break;
    case 'register':
      viewTitle.textContent = 'Bank Guarantee Register';
      const regSearch = document.getElementById('register-search');
      if (regSearch) regSearch.value = '';
      loadRegister();
      break;
    case 'reports':
      viewTitle.textContent = 'Reports & Expiry Alerts';
      loadReports();
      break;
    case 'cost-center-report':
      viewTitle.textContent = 'Cost Centre Wise Report';
      initCostCenterReport();
      break;
  }
  
  // Scroll to top
  document.querySelector('.main-content').scrollTop = 0;
}

// Handle User Role Change Simulation
function handleRoleChange(role) {
  currentRole = role;
  userRoleDisplay.textContent = role;
  
  // Avatar Initials
  if (role === 'Tender Team') {
    userAvatarInitials.textContent = 'TT';
    userAvatarInitials.style.background = 'linear-gradient(135deg, #f59e0b, #d97706)';
  } else if (role === 'Finance Manager') {
    userAvatarInitials.textContent = 'FM';
    userAvatarInitials.style.background = 'linear-gradient(135deg, #3b82f6, #1d4ed8)';
  } else {
    userAvatarInitials.textContent = 'CA';
    userAvatarInitials.style.background = 'linear-gradient(135deg, #10b981, #059669)';
  }
  
  // Manage role warning panel
  const reqWarning = document.getElementById('role-warning-request');
  if (reqWarning) {
    reqWarning.style.display = (role === 'Tender Team' || role === 'Contracts Admin') ? 'none' : 'flex';
  }
  
  // Show / Hide buttons based on permissions
  const btnRegisterNew = document.getElementById('btn-register-new-bg');
  if (btnRegisterNew) {
    btnRegisterNew.style.display = (role === 'Finance Manager' || role === 'Contracts Admin') ? 'inline-flex' : 'none';
  }
  
  // Refresh current view logic (e.g. enabling/disabling action buttons)
  const activeSection = document.querySelector('.view-section.active');
  if (activeSection) {
    const viewId = activeSection.id.replace('view-', '');
    if (viewId === 'requests-tracker') loadRequests();
    if (viewId === 'register') loadRegister();
    if (viewId === 'dashboard') loadDashboard();
  }
}

// --- FILE UPLOAD HANDLERS ---
function handleCategoryFileSelect(event, category, listId) {
  const files = event.target.files;
  const listContainer = document.getElementById(listId);
  
  if (!files || files.length === 0) return;
  
  // For singular categories (anything other than 'Others'), clear existing files in this category
  if (category !== 'Others') {
    pendingFiles = pendingFiles.filter(f => f.category !== category);
    listContainer.innerHTML = '';
  }
  
  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    
    // Read file as base64
    const reader = new FileReader();
    reader.onload = function(e) {
      const base64Data = e.target.result;
      
      const fileId = Date.now() + '_' + Math.random().toString(36).substr(2, 9);
      
      // Save in pending files array with category metadata
      pendingFiles.push({
        id: fileId,
        name: file.name,
        type: file.type,
        data: base64Data,
        category: category
      });
      
      renderFileBadge(file.name, fileId, listContainer);
    };
    reader.readAsDataURL(file);
  }
}
function handleFileSelect(event, listId) {
  const files = event.target.files;
  const listContainer = document.getElementById(listId);
  
  if (!files || files.length === 0) return;
  
  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    
    // Read file as base64
    const reader = new FileReader();
    reader.onload = function(e) {
      const base64Data = e.target.result;
      
      const fileId = Date.now() + '_' + Math.random().toString(36).substr(2, 9);
      
      // Save in pending files array
      pendingFiles.push({
        id: fileId,
        name: file.name,
        type: file.type,
        data: base64Data
      });
      
      // Render file badge
      renderFileBadge(file.name, fileId, listContainer);
    };
    reader.readAsDataURL(file);
  }
}

function renderFileBadge(name, fileId, listContainer) {
  const item = document.createElement('div');
  item.className = 'file-item';
  item.id = `file-item-${fileId}`;
  
  // Truncate name
  const displayName = name.length > 30 ? name.substr(0, 20) + '...' + name.substr(name.length - 8) : name;
  
  item.innerHTML = `
    <span class="file-item-name">
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" style="width:16px; height:16px;">
        <path stroke-linecap="round" stroke-linejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
      </svg>
      ${displayName}
    </span>
    <span class="file-item-remove" onclick="removePendingFile('${fileId}', '${listContainer.id}')">&times;</span>
  `;
  listContainer.appendChild(item);
}

function removePendingFile(fileId, listId) {
  pendingFiles = pendingFiles.filter(f => f.id !== fileId);
  const element = document.getElementById(`file-item-${fileId}`);
  if (element) element.remove();
}

// Reset Request Form
function resetRequestForm() {
  const form = document.getElementById('raise-bg-request-form');
  if (form) form.reset();
  const lists = ['req-list-bg-draft', 'req-list-loi', 'req-list-checklist', 'req-list-others'];
  lists.forEach(id => {
    const list = document.getElementById(id);
    if (list) list.innerHTML = '';
  });
  toggleCostCenterField('req-cost-center-select', 'req-cost-center-input', 'EMD');
  pendingFiles = [];
}

// --- FORM AUTO-CALCULATIONS ---
function handleExpiryDateChange(expiryDateStr) {
  const lblAlert = document.getElementById('lbl-auto-alert-date');
  const lblInit = document.getElementById('lbl-auto-init-date');
  
  if (!expiryDateStr) {
    lblAlert.textContent = 'Select Expiry Date';
    lblInit.textContent = 'Select Expiry Date';
    return;
  }
  
  const expiry = new Date(expiryDateStr);
  if (isNaN(expiry.getTime())) {
    lblAlert.textContent = 'Invalid Expiry Date';
    lblInit.textContent = 'Invalid Expiry Date';
    return;
  }
  
  // Renewal Alert Date: Expiry - 30 days
  const alertDate = new Date(expiry);
  alertDate.setDate(expiry.getDate() - 30);
  
  // Renewal Initiation Date: Expiry - 15 days
  const initDate = new Date(expiry);
  initDate.setDate(expiry.getDate() - 15);
  
  lblAlert.textContent = formatDate(alertDate.toISOString().split('T')[0]);
  lblInit.textContent = formatDate(initDate.toISOString().split('T')[0]);
}

function handleStatusChange(status) {
  const groupReleasedDate = document.getElementById('group-released-date');
  const releasedDateInput = document.getElementById('bg-form-released-date');
  
  if (status === 'Released' || status === 'Cancelled') {
    groupReleasedDate.style.display = 'flex';
    releasedDateInput.required = true;
    if (!releasedDateInput.value) {
      releasedDateInput.value = new Date().toISOString().split('T')[0];
    }
  } else {
    groupReleasedDate.style.display = 'none';
    releasedDateInput.required = false;
    releasedDateInput.value = '';
  }
}

// --- GET API DATA ---
async function fetchApi(endpoint, options = {}) {
  try {
    const res = await fetch(`${API_URL}${endpoint}`, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      },
      ...options
    });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(text || `HTTP error ${res.status}`);
    }
    return await res.json();
  } catch (error) {
    console.error(`API Fetch Error (${endpoint}):`, error);
    alert(`Server Communication Error: ${error.message}`);
    throw error;
  }
}

// --- VIEW LOADER HANDLERS ---

// 1. Dashboard View
async function loadDashboard() {
  const dashboardData = await fetchApi('/api/dashboard');
  if (!dashboardData) return;
  
  // Set Metric Cards
  document.getElementById('dashboard-outstanding-count').textContent = dashboardData.outstandingCount;
  document.getElementById('dashboard-total-amount').textContent = formatCurrency(dashboardData.totalAmount);
  document.getElementById('dashboard-margin-money').textContent = formatCurrency(dashboardData.totalMarginMoney);
  
  const urgentAlertsBadge = document.getElementById('dashboard-urgent-alerts');
  urgentAlertsBadge.textContent = dashboardData.urgentCount;
  
  const metricUrgentCard = document.getElementById('metric-expiry-alerts');
  if (dashboardData.urgentCount > 0) {
    metricUrgentCard.className = 'metric-card danger';
  } else {
    metricUrgentCard.className = 'metric-card success';
  }

  // Renders Recent Table
  const tbody = document.getElementById('dashboard-recent-tbody');
  tbody.innerHTML = '';
  
  if (!dashboardData.recentBgs || dashboardData.recentBgs.length === 0) {
    tbody.innerHTML = `<tr><td colspan="7" style="text-align: center; color: var(--text-muted);">No guarantees registered yet.</td></tr>`;
  } else {
    dashboardData.recentBgs.forEach(bg => {
      const tr = document.createElement('tr');
      tr.style.cursor = 'pointer';
      tr.onclick = () => openDetailModal('bg', bg.id);
      tr.innerHTML = `
        <td style="font-weight:700; color: var(--color-primary);">${bg.id}</td>
        <td>${bg.bgNumber || '<i>Pending Issuance</i>'}</td>
        <td>${bg.bgType}</td>
        <td>${bg.beneficiary}</td>
        <td style="font-weight:600;">${formatCurrency(bg.bgAmount)}</td>
        <td>${formatDate(bg.expiryDate)}</td>
        <td><span class="badge badge-${bg.status.toLowerCase()}">${bg.status}</span></td>
      `;
      tbody.appendChild(tr);
    });
  }
  
  // Render Expiry Renewal Alerts Panel (sidebar of dashboard)
  const alertList = document.getElementById('dashboard-alert-list');
  alertList.innerHTML = '';
  
  // Fetch full register to find expiring items
  const register = await fetchApi('/api/register');
  allRegister = register;
  
  const activeBgs = register.filter(bg => bg.status === 'Active' || bg.status === 'Expired');
  const now = new Date();
  
  // Find BGs expired or expiring within 45 days
  const alerts = [];
  activeBgs.forEach(bg => {
    if (!bg.expiryDate) return;
    const exp = new Date(bg.expiryDate);
    const diffTime = exp.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays <= 0) {
      alerts.push({ bg, days: diffDays, severity: 'urgent', text: `EXPIRED on ${formatDate(bg.expiryDate)}` });
    } else if (diffDays <= 15) {
      alerts.push({ bg, days: diffDays, severity: 'urgent', text: `Expires in ${diffDays} days (${formatDate(bg.expiryDate)})` });
    } else if (diffDays <= 30) {
      alerts.push({ bg, days: diffDays, severity: 'warning', text: `Expires in ${diffDays} days (${formatDate(bg.expiryDate)})` });
    }
  });
  
  if (alerts.length === 0) {
    alertList.innerHTML = `<div style="text-align: center; color: var(--text-muted); padding: 20px; font-size: 13px;">No critical renewal alerts.</div>`;
  } else {
    // Sort alerts by urgency (lowest days first)
    alerts.sort((a, b) => a.days - b.days);
    alerts.forEach(alertItem => {
      const itemDiv = document.createElement('div');
      itemDiv.className = 'alert-item';
      itemDiv.style.cursor = 'pointer';
      itemDiv.onclick = () => openDetailModal('bg', alertItem.bg.id);
      itemDiv.innerHTML = `
        <div class="alert-badge-indicator ${alertItem.severity}"></div>
        <div class="alert-details">
          <div class="alert-title">${alertItem.bg.beneficiary}</div>
          <div class="alert-meta">
            <span style="font-weight:600; color: var(--text-primary);">${alertItem.bg.id}</span>
            <span class="alert-pill ${alertItem.severity === 'urgent' ? 'alert-urgent' : 'alert-warning'}">${alertItem.text}</span>
          </div>
          <div style="font-size: 11px; color: var(--text-muted); margin-top: 4px;">
            Bank: ${alertItem.bg.issuingBank || 'Unspecified'} | Amount: ${formatCurrency(alertItem.bg.bgAmount)}
          </div>
        </div>
      `;
      alertList.appendChild(itemDiv);
    });
  }
}

// 2. BG Requests View
async function submitBgRequest(event) {
  event.preventDefault();
  
  const submitBtn = document.getElementById('btn-submit-request');
  submitBtn.disabled = true;
  submitBtn.textContent = 'Submitting Request...';
  
  const bgType = document.getElementById('req-bg-type').value;
  
  // Verify required attachments
  const requiredCategories = ['BG Draft', 'LOI Copy / Tender Document', 'Tender Checklist'];
  for (const cat of requiredCategories) {
    const fileExists = pendingFiles.some(f => f.category === cat);
    if (!fileExists) {
      alert(`Validation Error: Please upload the required attachment for "${cat}".`);
      submitBtn.disabled = false;
      submitBtn.textContent = 'Submit BG Request';
      return;
    }
  }
  
  // Get Cost Center value based on EMD vs non-EMD
  const costCenterVal = (bgType === 'EMD') 
    ? document.getElementById('req-cost-center-input').value 
    : document.getElementById('req-cost-center-select').value;
    
  const payload = {
    projectRef: document.getElementById('req-project-ref').value,
    bgType: bgType,
    costCenter: costCenterVal,
    amount: document.getElementById('req-amount').value,
    dueDate: document.getElementById('req-due-date').value,
    beneficiaryName: document.getElementById('req-beneficiary-name').value,
    beneficiaryAddress: document.getElementById('req-beneficiary-address').value,
    beneficiaryBankName: document.getElementById('req-beneficiary-bank-name').value,
    beneficiaryBankAccount: document.getElementById('req-beneficiary-bank-account').value,
    beneficiaryBankIfsc: document.getElementById('req-beneficiary-bank-ifsc').value,
    duration: document.getElementById('req-duration').value,
    approvalsNeeded: document.getElementById('req-approvals-needed').value,
    remarks: document.getElementById('req-remarks').value,
    requestedBy: `${userRoleDisplay.textContent} (Sumit Verma)`,
    attachments: pendingFiles // holds base64 payloads + category metadata
  };
  
  try {
    const res = await fetchApi('/api/requests', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
    
    if (res.success) {
      alert(`Bank Guarantee Request submitted successfully!\nRequest ID: ${res.request.id}`);
      resetRequestForm();
      switchView('requests-tracker');
    }
  } catch (err) {
    console.error(err);
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = 'Submit BG Request';
  }
}

// 3. Requests Tracker View
async function loadRequests() {
  const requests = await fetchApi('/api/requests');
  allRequests = requests;
  
  const tbody = document.getElementById('requests-tracker-tbody');
  tbody.innerHTML = '';
  
  if (requests.length === 0) {
    tbody.innerHTML = `<tr><td colspan="10" style="text-align: center; color: var(--text-muted);">No requests raised yet.</td></tr>`;
    return;
  }
  
  // Sort requests by newest first
  const sortedRequests = [...requests].reverse();
  
  sortedRequests.forEach(req => {
    const tr = document.createElement('tr');
    
    // Attachments link markup
    let attachmentsMarkup = 'None';
    if (req.attachments && req.attachments.length > 0) {
      attachmentsMarkup = req.attachments.map(att => `
        <a href="${att.path}" download class="attachment-link" onclick="event.stopPropagation()">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25" />
          </svg>
        </a>
      `).join(' ');
    }
    
    // Action items based on roles and approval workflows
    let actionMarkup = '<i>No actions available</i>';
    
    const isAuthorizeToApprove = currentRole === 'Finance Manager' || currentRole === 'Contracts Admin';
    
    if (req.status === 'Pending') {
      if (isAuthorizeToApprove) {
        actionMarkup = `
          <div style="display:flex; gap:6px;">
            <button class="btn btn-success btn-sm" onclick="event.stopPropagation(); updateRequestStatus('${req.id}', 'Approved')">Approve</button>
            <button class="btn btn-danger btn-sm" onclick="event.stopPropagation(); updateRequestStatus('${req.id}', 'Rejected')">Reject</button>
          </div>
        `;
      } else {
        actionMarkup = `
          <button class="btn btn-danger btn-sm" onclick="event.stopPropagation(); updateRequestStatus('${req.id}', 'Cancelled')">Cancel</button>
        `;
      }
    } else {
      actionMarkup = `<span style="font-size:12px; color: var(--text-muted);">Handled by ${req.approvedBy || 'Admin'}</span>`;
    }
    
    tr.style.cursor = 'pointer';
    tr.onclick = () => openDetailModal('request', req.id);
    tr.innerHTML = `
      <td style="font-weight:700; color: var(--color-primary);">${req.id}</td>
      <td class="col-wrap">${req.projectRef}</td>
      <td>${req.bgType}</td>
      <td style="font-weight:600;">${formatCurrency(req.amount)}</td>
      <td>${formatDate(req.dueDate)}</td>
      <td class="col-wrap">${req.beneficiaryName}</td>
      <td>${req.requestedBy}</td>
      <td>${attachmentsMarkup}</td>
      <td><span class="badge badge-${req.status.toLowerCase()}">${req.status}</span></td>
      <td>${actionMarkup}</td>
    `;
    tbody.appendChild(tr);
  });
}

async function updateRequestStatus(id, newStatus) {
  if (!confirm(`Are you sure you want to change status to "${newStatus}" for Request ${id}?`)) {
    return;
  }
  
  const payload = {
    id: id,
    status: newStatus,
    approvedBy: `${currentRole} (Sumit Verma)`
  };
  
  const res = await fetchApi('/api/requests', {
    method: 'PUT',
    body: JSON.stringify(payload)
  });
  
  if (res.success) {
    if (newStatus === 'Approved') {
      alert(`Request Approved!\nA draft entry has been automatically created in the BG Register.`);
    } else {
      alert(`Request status updated to ${newStatus}.`);
    }
    loadRequests();
  }
}

// 4. BG Register View
async function loadRegister() {
  const register = await fetchApi('/api/register');
  allRegister = register;
  
  const tbody = document.getElementById('register-tbody');
  tbody.innerHTML = '';
  
  if (register.length === 0) {
    tbody.innerHTML = `<tr><td colspan="10" style="text-align: center; color: var(--text-muted);">No guarantees registered yet.</td></tr>`;
    return;
  }
  
  const sortedRegister = [...register].reverse();
  
  const today = new Date();
  today.setHours(0,0,0,0);
  
  sortedRegister.forEach(bg => {
    const tr = document.createElement('tr');
    
    // Compute effective status — auto-detect expired based on date
    let effectiveStatus = bg.status;
    if ((bg.status === 'Active') && bg.expiryDate) {
      const expDate = new Date(bg.expiryDate);
      if (!isNaN(expDate.getTime()) && expDate < today) {
        effectiveStatus = 'Expired';
      }
    }
    
    // Action buttons based on role
    let actionMarkup = '';
    const hasWritePermission = currentRole === 'Finance Manager' || currentRole === 'Contracts Admin';
    
    if (hasWritePermission) {
      actionMarkup = `
        <button class="btn btn-secondary btn-sm" onclick="event.stopPropagation(); openRegisterModal('${bg.id}')">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" style="width:14px; height:14px; margin-right:4px;">
            <path stroke-linecap="round" stroke-linejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L6.832 19.82a4.5 4.5 0 0 1-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 0 1 1.13-1.897L16.863 4.487Zm0 0L19.5 7.125" />
          </svg>
          Edit
        </button>
      `;
    } else {
      actionMarkup = `<button class="btn btn-secondary btn-sm" onclick="event.stopPropagation(); openDetailModal('bg', '${bg.id}')">View Details</button>`;
    }
    
    // FDR & Margin description
    let fdrDetails = '<i>None</i>';
    if (bg.fdrNo || bg.marginMoney) {
      fdrDetails = `
        <div style="font-size:12px;">
          ${bg.fdrNo ? `FDR: <b>${bg.fdrNo}</b><br>` : ''}
          ${bg.marginMoney ? `Margin: <b>${formatCurrency(bg.marginMoney)}</b>` : ''}
        </div>
      `;
    }
    
    // Amendment count badge
    const amdCount = (bg.amendments && bg.amendments.length > 0)
      ? `<span style="font-size:11px; background:var(--color-primary); color:#fff; border-radius:10px; padding:1px 7px; margin-left:4px;">${bg.amendments.length} Amd</span>`
      : '';
    
    tr.style.cursor = 'pointer';
    tr.onclick = () => openDetailModal('bg', bg.id);
    tr.setAttribute('data-search', [
      bg.id, bg.bgNumber, bg.bgType, bg.beneficiary, bg.issuingBank, bg.siteName, effectiveStatus
    ].join(' ').toLowerCase());
    tr.innerHTML = `
      <td style="font-weight:700; color: var(--color-primary);">${bg.id}</td>
      <td>${bg.bgNumber || '<span style="color:var(--color-warning); font-weight:600;">Pending Issuance</span>'}${amdCount}</td>
      <td>${bg.bgType}</td>
      <td class="col-wrap">${bg.beneficiary}</td>
      <td class="col-wrap">${bg.issuingBank || 'N/A'}</td>
      <td style="font-weight:600;">${formatCurrency(bg.bgAmount)}</td>
      <td>${formatDate(bg.expiryDate)}</td>
      <td>${fdrDetails}</td>
      <td><span class="badge badge-${effectiveStatus.toLowerCase()}">${effectiveStatus}</span></td>
      <td>${actionMarkup}</td>
    `;
    tbody.appendChild(tr);
  });
}

// Filter BG Register table by search text
function filterRegisterTable(query) {
  const rows = document.querySelectorAll('#register-tbody tr[data-search]');
  const q = query.toLowerCase().trim();
  rows.forEach(row => {
    row.style.display = (!q || row.getAttribute('data-search').includes(q)) ? '' : 'none';
  });
}

// Export BG Register to CSV
function exportRegisterCsv() {
  if (!allRegister || allRegister.length === 0) {
    alert('No BG records available to export.');
    return;
  }
  
  const today = new Date();
  today.setHours(0,0,0,0);
  
  const headers = ['BG Ref ID','BG Number','BG Type','Beneficiary','Client / Project','Site Name','Issuing Bank','Issue Date','Expiry Date','Amount','Commission','Margin Money','FDR No','Cost Center','Status','Amendments Count','Remarks'];
  let csv = headers.join(',') + '\n';
  
  allRegister.forEach(bg => {
    let effectiveStatus = bg.status;
    if (bg.status === 'Active' && bg.expiryDate) {
      const expDate = new Date(bg.expiryDate);
      if (!isNaN(expDate.getTime()) && expDate < today) effectiveStatus = 'Expired';
    }
    
    const row = [
      bg.id,
      bg.bgNumber || '',
      bg.bgType,
      `"${(bg.beneficiary||'').replace(/"/g,'""')}"`,
      `"${(bg.clientName||'').replace(/"/g,'""')}"`,
      `"${(bg.siteName||'').replace(/"/g,'""')}"`,
      bg.issuingBank || '',
      bg.issueDate || '',
      bg.expiryDate || '',
      bg.bgAmount || 0,
      bg.bgCommission || 0,
      bg.marginMoney || 0,
      bg.fdrNo || '',
      `"${(bg.costCenter||'').replace(/"/g,'""')}"`,
      effectiveStatus,
      (bg.amendments && bg.amendments.length) || 0,
      `"${(bg.remarks||'').replace(/"/g,'""')}"`
    ];
    csv += row.join(',') + '\n';
  });
  
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `BG_Register_${new Date().toISOString().split('T')[0]}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

// 5. Reports View
async function loadReports() {
  const register = await fetchApi('/api/register');
  allRegister = register;
  applyFilters();
}

function applyFilters() {
  const searchText = document.getElementById('filter-search').value.toLowerCase();
  const bgType = document.getElementById('filter-type').value;
  const status = document.getElementById('filter-status').value;
  const bankText = document.getElementById('filter-bank').value.toLowerCase();
  const expiryFilter = document.getElementById('filter-expiry').value;
  
  const now = new Date();
  const thirtyDays = new Date();
  thirtyDays.setDate(now.getDate() + 30);
  const ninetyDays = new Date();
  ninetyDays.setDate(now.getDate() + 90);
  
  const filtered = allRegister.filter(bg => {
    // Search filter
    const matchesSearch = !searchText || 
      String(bg.id || '').toLowerCase().includes(searchText) ||
      String(bg.bgNumber || '').toLowerCase().includes(searchText) ||
      String(bg.beneficiary || '').toLowerCase().includes(searchText) ||
      String(bg.clientName || '').toLowerCase().includes(searchText) ||
      String(bg.siteName || '').toLowerCase().includes(searchText);
      
    // Type filter
    const matchesType = !bgType || bg.bgType === bgType;
    
    // Status filter
    const matchesStatus = !status || bg.status === status;
    
    // Bank filter
    const matchesBank = !bankText || String(bg.issuingBank || '').toLowerCase().includes(bankText);
    
    // Expiry filter
    let matchesExpiry = true;
    if (expiryFilter) {
      if (!bg.expiryDate) {
        matchesExpiry = false;
      } else {
        const expDate = new Date(bg.expiryDate);
        if (expiryFilter === 'expired') {
          matchesExpiry = expDate < now;
        } else if (expiryFilter === 'expiring-30') {
          matchesExpiry = expDate >= now && expDate <= thirtyDays;
        } else if (expiryFilter === 'expiring-90') {
          matchesExpiry = expDate >= now && expDate <= ninetyDays;
        }
      }
    }
    
    return matchesSearch && matchesType && matchesStatus && matchesBank && matchesExpiry;
  });
  
  // Update UI Counter
  document.getElementById('report-summary-counts').textContent = `Total BGs Found: ${filtered.length}`;
  
  // Render report records
  const tbody = document.getElementById('report-tbody');
  tbody.innerHTML = '';
  
  if (filtered.length === 0) {
    tbody.innerHTML = `<tr><td colspan="13" style="text-align: center; color: var(--text-muted);">No records match the selected filters.</td></tr>`;
    return;
  }
  
  filtered.forEach(bg => {
    const tr = document.createElement('tr');
    tr.style.cursor = 'pointer';
    tr.onclick = () => openDetailModal('bg', bg.id);
    tr.innerHTML = `
      <td style="font-weight:700; color: var(--color-primary);">${bg.id}</td>
      <td>${bg.bgNumber || '<i>Pending</i>'}</td>
      <td>${bg.bgType}</td>
      <td class="col-wrap">${bg.beneficiary}</td>
      <td class="col-wrap">${bg.issuingBank || 'N/A'}</td>
      <td>${formatDate(bg.issueDate)}</td>
      <td>${formatDate(bg.expiryDate)}</td>
      <td style="font-weight:600;">${formatCurrency(bg.bgAmount)}</td>
      <td>${bg.bgCommission ? formatCurrency(bg.bgCommission) : '₹0'}</td>
      <td>${bg.marginMoney ? formatCurrency(bg.marginMoney) : '₹0'}</td>
      <td>${bg.fdrNo || 'N/A'}</td>
      <td>${bg.costCenter || bg.siteName || 'N/A'}</td>
      <td><span class="badge badge-${bg.status.toLowerCase()}">${bg.status}</span></td>
    `;
    tbody.appendChild(tr);
  });
}

function resetFilters() {
  document.getElementById('filter-search').value = '';
  document.getElementById('filter-type').value = '';
  document.getElementById('filter-status').value = '';
  document.getElementById('filter-bank').value = '';
  document.getElementById('filter-expiry').value = '';
  applyFilters();
}

// Export Report to CSV Simulator
function exportToCsvSimulation() {
  // Get currently displayed rows on reports
  const searchText = document.getElementById('filter-search').value.toLowerCase();
  const bgType = document.getElementById('filter-type').value;
  const status = document.getElementById('filter-status').value;
  const bankText = document.getElementById('filter-bank').value.toLowerCase();
  const expiryFilter = document.getElementById('filter-expiry').value;
  
  const now = new Date();
  const thirtyDays = new Date();
  thirtyDays.setDate(now.getDate() + 30);
  const ninetyDays = new Date();
  ninetyDays.setDate(now.getDate() + 90);
  
  const filtered = allRegister.filter(bg => {
    const matchesSearch = !searchText || 
      String(bg.id || '').toLowerCase().includes(searchText) ||
      String(bg.bgNumber || '').toLowerCase().includes(searchText) ||
      String(bg.beneficiary || '').toLowerCase().includes(searchText);
    const matchesType = !bgType || bg.bgType === bgType;
    const matchesStatus = !status || bg.status === status;
    const matchesBank = !bankText || String(bg.issuingBank || '').toLowerCase().includes(bankText);
    
    let matchesExpiry = true;
    if (expiryFilter) {
      if (!bg.expiryDate) {
        matchesExpiry = false;
      } else {
        const expDate = new Date(bg.expiryDate);
        if (expiryFilter === 'expired') { matchesExpiry = expDate < now; }
        else if (expiryFilter === 'expiring-30') { matchesExpiry = expDate >= now && expDate <= thirtyDays; }
        else if (expiryFilter === 'expiring-90') { matchesExpiry = expDate >= now && expDate <= ninetyDays; }
      }
    }
    return matchesSearch && matchesType && matchesStatus && matchesBank && matchesExpiry;
  });

  if (filtered.length === 0) {
    alert("No records to export.");
    return;
  }

  // Construct CSV String
  const headers = ['BG Ref ID', 'BG Number', 'BG Type', 'Beneficiary', 'Client Name', 'Issuing Bank', 'Issue Date', 'Effective Date', 'Expiry Date', 'Claim Expiry Date', 'BG Amount', 'Commission Paid', 'Margin Money', 'FDR No', 'Cost Center', 'Status', 'Renewal Alert Date', 'Renewal Initiation Date', 'Remarks'];
  
  let csvContent = headers.join(',') + '\n';
  
  filtered.forEach(bg => {
    const row = [
      bg.id,
      bg.bgNumber || '',
      bg.bgType,
      `"${bg.beneficiary.replace(/"/g, '""')}"`,
      `"${(bg.clientName || '').replace(/"/g, '""')}"`,
      `"${(bg.issuingBank || '').replace(/"/g, '""')}"`,
      bg.issueDate || '',
      bg.effectiveDate || '',
      bg.expiryDate || '',
      bg.claimExpiryDate || '',
      bg.bgAmount || 0,
      bg.bgCommission || 0,
      bg.marginMoney || 0,
      bg.fdrNo || '',
      `"${(bg.costCenter || bg.siteName || '').replace(/"/g, '""')}"`,
      bg.status,
      bg.renewalAlertDate || '',
      bg.renewalInitiationDate || '',
      `"${(bg.remarks || '').replace(/"/g, '""')}"`
    ];
    csvContent += row.join(',') + '\n';
  });

  // Download Action
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", `Bank_Guarantee_Report_${new Date().toISOString().split('T')[0]}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

// --- MODAL CONTROLLERS ---

// Local state for active editing record amendments
let activeAmendments = [];

function closeModal(modalId) {
  document.getElementById(modalId).classList.remove('active');
  
  // Clear any forms or arrays
  if (modalId === 'register-bg-modal') {
    document.getElementById('register-bg-form').reset();
    document.getElementById('bg-files-list').innerHTML = '';
    document.getElementById('bg-existing-files').innerHTML = '';
    document.getElementById('amendment-form-panel').style.display = 'none';
    document.getElementById('amd-files-list').innerHTML = '';
    activeAmendments = [];
    pendingFiles = [];
  }
}

// Open Register/Edit BG modal
function openRegisterModal(bgId = null) {
  const modal = document.getElementById('register-bg-modal');
  const titleAction = document.getElementById('modal-title-action');
  
  // Reset Form
  document.getElementById('register-bg-form').reset();
  document.getElementById('bg-files-list').innerHTML = '';
  document.getElementById('bg-existing-files').innerHTML = '';
  document.getElementById('amendment-form-panel').style.display = 'none';
  document.getElementById('amd-files-list').innerHTML = '';
  activeAmendments = [];
  pendingFiles = [];
  
  // Default values
  document.getElementById('bg-form-status').value = 'Active';
  handleStatusChange('Active');
  
  if (bgId) {
    // EDIT RECORD
    titleAction.textContent = `Edit Bank Guarantee - ${bgId}`;
    
    // Find BG in our loaded registry list
    const bg = allRegister.find(b => b.id === bgId);
    if (!bg) return;
    
    document.getElementById('bg-form-id').value = bg.id;
    document.getElementById('bg-form-request-id').value = bg.requestId || '';
    document.getElementById('bg-form-number').value = bg.bgNumber || '';
    document.getElementById('bg-form-type').value = bg.bgType || 'EMD';
    document.getElementById('bg-form-beneficiary').value = bg.beneficiary || '';
    document.getElementById('bg-form-client-name').value = bg.clientName || '';
    document.getElementById('bg-form-sitename').value = bg.siteName || '';
    document.getElementById('bg-form-bank').value = bg.issuingBank || 'HDFC Bank';
    document.getElementById('bg-form-issue-date').value = bg.issueDate || '';
    document.getElementById('bg-form-effective-date').value = bg.effectiveDate || '';
    document.getElementById('bg-form-expiry-date').value = bg.expiryDate || '';
    document.getElementById('bg-form-claim-date').value = bg.claimExpiryDate || '';
    document.getElementById('bg-form-amount').value = bg.bgAmount || '';
    document.getElementById('bg-form-commission').value = bg.bgCommission || '';
    document.getElementById('bg-form-margin-money').value = bg.marginMoney || '';
    document.getElementById('bg-form-fdr-no').value = bg.fdrNo || '';
    document.getElementById('bg-form-status').value = bg.status || 'Active';
    document.getElementById('bg-form-auto-renewal').checked = !!bg.autoRenewal;
    document.getElementById('bg-form-released-date').value = bg.releasedDate || '';
    document.getElementById('bg-form-remarks').value = bg.remarks || '';
    
    // Setup cost center field toggling and values
    toggleCostCenterField('bg-form-cost-center-select', 'bg-form-cost-center-input', bg.bgType);
    if (bg.bgType === 'EMD') {
      document.getElementById('bg-form-cost-center-input').value = bg.costCenter || '';
    } else {
      document.getElementById('bg-form-cost-center-select').value = bg.costCenter || COST_CENTERS[0];
    }
    
    // Populate amendments history
    activeAmendments = bg.amendments || [];
    document.getElementById('bg-amendments-section').style.display = 'block';
    renderAmendmentsTable(activeAmendments);
    
    // Handle conditional displays
    handleStatusChange(bg.status);
    handleExpiryDateChange(bg.expiryDate);
    
    // Render existing files
    if (bg.attachments && bg.attachments.length > 0) {
      const existingContainer = document.getElementById('bg-existing-files');
      existingContainer.innerHTML = `
        <div style="font-size:12px; font-weight:600; color: var(--text-secondary); margin-bottom: 6px;">Existing Attachments:</div>
        <div style="display:flex; flex-direction:column; gap:4px;">
          ${bg.attachments.map(att => `
            <div style="font-size:13px; display:flex; align-items:center; gap:8px;">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" style="width:14px; height:14px; color: var(--text-muted);">
                <path stroke-linecap="round" stroke-linejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
              </svg>
              <a href="${att.path}" download class="attachment-link">${att.originalName}</a>
              <span style="font-size:11px; color: var(--text-muted);">(${att.category || 'General'})</span>
            </div>
          `).join('')}
        </div>
      `;
    }
  } else {
    // NEW MANUAL ENTRY
    titleAction.textContent = 'Register Bank Guarantee';
    document.getElementById('bg-form-id').value = '';
    document.getElementById('bg-form-request-id').value = '';
    
    // Toggle Cost Center field as select by default (for EMD)
    toggleCostCenterField('bg-form-cost-center-select', 'bg-form-cost-center-input', 'EMD');
    
    // Hide amendments section
    document.getElementById('bg-amendments-section').style.display = 'none';
    
    // Clear auto calc labels
    document.getElementById('lbl-auto-alert-date').textContent = 'Select Expiry Date';
    document.getElementById('lbl-auto-init-date').textContent = 'Select Expiry Date';
  }
  
  modal.classList.add('active');
}

// Toggle amendment subform visibility
function toggleAmendmentForm(show) {
  const panel = document.getElementById('amendment-form-panel');
  if (!panel) return;
  panel.style.display = show ? 'block' : 'none';
  
  if (show) {
    document.getElementById('amd-date').value = new Date().toISOString().split('T')[0];
    document.getElementById('amd-amount').value = document.getElementById('bg-form-amount').value;
    document.getElementById('amd-expiry').value = document.getElementById('bg-form-expiry-date').value;
    document.getElementById('amd-duration').value = '';
    document.getElementById('amd-details').value = '';
    document.getElementById('amd-files-list').innerHTML = '';
    document.getElementById('amd-file-input').value = '';
  }
}

// Save amendment into current active list
function saveAmdSubForm() {
  const date = document.getElementById('amd-date').value;
  const description = document.getElementById('amd-details').value;
  const revisedAmount = parseFloat(document.getElementById('amd-amount').value) || 0;
  const revisedExpiryDate = document.getElementById('amd-expiry').value;
  const revisedDuration = document.getElementById('amd-duration').value;
  
  if (!date || !description) {
    alert("Please fill in the Amendment Date and Description.");
    return;
  }
  
  // Extract files uploaded for this amendment
  const amendmentFiles = pendingFiles.filter(f => f.category === 'Amendment');
  
  // Remove these files from main pending files list so they aren't double uploaded
  pendingFiles = pendingFiles.filter(f => f.category !== 'Amendment');
  
  const newAmd = {
    id: 'AMD-' + Date.now(),
    date: date,
    description: description,
    revisedAmount: revisedAmount,
    revisedExpiryDate: revisedExpiryDate,
    revisedDuration: revisedDuration,
    attachments: amendmentFiles // base64 attachments specific to this amendment
  };
  
  activeAmendments.push(newAmd);
  
  // Automatically update main BG values to reflect the latest amendment
  document.getElementById('bg-form-amount').value = revisedAmount;
  document.getElementById('bg-form-expiry-date').value = revisedExpiryDate;
  if (revisedDuration) {
    // If a duration was specified, update notes/remarks
    document.getElementById('bg-form-remarks').value = `Amended on ${formatDate(date)}: ${description}\n` + document.getElementById('bg-form-remarks').value;
  }
  
  // Re-render amendments list table
  renderAmendmentsTable(activeAmendments);
  
  // Close the amendment form
  toggleAmendmentForm(false);
}

// Render amendments history list table
function renderAmendmentsTable(amendments) {
  const tbody = document.getElementById('amendments-list-tbody');
  if (!tbody) return;
  tbody.innerHTML = '';
  
  if (!amendments || amendments.length === 0) {
    tbody.innerHTML = `<tr><td colspan="6" style="text-align: center; color: var(--text-muted);">No amendments recorded yet.</td></tr>`;
    return;
  }
  
  amendments.forEach((amd, idx) => {
    const tr = document.createElement('tr');
    
    let attachmentsMarkup = 'None';
    if (amd.attachments && amd.attachments.length > 0) {
      attachmentsMarkup = amd.attachments.map(att => `
        <a href="${att.path || '#'}" download class="attachment-link" onclick="event.stopPropagation()">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" style="width:12px; height:12px;">
            <path stroke-linecap="round" stroke-linejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25" />
          </svg>
        </a>
      `).join(' ');
    }
    
    tr.innerHTML = `
      <td><b>${idx + 1}</b></td>
      <td>${formatDate(amd.date)}</td>
      <td>${amd.description}</td>
      <td>${amd.revisedAmount ? formatCurrency(amd.revisedAmount) : 'N/A'}</td>
      <td>${formatDate(amd.revisedExpiryDate)}</td>
      <td>${attachmentsMarkup}</td>
    `;
    tbody.appendChild(tr);
  });
}

async function submitRegisterForm() {
  const form = document.getElementById('register-bg-form');
  if (!form.checkValidity()) {
    form.reportValidity();
    return;
  }
  
  const submitBtn = document.getElementById('btn-submit-bg-form');
  submitBtn.disabled = true;
  submitBtn.textContent = 'Saving details...';
  
  const id = document.getElementById('bg-form-id').value;
  const method = id ? 'PUT' : 'POST';
  const bgType = document.getElementById('bg-form-type').value;
  
  // Get Cost Center value based on EMD vs non-EMD
  const costCenterVal = (bgType === 'EMD') 
    ? document.getElementById('bg-form-cost-center-input').value 
    : document.getElementById('bg-form-cost-center-select').value;
    
  const payload = {
    id: id || undefined,
    requestId: document.getElementById('bg-form-request-id').value || undefined,
    bgNumber: document.getElementById('bg-form-number').value,
    bgType: bgType,
    beneficiary: document.getElementById('bg-form-beneficiary').value,
    clientName: document.getElementById('bg-form-client-name').value,
    siteName: document.getElementById('bg-form-sitename').value,
    issuingBank: document.getElementById('bg-form-bank').value,
    issueDate: document.getElementById('bg-form-issue-date').value,
    effectiveDate: document.getElementById('bg-form-effective-date').value,
    expiryDate: document.getElementById('bg-form-expiry-date').value,
    claimExpiryDate: document.getElementById('bg-form-claim-date').value,
    bgAmount: document.getElementById('bg-form-amount').value,
    bgCommission: document.getElementById('bg-form-commission').value,
    marginMoney: document.getElementById('bg-form-margin-money').value,
    fdrNo: document.getElementById('bg-form-fdr-no').value,
    costCenter: costCenterVal,
    status: document.getElementById('bg-form-status').value,
    autoRenewal: document.getElementById('bg-form-auto-renewal').checked,
    releasedDate: document.getElementById('bg-form-released-date').value,
    remarks: document.getElementById('bg-form-remarks').value,
    lastUpdatedBy: `${currentRole} (Sumit Verma)`,
    amendments: activeAmendments, // send complete history including newly applied amendments
    newAttachments: pendingFiles // base64 attachments if any
  };
  
  try {
    const res = await fetchApi('/api/register', {
      method: method,
      body: JSON.stringify(payload)
    });
    
    if (res.success) {
      alert(`Bank Guarantee details saved successfully!`);
      closeModal('register-bg-modal');
      
      const activeSection = document.querySelector('.view-section.active');
      if (activeSection) {
        const viewId = activeSection.id.replace('view-', '');
        if (viewId === 'register') loadRegister();
        else if (viewId === 'dashboard') loadDashboard();
        else if (viewId === 'reports') loadReports();
      } else {
        switchView('register');
      }
    }
  } catch (err) {
    console.error(err);
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = 'Save BG Details';
  }
}

// Detailed View modal loading
async function openDetailModal(type, id) {
  const modal = document.getElementById('detail-view-modal');
  const title = document.getElementById('detail-modal-title');
  const body = document.getElementById('detail-modal-body');
  
  body.innerHTML = 'Loading record...';
  modal.classList.add('active');
  
  if (type === 'request') {
    title.textContent = `Request Details - ${id}`;
    const req = allRequests.find(r => r.id === id);
    if (!req) {
      body.innerHTML = 'Record not found.';
      return;
    }
    
    let attachmentsMarkup = '<i>No documents attached</i>';
    if (req.attachments && req.attachments.length > 0) {
      // Group attachments by category
      const attGroups = {};
      req.attachments.forEach(att => {
        const cat = att.category || 'General';
        if (!attGroups[cat]) attGroups[cat] = [];
        attGroups[cat].push(att);
      });
      attachmentsMarkup = Object.entries(attGroups).map(([cat, atts]) => `
        <div style="margin-bottom:10px;">
          <div style="font-size:11px; font-weight:700; color:var(--text-muted); text-transform:uppercase; margin-bottom:4px;">${cat}</div>
          ${atts.map(att => `
            <div style="margin-top:4px;">
              <a href="${att.path}" download class="attachment-link">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
                </svg>
                ${att.originalName}
              </a>
            </div>
          `).join('')}
        </div>
      `).join('');
    }
    
    body.innerHTML = `
      <div style="display:flex; flex-direction:column; gap:16px;">
        <div style="display:grid; grid-template-columns: 1fr 1fr; gap:16px;">
          <div>
            <label style="font-size:11px; font-weight:700; color:var(--text-muted); text-transform:uppercase;">Project/Contract Ref</label>
            <div style="font-weight:600; font-size:15px; margin-top:3px;">${req.projectRef}</div>
          </div>
          <div>
            <label style="font-size:11px; font-weight:700; color:var(--text-muted); text-transform:uppercase;">BG Type Required</label>
            <div style="font-weight:600; font-size:15px; margin-top:3px;">${req.bgType}</div>
          </div>
        </div>

        <div style="display:grid; grid-template-columns: 1fr 1fr; gap:16px;">
          <div>
            <label style="font-size:11px; font-weight:700; color:var(--text-muted); text-transform:uppercase;">Amount</label>
            <div style="font-weight:700; font-size:18px; color:var(--color-primary); margin-top:3px;">${formatCurrency(req.amount)}</div>
          </div>
          <div>
            <label style="font-size:11px; font-weight:700; color:var(--text-muted); text-transform:uppercase;">Due Date</label>
            <div style="font-weight:600; font-size:15px; margin-top:3px;">${formatDate(req.dueDate)}</div>
          </div>
        </div>

        ${req.costCenter ? `
        <div>
          <label style="font-size:11px; font-weight:700; color:var(--text-muted); text-transform:uppercase;">Cost Center</label>
          <div style="font-weight:600; font-size:14px; margin-top:3px;">${req.costCenter}</div>
        </div>` : ''}

        <div>
          <label style="font-size:11px; font-weight:700; color:var(--text-muted); text-transform:uppercase;">Beneficiary Details</label>
          <div style="font-weight:600; font-size:14px; margin-top:3px;">Name: ${req.beneficiaryName}</div>
          ${req.beneficiaryAddress ? `<div style="font-size:13px; color:var(--text-secondary); margin-top:2px;">Address: ${req.beneficiaryAddress}</div>` : ''}
          ${req.beneficiaryBankName ? `<div style="font-size:13px; color:var(--text-secondary); margin-top:2px;">Bank: ${req.beneficiaryBankName}</div>` : (req.beneficiaryBank ? `<div style="font-size:13px; color:var(--text-secondary); margin-top:2px;">Bank: ${req.beneficiaryBank}</div>` : '')}
          ${req.beneficiaryBankAccount ? `<div style="font-size:13px; color:var(--text-secondary); margin-top:2px;">Account No: ${req.beneficiaryBankAccount}</div>` : ''}
          ${req.beneficiaryBankIfsc ? `<div style="font-size:13px; color:var(--text-secondary); margin-top:2px;">IFSC: ${req.beneficiaryBankIfsc}</div>` : ''}
        </div>

        <div style="display:grid; grid-template-columns: 1fr 1fr; gap:16px;">
          <div>
            <label style="font-size:11px; font-weight:700; color:var(--text-muted); text-transform:uppercase;">Duration</label>
            <div style="font-size:14px; font-weight:600; margin-top:3px;">${req.duration}</div>
          </div>
          <div>
            <label style="font-size:11px; font-weight:700; color:var(--text-muted); text-transform:uppercase;">Requested By</label>
            <div style="font-size:14px; font-weight:600; margin-top:3px;">${req.requestedBy}</div>
          </div>
        </div>

        <div style="display:grid; grid-template-columns: 1fr 1fr; gap:16px;">
          <div>
            <label style="font-size:11px; font-weight:700; color:var(--text-muted); text-transform:uppercase;">Approvals Workflow</label>
            <div style="font-size:14px; font-weight:600; margin-top:3px;">${req.approvalsNeeded}</div>
          </div>
          <div>
            <label style="font-size:11px; font-weight:700; color:var(--text-muted); text-transform:uppercase;">Status</label>
            <div style="margin-top:3px;"><span class="badge badge-${req.status.toLowerCase()}">${req.status}</span></div>
          </div>
        </div>

        ${req.approvedBy ? `
          <div style="background-color:var(--bg-primary); padding:12px; border-radius:var(--radius-sm); border:1px solid var(--border-color); display:grid; grid-template-columns: 1fr 1fr; gap:12px;">
            <div>
              <label style="font-size:10px; font-weight:700; color:var(--text-muted); text-transform:uppercase;">Resolved By</label>
              <div style="font-size:13px; font-weight:600; margin-top:2px;">${req.approvedBy}</div>
            </div>
            <div>
              <label style="font-size:10px; font-weight:700; color:var(--text-muted); text-transform:uppercase;">Resolved On</label>
              <div style="font-size:13px; font-weight:600; margin-top:2px;">${formatDate(req.approvedOn)}</div>
            </div>
          </div>
        ` : ''}

        <div>
          <label style="font-size:11px; font-weight:700; color:var(--text-muted); text-transform:uppercase;">Remarks</label>
          <div style="font-size:13px; color:var(--text-secondary); margin-top:3px; background-color:var(--bg-primary); padding:10px; border-radius:var(--radius-sm); border:1px solid var(--border-color);">${req.remarks || 'No remarks provided.'}</div>
        </div>

        <div>
          <label style="font-size:11px; font-weight:700; color:var(--text-muted); text-transform:uppercase;">Attachments</label>
          <div style="margin-top:4px;">${attachmentsMarkup}</div>
        </div>
      </div>
    `;
  } else {
    // DETAIL FOR REGISTERED BG
    title.textContent = `Bank Guarantee Details - ${id}`;
    const bg = allRegister.find(b => b.id === id);
    if (!bg) {
      body.innerHTML = 'Record not found.';
      return;
    }
    
    let attachmentsMarkup = '<i>No documents attached</i>';
    if (bg.attachments && bg.attachments.length > 0) {
      attachmentsMarkup = bg.attachments.map(att => `
        <div style="margin-top:6px;">
          <a href="${att.path}" download class="attachment-link">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
            </svg>
            ${att.originalName}
          </a>
        </div>
      `).join('');
    }
    
    body.innerHTML = `
      <div style="display:flex; flex-direction:column; gap:16px;">
        <div style="display:grid; grid-template-columns: 1fr 1fr; gap:16px;">
          <div>
            <label style="font-size:11px; font-weight:700; color:var(--text-muted); text-transform:uppercase;">BG Number (Bank)</label>
            <div style="font-weight:700; font-size:15px; color:var(--color-primary); margin-top:3px;">${bg.bgNumber || 'Pending Issuance'}</div>
          </div>
          <div>
            <label style="font-size:11px; font-weight:700; color:var(--text-muted); text-transform:uppercase;">BG Type</label>
            <div style="font-weight:600; font-size:15px; margin-top:3px;">${bg.bgType}</div>
          </div>
        </div>

        <div style="display:grid; grid-template-columns: 1fr 1fr; gap:16px;">
          <div>
            <label style="font-size:11px; font-weight:700; color:var(--text-muted); text-transform:uppercase;">BG Amount</label>
            <div style="font-weight:700; font-size:18px; color:var(--color-primary); margin-top:3px;">${formatCurrency(bg.bgAmount)}</div>
          </div>
          <div>
            <label style="font-size:11px; font-weight:700; color:var(--text-muted); text-transform:uppercase;">Commission Paid Till Date</label>
            <div style="font-weight:600; font-size:15px; margin-top:3px;">${bg.bgCommission ? formatCurrency(bg.bgCommission) : '₹0.00'}</div>
          </div>
        </div>

        <div style="display:grid; grid-template-columns: 1fr 1fr; gap:16px;">
          <div>
            <label style="font-size:11px; font-weight:700; color:var(--text-muted); text-transform:uppercase;">Margin Money Blocked</label>
            <div style="font-weight:600; font-size:15px; margin-top:3px;">${bg.marginMoney ? formatCurrency(bg.marginMoney) : '₹0.00'}</div>
          </div>
          <div>
            <label style="font-size:11px; font-weight:700; color:var(--text-muted); text-transform:uppercase;">FDR Number</label>
            <div style="font-weight:600; font-size:15px; margin-top:3px;">${bg.fdrNo || 'N/A'}</div>
          </div>
        </div>

        <div>
          <label style="font-size:11px; font-weight:700; color:var(--text-muted); text-transform:uppercase;">Beneficiary details</label>
          <div style="font-weight:600; font-size:14px; margin-top:3px;">Name: ${bg.beneficiary}</div>
          ${bg.clientName ? `<div style="font-size:13px; color:var(--text-secondary); margin-top:2px;">Issued in Favor of: ${bg.clientName}</div>` : ''}
          ${bg.issuingBank ? `<div style="font-size:13px; color:var(--text-secondary); margin-top:2px;">Issuing Bank: ${bg.issuingBank}</div>` : ''}
        </div>

        <div style="display:grid; grid-template-columns: 1fr 1fr; gap:16px;">
          <div>
            <label style="font-size:11px; font-weight:700; color:var(--text-muted); text-transform:uppercase;">Name of Site / Project Ref</label>
            <div style="font-size:14px; font-weight:600; margin-top:3px;">${bg.siteName || 'N/A'}</div>
          </div>
          <div>
            <label style="font-size:11px; font-weight:700; color:var(--text-muted); text-transform:uppercase;">Cost Center</label>
            <div style="font-size:14px; font-weight:600; margin-top:3px;">${bg.costCenter || 'N/A'}</div>
          </div>
        </div>

        <div style="display:grid; grid-template-columns: 1fr 1fr; gap:16px;">
          <div>
            <label style="font-size:11px; font-weight:700; color:var(--text-muted); text-transform:uppercase;">Issue Date</label>
            <div style="font-size:14px; font-weight:600; margin-top:3px;">${formatDate(bg.issueDate)}</div>
          </div>
          <div>
            <label style="font-size:11px; font-weight:700; color:var(--text-muted); text-transform:uppercase;">Effective Date</label>
            <div style="font-size:14px; font-weight:600; margin-top:3px;">${formatDate(bg.effectiveDate)}</div>
          </div>
        </div>

        <div style="display:grid; grid-template-columns: 1fr 1fr; gap:16px;">
          <div>
            <label style="font-size:11px; font-weight:700; color:var(--text-muted); text-transform:uppercase;">Expiry Date</label>
            <div style="font-size:14px; font-weight:700; color:var(--color-danger); margin-top:3px;">${formatDate(bg.expiryDate)}</div>
          </div>
          <div>
            <label style="font-size:11px; font-weight:700; color:var(--text-muted); text-transform:uppercase;">Claim Expiry Date</label>
            <div style="font-size:14px; font-weight:600; margin-top:3px;">${formatDate(bg.claimExpiryDate)}</div>
          </div>
        </div>

        <div style="background-color:var(--bg-primary); padding:12px; border-radius:var(--radius-sm); border:1px solid var(--border-color); display:grid; grid-template-columns: 1fr 1fr; gap:12px;">
          <div>
            <label style="font-size:10px; font-weight:700; color:var(--text-muted); text-transform:uppercase;">Renewal Alert Date</label>
            <div style="font-size:13px; font-weight:600; color:var(--color-danger); margin-top:2px;">${formatDate(bg.renewalAlertDate)}</div>
          </div>
          <div>
            <label style="font-size:10px; font-weight:700; color:var(--text-muted); text-transform:uppercase;">Renewal Initiation Date</label>
            <div style="font-size:13px; font-weight:600; color:var(--color-warning); margin-top:2px;">${formatDate(bg.renewalInitiationDate)}</div>
          </div>
        </div>

        <div style="display:grid; grid-template-columns: 1fr 1fr; gap:16px;">
          <div>
            <label style="font-size:11px; font-weight:700; color:var(--text-muted); text-transform:uppercase;">Status</label>
            <div style="margin-top:3px;">
              <span class="badge badge-${bg.status.toLowerCase()}">${bg.status}</span>
              ${bg.autoRenewal ? '<span class="badge badge-approved" style="margin-left:8px;">Auto-Renew</span>' : ''}
            </div>
          </div>
          ${bg.releasedDate ? `
            <div>
              <label style="font-size:11px; font-weight:700; color:var(--text-muted); text-transform:uppercase;">Released/Cancelled Date</label>
              <div style="font-size:14px; font-weight:600; margin-top:3px;">${formatDate(bg.releasedDate)}</div>
            </div>
          ` : ''}
        </div>

        <div>
          <label style="font-size:11px; font-weight:700; color:var(--text-muted); text-transform:uppercase;">Last Updated By</label>
          <div style="font-size:12px; color:var(--text-secondary); margin-top:3px;">${bg.lastUpdatedBy} on ${formatDate(bg.lastUpdatedOn)}</div>
        </div>

        <div>
          <label style="font-size:11px; font-weight:700; color:var(--text-muted); text-transform:uppercase;">Remarks</label>
          <div style="font-size:13px; color:var(--text-secondary); margin-top:3px; background-color:var(--bg-primary); padding:10px; border-radius:var(--radius-sm); border:1px solid var(--border-color);">${bg.remarks || 'No remarks recorded.'}</div>
        </div>

        <div>
          <label style="font-size:11px; font-weight:700; color:var(--text-muted); text-transform:uppercase;">Attachments</label>
          <div style="margin-top:4px;">${attachmentsMarkup}</div>
        </div>

        ${bg.amendments && bg.amendments.length > 0 ? `
          <div style="border-top:1px solid var(--border-color); padding-top:16px; margin-top:4px;">
            <label style="font-size:11px; font-weight:700; color:var(--text-muted); text-transform:uppercase; display:block; margin-bottom:8px;">Amendment History (${bg.amendments.length})</label>
            <div style="display:flex; flex-direction:column; gap:8px;">
              ${bg.amendments.map((amd, idx) => `
                <div style="background-color: var(--bg-primary); padding:10px; border-radius: var(--radius-sm); border: 1px solid var(--border-color); font-size:13px;">
                  <div style="display:flex; justify-content:space-between; font-weight:600; color: var(--text-primary); margin-bottom:4px;">
                    <span>Amendment #${idx+1} (${formatDate(amd.date)})</span>
                    <span>${amd.revisedAmount ? formatCurrency(amd.revisedAmount) : ''}</span>
                  </div>
                  <div style="color:var(--text-secondary); font-size:12.5px;">${amd.description}</div>
                  ${amd.attachments && amd.attachments.length > 0 ? `
                    <div style="display:flex; gap:6px; margin-top:6px; font-size:11px; flex-wrap: wrap;">
                      <span style="font-weight:600;">Docs:</span>
                      ${amd.attachments.map(att => `
                        <a href="${att.path}" download style="color:var(--color-primary); text-decoration:none;">${att.originalName}</a>
                      `).join(', ')}
                    </div>
                  ` : ''}
                </div>
              `).join('')}
            </div>
          </div>
        ` : ''}
      </div>
    `;
  }
}

// --- 6. BG RENEWAL MODULE ---

function resetRenewalForm() {
  const form = document.getElementById('raise-bg-renewal-form');
  if (form) form.reset();
  
  // Clear read-only fields
  document.getElementById('ren-lbl-current-expiry').value = '';
  document.getElementById('ren-lbl-current-amount').value = '';
  document.getElementById('ren-lbl-beneficiary').value = '';
  document.getElementById('ren-lbl-project-ref').value = '';
  document.getElementById('ren-lbl-issuing-bank').value = '';
  
  // Clear file lists
  const lists = ['ren-list-loi', 'ren-list-bg-draft', 'ren-list-others'];
  lists.forEach(id => {
    const list = document.getElementById(id);
    if (list) list.innerHTML = '';
  });
  
  pendingFiles = [];
  
  // Load active BGs into the renewal select dropdown
  const select = document.getElementById('ren-bg-select');
  if (select) {
    select.innerHTML = '<option value="">-- Choose BG Number --</option>';
    // Only display active or expired BGs that actually have a BG Number assigned
    const eligibleBgs = allRegister.filter(bg => (bg.status === 'Active' || bg.status === 'Expired') && bg.bgNumber);
    
    if (eligibleBgs.length === 0) {
      const opt = document.createElement('option');
      opt.value = '';
      opt.textContent = 'No active/expired BGs available for renewal';
      select.appendChild(opt);
    } else {
      eligibleBgs.forEach(bg => {
        const opt = document.createElement('option');
        opt.value = bg.id;
        opt.textContent = `${bg.bgNumber} (${bg.id} - ${bg.beneficiary})`;
        select.appendChild(opt);
      });
    }
  }
}

function handleRenewalBgSelect(bgId) {
  if (!bgId) {
    document.getElementById('ren-lbl-current-expiry').value = '';
    document.getElementById('ren-lbl-current-amount').value = '';
    document.getElementById('ren-lbl-beneficiary').value = '';
    document.getElementById('ren-lbl-project-ref').value = '';
    document.getElementById('ren-lbl-issuing-bank').value = '';
    return;
  }
  
  const bg = allRegister.find(b => b.id === bgId);
  if (bg) {
    document.getElementById('ren-lbl-current-expiry').value = formatDate(bg.expiryDate);
    document.getElementById('ren-lbl-current-amount').value = formatCurrency(bg.bgAmount);
    document.getElementById('ren-lbl-beneficiary').value = bg.beneficiary || '';
    document.getElementById('ren-lbl-project-ref').value = bg.siteName || '';
    document.getElementById('ren-lbl-issuing-bank').value = bg.issuingBank || '';
    
    // Set min date of new expiry date to be the day after current expiry date if possible
    if (bg.expiryDate) {
      const expDate = new Date(bg.expiryDate);
      expDate.setDate(expDate.getDate() + 1);
      document.getElementById('ren-new-expiry').min = expDate.toISOString().split('T')[0];
    }
  }
}

async function submitBgRenewalRequest(event) {
  event.preventDefault();
  
  const bgId = document.getElementById('ren-bg-select').value;
  if (!bgId) {
    alert("Please select a Bank Guarantee to renew.");
    return;
  }
  
  const bg = allRegister.find(b => b.id === bgId);
  if (!bg) return;
  
  // Verify required LOI file is uploaded
  const hasLoiFile = pendingFiles.some(f => f.category === 'LOI Copy / Tender Document');
  if (!hasLoiFile) {
    alert("Validation Error: Please upload the required 'LOI / Extension Order' attachment.");
    return;
  }
  
  const newExpiry = document.getElementById('ren-new-expiry').value;
  const duration = document.getElementById('ren-duration').value;
  const remarks = document.getElementById('ren-remarks').value;
  
  const payload = {
    requestType: 'Renewal',
    bgNumberToRenew: bg.bgNumber,
    registerIdToRenew: bg.id,
    projectRef: bg.siteName || 'General',
    bgType: bg.bgType,
    costCenter: bg.costCenter || '',
    amount: bg.bgAmount, // amount stays same unless changed by subsequent amendment
    dueDate: newExpiry, // due date is the target new expiry date
    beneficiaryName: bg.beneficiary,
    beneficiaryAddress: bg.clientName || '',
    beneficiaryBankName: '', 
    beneficiaryBankAccount: '',
    beneficiaryBankIfsc: '',
    duration: duration,
    approvalsNeeded: 'Finance Manager', // renewals require Finance Manager approval
    remarks: `RENEWAL REQUEST for BG ${bg.bgNumber} (${bg.id}). Reason: ${remarks}`,
    requestedBy: `${currentRole} (Sumit Verma)`,
    attachments: pendingFiles
  };
  
  try {
    const res = await fetchApi('/api/requests', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
    
    if (res.success) {
      alert(`Bank Guarantee Renewal Request submitted successfully!\nRequest ID: ${res.request.id}`);
      resetRenewalForm();
      switchView('requests-tracker');
    }
  } catch (err) {
    console.error(err);
  }
}

// --- 7. COST CENTRE WISE REPORT ---

function initCostCenterReport() {
  const select = document.getElementById('cc-report-select');
  if (!select) return;
  
  // Save current selection if any
  const previousValue = select.value;
  
  // Populate cost center options
  populateCostCenters();
  
  if (previousValue && COST_CENTERS.includes(previousValue)) {
    select.value = previousValue;
    loadCostCenterReport(previousValue);
  } else {
    // Clear display
    document.getElementById('cc-total-count').textContent = '0';
    document.getElementById('cc-total-value').textContent = '₹0';
    document.getElementById('cc-total-margin').textContent = '₹0';
    document.getElementById('cc-report-tbody').innerHTML = `<tr><td colspan="8" style="text-align: center; color: var(--text-muted);">Please select a Cost Center above.</td></tr>`;
  }
}

async function loadCostCenterReport(costCenter) {
  if (!costCenter) {
    document.getElementById('cc-total-count').textContent = '0';
    document.getElementById('cc-total-value').textContent = '₹0';
    document.getElementById('cc-total-margin').textContent = '₹0';
    document.getElementById('cc-report-tbody').innerHTML = `<tr><td colspan="8" style="text-align: center; color: var(--text-muted);">Please select a Cost Center above.</td></tr>`;
    return;
  }
  
  // Fetch register database
  const register = await fetchApi('/api/register');
  allRegister = register;
  
  // Filter for matching cost centers (excluding EMDs since they aren't bound to cost centers)
  const filteredBgs = register.filter(bg => bg.costCenter === costCenter && bg.bgType !== 'EMD');
  
  // Update summaries
  let totalCount = 0;
  let totalValue = 0.0;
  let totalMargin = 0.0;
  
  filteredBgs.forEach(bg => {
    if (bg.status === 'Active' || bg.status === 'Expired') {
      totalCount++;
      totalValue += parseFloat(bg.bgAmount) || 0;
      totalMargin += parseFloat(bg.marginMoney) || 0;
    }
  });
  
  document.getElementById('cc-total-count').textContent = totalCount;
  document.getElementById('cc-total-value').textContent = formatCurrency(totalValue);
  document.getElementById('cc-total-margin').textContent = formatCurrency(totalMargin);
  
  // Render records
  const tbody = document.getElementById('cc-report-tbody');
  tbody.innerHTML = '';
  
  if (filteredBgs.length === 0) {
    tbody.innerHTML = `<tr><td colspan="8" style="text-align: center; color: var(--text-muted);">No Bank Guarantees recorded for this Cost Center.</td></tr>`;
    return;
  }
  
  filteredBgs.forEach(bg => {
    const tr = document.createElement('tr');
    tr.style.cursor = 'pointer';
    tr.onclick = () => openDetailModal('bg', bg.id);
    tr.innerHTML = `
      <td style="font-weight:700; color: var(--color-primary);">${bg.id}</td>
      <td>${bg.bgNumber || '<i>Pending</i>'}</td>
      <td>${bg.bgType}</td>
      <td class="col-wrap">${bg.beneficiary}</td>
      <td class="col-wrap">${bg.issuingBank || 'N/A'}</td>
      <td style="font-weight:600;">${formatCurrency(bg.bgAmount)}</td>
      <td>${formatDate(bg.expiryDate)}</td>
      <td><span class="badge badge-${bg.status.toLowerCase()}">${bg.status}</span></td>
    `;
    tbody.appendChild(tr);
  });
}

function exportCostCenterCsv() {
  const costCenter = document.getElementById('cc-report-select').value;
  if (!costCenter) {
    alert("Please select a Cost Center to export.");
    return;
  }
  
  const filteredBgs = allRegister.filter(bg => bg.costCenter === costCenter && bg.bgType !== 'EMD');
  if (filteredBgs.length === 0) {
    alert("No records to export.");
    return;
  }
  
  const headers = ['BG Ref ID', 'BG Number', 'BG Type', 'Beneficiary', 'Issuing Bank', 'Issue Date', 'Expiry Date', 'Amount (₹)', 'Margin Money (₹)', 'FDR No', 'Status', 'Remarks'];
  let csvContent = headers.join(',') + '\n';
  
  filteredBgs.forEach(bg => {
    const row = [
      bg.id,
      bg.bgNumber || '',
      bg.bgType,
      `"${bg.beneficiary.replace(/"/g, '""')}"`,
      `"${(bg.issuingBank || '').replace(/"/g, '""')}"`,
      bg.issueDate || '',
      bg.expiryDate || '',
      bg.bgAmount || 0,
      bg.marginMoney || 0,
      bg.fdrNo || '',
      bg.status,
      `"${(bg.remarks || '').replace(/"/g, '""')}"`
    ];
    csvContent += row.join(',') + '\n';
  });
  
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", `BG_CostCenter_Report_${costCenter.replace(/[^a-zA-Z0-9]/g, '_')}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
