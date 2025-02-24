// Import storage module
let storage;

// Helper function to get current tab URL
async function getCurrentTabUrl() {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    return new URL(tab.url);
}

// Helper function to format date
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

// Create note element
function createNoteElement(note) {
    const noteDiv = document.createElement('div');
    noteDiv.className = 'note bg-white shadow-sm rounded-lg p-3 animate-slide-in';
    noteDiv.dataset.noteId = note.id;

    const contentDiv = document.createElement('div');
    contentDiv.className = 'note-content mb-2';
    contentDiv.textContent = note.content;
    contentDiv.setAttribute('contenteditable', 'false');

    const timestampDiv = document.createElement('div');
    timestampDiv.className = 'note-timestamp text-xs text-gray-500';
    timestampDiv.textContent = `Last updated: ${formatDate(note.updatedAt)}`;

    const actionsDiv = document.createElement('div');
    actionsDiv.className = 'note-actions flex justify-end gap-2 mt-2';

    const editButton = document.createElement('button');
    editButton.className = 'edit-btn bg-blue-500 text-white px-2 py-1 rounded text-sm hover:bg-blue-600 transition-colors';
    editButton.textContent = 'Edit';

    const deleteButton = document.createElement('button');
    deleteButton.className = 'delete-btn bg-red-500 text-white px-2 py-1 rounded text-sm hover:bg-red-600 transition-colors';
    deleteButton.textContent = 'Delete';

    actionsDiv.appendChild(editButton);
    actionsDiv.appendChild(deleteButton);

    noteDiv.appendChild(contentDiv);
    noteDiv.appendChild(timestampDiv);
    noteDiv.appendChild(actionsDiv);

    return noteDiv;
}

// Initialize popup
async function initPopup() {
    // Initialize storage first
    storage = await import(chrome.runtime.getURL('../js/storage.js')).then(module => module.default);
    
    const notesList = document.getElementById('notes-list');
    const noteForm = document.getElementById('note-form');
    const noteInput = document.getElementById('note-input');
    const url = (await getCurrentTabUrl()).href;
    
    document.getElementById('website-url').textContent = new URL(url).hostname;

    // Load existing notes
    async function loadNotes() {
        notesList.innerHTML = '<div class="loading"><div class="loading-spinner"></div></div>';
        try {
            const notes = await storage.getNotesForUrl(url);
            notesList.innerHTML = '';
            
            if (notes.length === 0) {
                notesList.innerHTML = '<div class="empty-state">No notes yet. Create one above!</div>';
                return;
            }

            notes.forEach(note => {
                notesList.appendChild(createNoteElement(note));
            });
        } catch (error) {
            console.error('Error loading notes:', error);
            notesList.innerHTML = '<div class="text-red-500">Error loading notes. Please try again.</div>';
        }
    }

    // Add new note
    noteForm.addEventListener('submit', async (e) => {
        console.log('submit');
        e.preventDefault();
        const content = noteInput.value.trim();
        
        if (!content) return;

        try {
            const newNote = await storage.createNote(url, content);
            const noteElement = createNoteElement(newNote);
            
            if (notesList.querySelector('.empty-state')) {
                notesList.innerHTML = '';
            }
            
            notesList.insertBefore(noteElement, notesList.firstChild);
            noteInput.value = '';
        } catch (error) {
            console.error('Error creating note:', error);
            alert('Failed to create note. Please try again.');
        }
    });

    // Handle note actions (edit and delete)
    notesList.addEventListener('click', async (e) => {
        const noteDiv = e.target.closest('.note');
        if (!noteDiv) return;

        const noteId = noteDiv.dataset.noteId;
        const contentDiv = noteDiv.querySelector('.note-content');

        if (e.target.classList.contains('edit-btn')) {
            const isEditing = contentDiv.getAttribute('contenteditable') === 'true';
            
            if (isEditing) {
                // Save changes
                try {
                    const updatedNote = await storage.updateNote(url, noteId, contentDiv.textContent);
                    contentDiv.setAttribute('contenteditable', 'false');
                    e.target.textContent = 'Edit';
                    noteDiv.querySelector('.note-timestamp').textContent = 
                        `Last updated: ${formatDate(updatedNote.updatedAt)}`;
                } catch (error) {
                    console.error('Error updating note:', error);
                    alert('Failed to update note. Please try again.');
                }
            } else {
                // Enter edit mode
                contentDiv.setAttribute('contenteditable', 'true');
                contentDiv.focus();
                e.target.textContent = 'Save';
            }
        }

        if (e.target.classList.contains('delete-btn')) {
            if (confirm('Are you sure you want to delete this note?')) {
                try {
                    await storage.deleteNote(url, noteId);
                    noteDiv.classList.add('deleting');
                    setTimeout(() => {
                        noteDiv.remove();
                        if (notesList.children.length === 0) {
                            notesList.innerHTML = '<div class="empty-state">No notes yet. Create one above!</div>';
                        }
                    }, 300);
                } catch (error) {
                    console.error('Error deleting note:', error);
                    alert('Failed to delete note. Please try again.');
                }
            }
        }
    });

    // Load initial notes
    await loadNotes();
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    initPopup().catch(error => {
        console.error('Error initializing popup:', error);
    });
});

// Add event listener for the dashboard button
document.getElementById('open-dashboard').addEventListener('click', () => {
    chrome.tabs.create({ url: 'chrome://newtab' });
});
