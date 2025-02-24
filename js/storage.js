class NotesStorage {
  constructor() {
    this.storage = chrome.storage.local;
  }

  /**
   * Generate a unique ID for new notes
   * @returns {string} Unique ID
   */
  generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  /**
   * Get all notes for a specific URL
   * @param {string} url - The website URL
   * @returns {Promise<Array>} Array of notes for the URL
   */
  async getNotesForUrl(url) {
    try {
      const result = await this.storage.get('notes');
      const allNotes = result.notes || {};
      return allNotes[url] || [];
    } catch (error) {
      console.error('Error fetching notes:', error);
      throw error;
    }
  }

  /**
   * Get all notes across all websites
   * @returns {Promise<Object>} Object with URLs as keys and arrays of notes as values
   */
  async getAllNotes() {
    try {
      const result = await this.storage.get('notes');
      return result.notes || {};
    } catch (error) {
      console.error('Error fetching all notes:', error);
      throw error;
    }
  }

  /**
   * Create a new note for a specific URL
   * @param {string} url - The website URL
   * @param {string} content - The note content
   * @returns {Promise<Object>} The created note object
   */
  async createNote(url, content) {
    try {
      const result = await this.storage.get('notes');
      const allNotes = result.notes || {};
      const urlNotes = allNotes[url] || [];

      const newNote = {
        id: this.generateId(),
        content,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      urlNotes.push(newNote);
      allNotes[url] = urlNotes;

      await this.storage.set({ notes: allNotes });
      return newNote;
    } catch (error) {
      console.error('Error creating note:', error);
      throw error;
    }
  }

  /**
   * Update an existing note
   * @param {string} url - The website URL
   * @param {string} noteId - The note ID
   * @param {string} content - The updated content
   * @returns {Promise<Object>} The updated note object
   */
  async updateNote(url, noteId, content) {
    try {
      const result = await this.storage.get('notes');
      const allNotes = result.notes || {};
      const urlNotes = allNotes[url] || [];

      const noteIndex = urlNotes.findIndex(note => note.id === noteId);
      if (noteIndex === -1) {
        throw new Error('Note not found');
      }

      urlNotes[noteIndex] = {
        ...urlNotes[noteIndex],
        content,
        updatedAt: new Date().toISOString()
      };

      allNotes[url] = urlNotes;
      await this.storage.set({ notes: allNotes });
      return urlNotes[noteIndex];
    } catch (error) {
      console.error('Error updating note:', error);
      throw error;
    }
  }

  /**
   * Delete a note
   * @param {string} url - The website URL
   * @param {string} noteId - The note ID
   * @returns {Promise<void>}
   */
  async deleteNote(url, noteId) {
    try {
      const result = await this.storage.get('notes');
      const allNotes = result.notes || {};
      const urlNotes = allNotes[url] || [];

      const filteredNotes = urlNotes.filter(note => note.id !== noteId);
      
      if (filteredNotes.length === 0) {
        delete allNotes[url];
      } else {
        allNotes[url] = filteredNotes;
      }

      await this.storage.set({ notes: allNotes });
    } catch (error) {
      console.error('Error deleting note:', error);
      throw error;
    }
  }

  /**
   * Search notes across all websites
   * @param {string} query - The search query
   * @returns {Promise<Array>} Array of matching notes with their URLs
   */
  async searchNotes(query) {
    try {
      const allNotes = await this.getAllNotes();
      const results = [];

      for (const [url, notes] of Object.entries(allNotes)) {
        const matchingNotes = notes.filter(note =>
          note.content.toLowerCase().includes(query.toLowerCase())
        );
        
        matchingNotes.forEach(note => {
          results.push({ ...note, url });
        });
      }

      return results;
    } catch (error) {
      console.error('Error searching notes:', error);
      throw error;
    }
  }
}

// Export the storage instance
const storage = new NotesStorage();
export default storage;
