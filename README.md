# AJAX HELPER DOCUMENTATION

**Version:** 1.0  
**Type:** Admin Panel Utility Class  
**Dependencies:** jQuery, Bootstrap 4/5, SweetAlert2, Font Awesome

---

## Table of Contents

1. [Installation](#installation)
2. [Form Operations (data-xhr)](#form-operations)
3. [Click Reload Operations](#click-reload-operations)
4. [Auto Load Operations](#auto-load-operations)
5. [Modal Operations](#modal-operations)
6. [Bulk Actions](#bulk-actions)
7. [Other Features](#other-features)
8. [Callbacks & Hooks](#callbacks--hooks)
9. [Custom Events](#custom-events)
10. [Examples](#examples)
11. [Troubleshooting](#troubleshooting)

---

## Installation

### Requirements
- jQuery 3.x
- Bootstrap 4/5 (for modals)
- SweetAlert2 (for confirm dialogs)
- Font Awesome (for icons)
- Sortable.js (optional, for drag & drop)

### Basic Setup
```javascript
// Default settings
const ajaxHelper = new AjaxHelper();

// Custom settings
const ajaxHelper = new AjaxHelper({
    notify: customNotifyFunction,
    csrfToken: 'custom-token',
    successSound: new Audio('/sounds/success.mp3'),
    reloadDelay: 2000,
    afterReload: (target) => console.log('Reloaded:', target)
});
```

---

## Form Operations

### Basic Usage
```html
<form action="/api/save" method="POST" data-xhr>
    <input type="text" name="title">
    <button type="submit">Save</button>
</form>
```

### Attributes

#### `data-xhr`
Converts form submit to Ajax request

#### `data-callback="functionName"`
Function to call on success/error
```javascript
function myCallback($form, response, type) {
    // type: 'success', 'error', 'loader'
    console.log(response);
}
```

#### `data-loader="true"`
Calls callback with 'loader' type before submit

#### `data-submit-loader="true"`
Shows spinner on submit button
```html
<button type="submit" data-submit-loader="true">Save</button>
```

#### `data-reload-target="#selector"`
Reloads specified element on success

#### `data-reload-url="/custom/url"`
Custom URL for reload (default: current page)

#### `data-no-reload="true"`
Prevents page reload on success

### Backend Response Format
```json
{
    "type": "success|error|warning",
    "title": "Success",
    "message": "Operation completed",
    "delay": 1500,
    "copy": "Optional content to copy"
}
```

### Progress Event
```javascript
document.addEventListener('ajax:progress', (e) => {
    console.log('Upload:', e.detail.percent + '%');
});
```

---

## Click Reload Operations

### Simple Reload (Load method)
```html
<button 
    data-reload="/api/content"
    data-reload-target="#content">
    Refresh
</button>

<div id="content">...</div>
```

### GET Request Reload
```html
<button 
    data-reload="/api/users"
    data-reload-gtarget="#users"
    data-target-main=".user-list"
    data-max-clicks="5"
    data-loader="off">
    Load Users
</button>
```

**Attributes:**
- `data-reload`: URL
- `data-reload-gtarget`: Target selector
- `data-target-main`: Specific selector from response (optional)
- `data-max-clicks`: Maximum click limit
- `data-loader="off"`: Disable spinner

### POST Request Reload
```html
<button 
    data-reload="/api/refresh"
    data-reload-ptarget="#content"
    data-target-main=".main-content">
    Refresh (POST)
</button>
```

**Note:** POST requests automatically include CSRF token

---

## Auto Load Operations

Automatically loads content when page loads.

### jQuery Load Method
```html
<div 
    data-autoload="/api/dashboard"
    data-reload-target="#dashboard-content"
    data-reload-main=".stats"
    data-reload-callback="dashboardLoaded">
</div>
```

### GET Request
```html
<div 
    data-autoload-get="/api/users"
    data-reload-target="#users"
    data-values='{"status":"active","limit":"20"}'
    data-reload-callback="usersLoaded">
</div>

<!-- String format -->
<div 
    data-autoload-get="/api/products"
    data-reload-target="#products"
    data-values="category:electronics;sort:price">
</div>
```

### POST Request
```html
<div 
    data-autoload-post="/api/data"
    data-reload-target="#data"
    data-values='{"user_id":"123"}'
    data-reload-callback="dataLoaded">
</div>
```

**Callback Example:**
```javascript
function dashboardLoaded($element, response, type) {
    if (type === 'success') {
        console.log('Dashboard loaded');
    } else {
        console.error('Error:', response);
    }
}
```

---

## Modal Operations

### GET Modal
```html
<button 
    data-ajax-modal="/users/create"
    data-values='{"type":"admin"}'
    data-class="modal-fullscreen">
    New User
</button>
```

### POST Modal
```html
<button 
    data-ajax-pmodal="/users/edit"
    data-values="id:123;role:admin"
    data-class="modal-xl">
    Edit
</button>
```

**Modal Features:**
- Automatically uses `#ajaxHelperModal` ID
- `data-class`: Additional CSS classes for modal
- `data-values`: JSON or string format parameters
- POST automatically includes CSRF token

**Modal HTML Response:**
```html
<div class="modal-dialog">
    <div class="modal-content">
        <div class="modal-header">...</div>
        <div class="modal-body">...</div>
    </div>
</div>
```

---

## Bulk Actions

### Select All
```html
<input type="checkbox" 
    data-bulk-all
    data-target='[name="ids[]"]'>
Select All
```

### Bulk Action
```html
<button 
    data-bulk-action="/admin/users/delete"
    data-target='[name="ids[]"]:checked'
    data-toggle="#bulk-actions">
    Delete Selected
</button>

<div id="bulk-actions" style="display:none">
    <!-- Shown when items are selected -->
</div>
```

**Features:**
- `data-toggle`: Element to show when items are selected
- Automatic SweetAlert2 confirmation
- Sends `ids` array to backend

### Bulk Export
```html
<button 
    data-bulk-export="/admin/users/export"
    data-target='[name="ids[]"]:checked'>
    Export Excel
</button>
```

**Note:** Creates and submits a POST form (for file downloads)

---

## Other Features

### Ajax Confirm
```html
<a href="#" 
    data-ajax-confirm="/api/delete/123"
    data-reload="1500"
    data-ajax-confirm-title="Are you sure?"
    data-ajax-confirm-text="This action cannot be undone"
    data-ajax-confirm-icon="warning"
    data-ajax-confirm-button="Yes, delete"
    data-ajax-cancel-button="Cancel">
    Delete
</a>
```

### Copy to Clipboard
```html
<button data-copy="This text will be copied">
    Copy
</button>

<!-- Multiple lines with ; -->
<button data-copy="Line 1;Line 2;Line 3">
    Copy
</button>
```

### Ajax Tabs
```html
<ul class="nav nav-tabs">
    <li>
        <a href="/tab1" 
            data-ajax-tab
            data-target="#tab1"
            data-reload="false">
            Tab 1
        </a>
    </li>
</ul>

<div class="tab-content">
    <div id="tab1" class="ajax-tab-pane"></div>
</div>
```

**Features:**
- Loads on first click, then shows from cache
- `data-reload="true"`: Reload on every click

### Polling (Auto Refresh)
```html
<div 
    data-poll="5000"
    data-url="/api/notifications">
    Loading notifications...
</div>
```

**Note:** Interval in milliseconds (default: 5000ms)

### Sortable (Drag & Drop)
```html
<ul data-sortable="/api/sort"
    data-handle=".drag-handle"
    data-reload-target="#list"
    data-reload-url="/admin/list">
    <li data-id="1" class="drag-handle">Item 1</li>
    <li data-id="2" class="drag-handle">Item 2</li>
</ul>
```

**Data sent to backend:**
```json
{
    "order": [
        {"id": "1", "position": 1},
        {"id": "2", "position": 2}
    ]
}
```

### Autosave
```html
<form action="/api/save" method="POST">
    <input type="text" 
        name="title" 
        data-autosave>
</form>
```

**Features:**
- 500ms debounce
- Only sends changed field
- Shows Laravel validation errors

---

## Callbacks & Hooks

### Global Hook
```javascript
const ajaxHelper = new AjaxHelper({
    afterReload: (target) => {
        console.log('Reloaded:', target);
        // Re-initialize components in new content
        initTooltips();
        initDatepickers();
    }
});
```

### Form Callback
```html
<form data-xhr data-callback="handleFormSubmit">
```

```javascript
function handleFormSubmit($form, response, type) {
    if (type === 'loader') {
        // Before form submit
        showCustomLoader();
    } else if (type === 'success') {
        // Success
        console.log(response);
    } else if (type === 'error') {
        // Error
        console.error(response);
    }
}
```

**Stop execution from callback:**
```javascript
function myCallback($form, response, type) {
    if (someCondition) {
        throw '__stop__'; // Stop execution
    }
}
```

---

## Custom Events

### ajax:success
```javascript
document.addEventListener('ajax:success', (e) => {
    console.log('Element:', e.detail.element);
    console.log('Response:', e.detail.response);
    console.log('Form:', e.detail.form); // If form
});
```

### ajax:error
```javascript
document.addEventListener('ajax:error', (e) => {
    console.log('Element:', e.detail.element);
    console.log('Error:', e.detail.error);
});
```

### ajax:progress (Form upload only)
```javascript
document.addEventListener('ajax:progress', (e) => {
    console.log('Form:', e.detail.form);
    console.log('Progress:', e.detail.percent + '%');
});
```

---

## Examples

### Example 1: CRUD Form
```html
<form action="/admin/users" method="POST" 
    data-xhr
    data-submit-loader="true"
    data-callback="userSaved">
    
    <input type="text" name="name" required>
    <input type="email" name="email" required>
    
    <button type="submit">Save</button>
</form>

<script>
function userSaved($form, res, type) {
    if (type === 'success') {
        $('#userModal').modal('hide');
        // Reload list
        $('#userList').load('/admin/users #userList > *');
    }
}
</script>
```

### Example 2: Bulk Delete
```html
<table>
    <thead>
        <tr>
            <th>
                <input type="checkbox" data-bulk-all>
            </th>
            <th>User</th>
        </tr>
    </thead>
    <tbody>
        <tr>
            <td><input type="checkbox" name="ids[]" value="1"></td>
            <td>John Doe</td>
        </tr>
        <tr>
            <td><input type="checkbox" name="ids[]" value="2"></td>
            <td>Jane Smith</td>
        </tr>
    </tbody>
</table>

<div id="bulk-actions" style="display:none">
    <button data-bulk-action="/admin/users/delete"
            data-toggle="#bulk-actions">
        Delete Selected
    </button>
</div>
```

### Example 3: Dashboard Auto Load
```html
<div class="row">
    <div class="col-md-6" 
        data-autoload-get="/admin/stats/sales"
        data-reload-target="#sales-stats"
        data-values='{"period":"monthly"}'>
        <div id="sales-stats">Loading...</div>
    </div>
    
    <div class="col-md-6"
        data-autoload-post="/admin/stats/users"
        data-reload-target="#user-stats"
        data-reload-callback="statsLoaded">
        <div id="user-stats">Loading...</div>
    </div>
</div>

<script>
function statsLoaded($el, response, type) {
    if (type === 'success') {
        initCharts(); // Initialize Chart.js
    }
}
</script>
```

### Example 4: Modal CRUD
```html
<!-- List -->
<button data-ajax-modal="/admin/users/create">
    New User
</button>

<button data-ajax-pmodal="/admin/users/edit"
    data-values='{"id":123}'>
    Edit
</button>

<!-- Form inside modal -->
<form action="/admin/users" method="POST" data-xhr>
    <!-- Form submit closes modal and reloads list -->
</form>
```

---

## Troubleshooting

### Form submit not working
- Check `data-xhr` attribute exists
- Check console for errors
- Verify CSRF token is correct

### Modal not opening
- Verify Bootstrap JS is loaded
- Check response HTML structure

### AutoLoad not working
- Runs inside `$(document).ready()`, won't work before DOMContentLoaded
- Check URL and target selectors

### Callback not working
- Check function is in global scope
- Test if accessible via `window.functionName`

---

## Notes

1. **CSRF Token:** All POST requests automatically include CSRF token
2. **jQuery:** All selectors work with jQuery
3. **Bootstrap Modal:** Modal examples compatible with Bootstrap 4/5
4. **Error Handling:** 422 validation errors automatically displayed on forms
5. **Performance:** Uses event delegation, supports dynamic elements

---

## License

MIT License - Free for personal and commercial use

## Support

For issues and questions, please open an issue on GitHub

---

## Who is this for?

✅ Laravel developers building admin panels

✅ Projects already using jQuery + Bootstrap

✅ Rapid prototyping and internal tools

✅ Legacy admin systems needing quick fixes

❌ Modern SPA applications (use Inertia/Livewire)

❌ jQuery-free projects

❌ Production customer-facing apps

**Last Updated:** 2025
