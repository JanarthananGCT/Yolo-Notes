// Initialize storage first
let storage;

class DashboardUI {
    constructor() {
        // DOM Elements
        this.notesGrid = document.getElementById('notes-grid');
        this.loadingState = document.getElementById('loading-state');
        this.emptyState = document.getElementById('empty-state');
        this.searchInput = document.getElementById('search-input');
        this.sortSelect = document.getElementById('sort-select');
        this.websiteFilter = document.getElementById('website-filter');
        this.editModal = document.getElementById('edit-modal');
        this.editNoteContent = document.getElementById('edit-note-content');
        this.cancelEditBtn = document.getElementById('cancel-edit');
        this.saveEditBtn = document.getElementById('save-edit');

        // State
        this.allNotes = {};
        this.currentEditingNote = null;
    }

    async init() {
        // Load initial data
        await this.loadNotes();
        
        // Setup event listeners
        this.setupEventListeners();
    }

    setupEventListeners() {
        // Search input
        this.searchInput.addEventListener('input', this.debounce(() => {
            this.filterNotes();
        }, 300));

        // Sort select
        this.sortSelect.addEventListener('change', () => {
            this.filterNotes();
        });

        // Website filter
        this.websiteFilter.addEventListener('change', () => {
            this.filterNotes();
        });

        // Modal events
        this.cancelEditBtn.addEventListener('click', () => {
            this.closeEditModal();
        });

        this.saveEditBtn.addEventListener('click', async () => {
            await this.saveNoteEdit();
        });

        // Close modal when clicking outside
        this.editModal.addEventListener('click', (e) => {
            if (e.target === this.editModal) {
                this.closeEditModal();
            }
        });
    }

    async loadNotes() {
        this.showLoading();
        try {
            this.allNotes = await storage.getAllNotes();
            
            // Update website filter options
            this.updateWebsiteFilter();
            
            // Display notes
            this.filterNotes();
        } catch (error) {
            console.error('Error loading notes:', error);
            this.notesGrid.innerHTML = `
                <div class="text-red-500 p-4 text-center">
                    Failed to load notes. Please try refreshing the page.
                </div>
            `;
        } finally {
            this.hideLoading();
        }
    }

    updateWebsiteFilter() {
        const websites = Object.keys(this.allNotes);
        const filterSelect = this.websiteFilter;
        
        // Clear existing options except "All Websites"
        filterSelect.innerHTML = '<option value="all">All Websites</option>';
        
        // Add website options
        websites.forEach(website => {
            const option = document.createElement('option');
            option.value = website;
            option.textContent = new URL(website).hostname;
            filterSelect.appendChild(option);
        });
    }

    filterNotes() {
        const searchQuery = this.searchInput.value.toLowerCase();
        const sortOrder = this.sortSelect.value;
        const websiteFilter = this.websiteFilter.value;

        let filteredNotes = [];

        // Filter by website and search query
        Object.entries(this.allNotes).forEach(([url, notes]) => {
            if (websiteFilter === 'all' || websiteFilter === url) {
                notes.forEach(note => {
                    if (note.content.toLowerCase().includes(searchQuery)) {
                        filteredNotes.push({ ...note, url });
                    }
                });
            }
        });

        // Sort notes
        filteredNotes.sort((a, b) => {
            const dateA = new Date(sortOrder === 'newest' ? a.updatedAt : a.createdAt);
            const dateB = new Date(sortOrder === 'newest' ? b.updatedAt : b.createdAt);
            return dateB - dateA;
        });

        this.renderNotes(filteredNotes);
    }

    renderNotes(notes) {
        if (notes.length === 0) {
            this.showEmptyState();
            return;
        }

        this.hideEmptyState();
        this.notesGrid.innerHTML = '';

        notes.forEach(note => {
            const noteElement = this.createNoteElement(note);
            this.notesGrid.appendChild(noteElement);
        });
    }

    createNoteElement(note) {
        const div = document.createElement('div');
        div.className = 'note-card bg-white rounded-lg shadow p-6 flex flex-col';
        div.dataset.noteId = note.id;
        div.dataset.url = note.url;

        const hostname = new URL(note.url).hostname;
        
        div.innerHTML = `
            <div class="website-tag inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800 mb-3">
                ${hostname}
            </div>
            <div class="note-content flex-grow mb-4">
                ${this.highlightSearchTerms(note.content)}
            </div>
            <div class="flex items-center justify-between text-sm text-gray-500">
                <span>Updated: ${this.formatDate(note.updatedAt)}</span>
                <div class="flex gap-2">
                    <button class="edit-btn text-blue-500 hover:text-blue-700">Edit</button>
                    <button class="delete-btn text-red-500 hover:text-red-700">Delete</button>
                </div>
            </div>
        `;

        // Add event listeners
        div.querySelector('.edit-btn').addEventListener('click', () => {
            this.openEditModal(note);
        });

        div.querySelector('.delete-btn').addEventListener('click', () => {
            this.deleteNote(note);
        });

        return div;
    }

    highlightSearchTerms(content) {
        const searchQuery = this.searchInput.value.trim();
        if (!searchQuery) return content;

        const regex = new RegExp(`(${searchQuery})`, 'gi');
        return content.replace(regex, '<mark class="highlight">$1</mark>');
    }

    async openEditModal(note) {
        this.currentEditingNote = note;
        this.editNoteContent.value = note.content;
        this.editModal.classList.add('showing');
        this.editModal.classList.remove('hidden');
        this.editNoteContent.focus();
    }

    closeEditModal() {
        this.editModal.classList.remove('showing');
        this.editModal.classList.add('hidden');
        this.currentEditingNote = null;
        this.editNoteContent.value = '';
    }

    async saveNoteEdit() {
        if (!this.currentEditingNote) return;

        const newContent = this.editNoteContent.value.trim();
        if (!newContent) return;

        try {
            const updatedNote = await storage.updateNote(
                this.currentEditingNote.url,
                this.currentEditingNote.id,
                newContent
            );

            // Update local data
            this.allNotes[this.currentEditingNote.url] = this.allNotes[this.currentEditingNote.url].map(note =>
                note.id === updatedNote.id ? updatedNote : note
            );

            this.closeEditModal();
            this.filterNotes();
            this.showToast('Note updated successfully', 'success');
        } catch (error) {
            console.error('Error updating note:', error);
            this.showToast('Failed to update note', 'error');
        }
    }

    async deleteNote(note) {
        if (!confirm('Are you sure you want to delete this note?')) return;

        try {
            await storage.deleteNote(note.url, note.id);

            // Update local data
            this.allNotes[note.url] = this.allNotes[note.url].filter(n => n.id !== note.id);
            if (this.allNotes[note.url].length === 0) {
                delete this.allNotes[note.url];
                this.updateWebsiteFilter();
            }

            // Animate and remove note element
            const noteElement = this.notesGrid.querySelector(`[data-note-id="${note.id}"]`);
            noteElement.classList.add('deleting');
            setTimeout(() => {
                this.filterNotes();
            }, 300);

            this.showToast('Note deleted successfully', 'success');
        } catch (error) {
            console.error('Error deleting note:', error);
            this.showToast('Failed to delete note', 'error');
        }
    }

    showToast(message, type = 'success') {
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.textContent = message;
        document.body.appendChild(toast);

        setTimeout(() => {
            toast.remove();
        }, 3000);
    }

    formatDate(dateString) {
        return new Date(dateString).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    showLoading() {
        this.loadingState.classList.remove('hidden');
        this.notesGrid.classList.add('hidden');
        this.emptyState.classList.add('hidden');
    }

    hideLoading() {
        this.loadingState.classList.add('hidden');
        this.notesGrid.classList.remove('hidden');
    }

    showEmptyState() {
        this.emptyState.classList.remove('hidden');
        this.notesGrid.classList.add('hidden');
    }

    hideEmptyState() {
        this.emptyState.classList.add('hidden');
        this.notesGrid.classList.remove('hidden');
    }

    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }
}

// Initialize dashboard
async function initDashboard() {
    try {
        // Initialize storage first
        storage = await import(chrome.runtime.getURL('../js/storage.js')).then(module => module.default);
        
        // Create and initialize dashboard
        const dashboard = new DashboardUI();
        await dashboard.init();
    } catch (error) {
        console.error('Error initializing dashboard:', error);
        // Show error to user
        const errorDiv = document.createElement('div');
        errorDiv.className = 'text-red-500 p-4 text-center';
        errorDiv.textContent = 'Failed to initialize dashboard. Please try refreshing the page.';
        document.body.appendChild(errorDiv);
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', initDashboard);
