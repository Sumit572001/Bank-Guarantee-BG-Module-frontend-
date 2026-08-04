// App State
const API_URL = ''; // Same domain for API calls
let currentRole = 'Finance Manager';
let allRequests = [];
let allRegister = [];
let pendingFiles = [];

// DOM Elements cache
const viewTitle = document.getElementById('view-title');
const userRoleSelect = document.getElementById('user-role-select');
const userRoleDisplay = document.getElementById('user-role-display');
const userAvatarInitials = document.getElementById('user-avatar-initials');

// Format Currency
function formatCurrency(amount) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(amount);
}

// Format Date
function formatDate(dateStr) {
  if (!dateStr) return 'N/A';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  } catch (e) {
    return dateStr;
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
    case 'requests-tracker':
      viewTitle.textContent = 'BG Request Tracker';
      loadRequests();
      break;
    case 'register':
      viewTitle.textContent = 'Bank Guarantee Register';
      loadRegister();
      break;
    case 'reports':
      viewTitle.textContent = 'Reports & Expiry Alerts';
      loadReports();
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
  document.getElementById('raise-bg-request-form').reset();
  document.getElementById('request-files-list').innerHTML = '';
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
  
  const payload = {
    projectRef: document.getElementById('req-project-ref').value,
    bgType: document.getElementById('req-bg-type').value,
    amount: document.getElementById('req-amount').value,
    dueDate: document.getElementById('req-due-date').value,
    beneficiaryName: document.getElementById('req-beneficiary-name').value,
    beneficiaryAddress: document.getElementById('req-beneficiary-address').value,
    beneficiaryBank: document.getElementById('req-beneficiary-bank').value,
    duration: document.getElementById('req-duration').value,
    approvalsNeeded: document.getElementById('req-approvals-needed').value,
    remarks: document.getElementById('req-remarks').value,
    requestedBy: `${userRoleDisplay.textContent} (Sumit Verma)`,
    attachments: pendingFiles // base64 payload array
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
      <td>${req.projectRef}</td>
      <td>${req.bgType}</td>
      <td style="font-weight:600;">${formatCurrency(req.amount)}</td>
      <td>${formatDate(req.dueDate)}</td>
      <td>${req.beneficiaryName}</td>
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
  
  sortedRegister.forEach(bg => {
    const tr = document.createElement('tr');
    
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
    
    tr.style.cursor = 'pointer';
    tr.onclick = () => openDetailModal('bg', bg.id);
    tr.innerHTML = `
      <td style="font-weight:700; color: var(--color-primary);">${bg.id}</td>
      <td>${bg.bgNumber || '<span style="color:var(--color-warning); font-weight:600;">Pending Issuance</span>'}</td>
      <td>${bg.bgType}</td>
      <td>${bg.beneficiary}</td>
      <td>${bg.issuingBank || 'N/A'}</td>
      <td style="font-weight:600;">${formatCurrency(bg.bgAmount)}</td>
      <td>${formatDate(bg.expiryDate)}</td>
      <td>${fdrDetails}</td>
      <td><span class="badge badge-${bg.status.toLowerCase()}">${bg.status}</span></td>
      <td>${actionMarkup}</td>
    `;
    tbody.appendChild(tr);
  });
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
      <td>${bg.beneficiary}</td>
      <td>${bg.issuingBank || 'N/A'}</td>
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

function closeModal(modalId) {
  document.getElementById(modalId).classList.remove('active');
  
  // Clear any forms or arrays
  if (modalId === 'register-bg-modal') {
    document.getElementById('register-bg-form').reset();
    document.getElementById('bg-files-list').innerHTML = '';
    document.getElementById('bg-existing-files').innerHTML = '';
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
    document.getElementById('bg-form-bank').value = bg.issuingBank || '';
    document.getElementById('bg-form-issue-date').value = bg.issueDate || '';
    document.getElementById('bg-form-effective-date').value = bg.effectiveDate || '';
    document.getElementById('bg-form-expiry-date').value = bg.expiryDate || '';
    document.getElementById('bg-form-claim-date').value = bg.claimExpiryDate || '';
    document.getElementById('bg-form-amount').value = bg.bgAmount || '';
    document.getElementById('bg-form-commission').value = bg.bgCommission || '';
    document.getElementById('bg-form-margin-money').value = bg.marginMoney || '';
    document.getElementById('bg-form-fdr-no').value = bg.fdrNo || '';
    document.getElementById('bg-form-cost-center').value = bg.costCenter || '';
    document.getElementById('bg-form-status').value = bg.status || 'Active';
    document.getElementById('bg-form-auto-renewal').checked = !!bg.autoRenewal;
    document.getElementById('bg-form-released-date').value = bg.releasedDate || '';
    document.getElementById('bg-form-remarks').value = bg.remarks || '';
    
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
    
    // Clear auto calc labels
    document.getElementById('lbl-auto-alert-date').textContent = 'Select Expiry Date';
    document.getElementById('lbl-auto-init-date').textContent = 'Select Expiry Date';
  }
  
  modal.classList.add('active');
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
  
  const payload = {
    id: id || undefined,
    requestId: document.getElementById('bg-form-request-id').value || undefined,
    bgNumber: document.getElementById('bg-form-number').value,
    bgType: document.getElementById('bg-form-type').value,
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
    costCenter: document.getElementById('bg-form-cost-center').value,
    status: document.getElementById('bg-form-status').value,
    autoRenewal: document.getElementById('bg-form-auto-renewal').checked,
    releasedDate: document.getElementById('bg-form-released-date').value,
    remarks: document.getElementById('bg-form-remarks').value,
    lastUpdatedBy: `${currentRole} (Sumit Verma)`,
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
      attachmentsMarkup = req.attachments.map(att => `
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

        <div>
          <label style="font-size:11px; font-weight:700; color:var(--text-muted); text-transform:uppercase;">Beneficiary details</label>
          <div style="font-weight:600; font-size:14px; margin-top:3px;">Name: ${req.beneficiaryName}</div>
          ${req.beneficiaryAddress ? `<div style="font-size:13px; color:var(--text-secondary); margin-top:2px;">Address: ${req.beneficiaryAddress}</div>` : ''}
          ${req.beneficiaryBank ? `<div style="font-size:13px; color:var(--text-secondary); margin-top:2px;">Bank: ${req.beneficiaryBank}</div>` : ''}
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
      </div>
    `;
  }
}
