/**
 * 📁 File Operations Utility
 * Centralized file handling với error handling và validation
 */

import fs from 'fs';
import path from 'path';
import { FILE_PATHS, ERROR_MESSAGES } from '../config/constants.js';

export class FileOperations {
  /**
   * Đọc JSON file với error handling
   * @param {string} filePath - Path to JSON file
   * @param {*} defaultValue - Default value if file doesn't exist
   * @returns {Promise<*>} Parsed JSON data
   */
  static async readJSON(filePath, defaultValue = null) {
    try {
      const fullPath = path.resolve(filePath);
      
      if (!fs.existsSync(fullPath)) {
        console.log(`📄 File not found, using default: ${filePath}`);
        return defaultValue;
      }
      
      const data = await fs.promises.readFile(fullPath, 'utf8');
      const parsed = JSON.parse(data);
      
      console.log(`📖 Successfully read JSON: ${filePath}`);
      return parsed;
      
    } catch (error) {
      console.error(`❌ Failed to read JSON file ${filePath}:`, error.message);
      
      if (error instanceof SyntaxError) {
        throw new Error(`Invalid JSON format in ${filePath}: ${error.message}`);
      }
      
      throw new Error(`${ERROR_MESSAGES.NETWORK_ERROR} (${error.message})`);
    }
  }

  /**
   * Ghi JSON file với formatting và backup
   * @param {string} filePath - Path to JSON file
   * @param {*} data - Data to write
   * @param {Object} options - Write options
   * @returns {Promise<void>}
   */
  static async writeJSON(filePath, data, options = {}) {
    try {
      const {
        indent = 2,
        createBackup = false,
        ensureDir = true
      } = options;
      
      const fullPath = path.resolve(filePath);
      
      // Ensure directory exists
      if (ensureDir) {
        const dir = path.dirname(fullPath);
        await fs.promises.mkdir(dir, { recursive: true });
      }
      
      // Create backup if requested
      if (createBackup && fs.existsSync(fullPath)) {
        const backupPath = `${fullPath}.backup`;
        await fs.promises.copyFile(fullPath, backupPath);
        console.log(`💾 Created backup: ${backupPath}`);
      }
      
      // Write JSON with formatting
      const jsonString = JSON.stringify(data, null, indent);
      await fs.promises.writeFile(fullPath, jsonString, 'utf8');
      
      console.log(`💾 Successfully wrote JSON: ${filePath} (${jsonString.length} bytes)`);
      
    } catch (error) {
      console.error(`❌ Failed to write JSON file ${filePath}:`, error.message);
      throw new Error(`Cannot save file: ${error.message}`);
    }
  }

  /**
   * Append data to JSON array file
   * @param {string} filePath - Path to JSON array file
   * @param {*} newData - Data to append
   * @param {number} maxItems - Maximum items to keep (0 = unlimited)
   * @returns {Promise<void>}
   */
  static async appendToJSONArray(filePath, newData, maxItems = 0) {
    try {
      const existingData = await this.readJSON(filePath, []);
      
      if (!Array.isArray(existingData)) {
        throw new Error(`File ${filePath} does not contain a JSON array`);
      }
      
      // Add new data to beginning of array
      existingData.unshift(newData);
      
      // Trim array if needed
      if (maxItems > 0 && existingData.length > maxItems) {
        existingData.splice(maxItems);
        console.log(`✂️ Trimmed array to ${maxItems} items`);
      }
      
      await this.writeJSON(filePath, existingData);
      
    } catch (error) {
      console.error(`❌ Failed to append to JSON array ${filePath}:`, error.message);
      throw error;
    }
  }

  /**
   * Merge data into existing JSON object
   * @param {string} filePath - Path to JSON object file
   * @param {Object} newData - Data to merge
   * @param {boolean} deep - Deep merge or shallow merge
   * @returns {Promise<void>}
   */
  static async mergeJSON(filePath, newData, deep = false) {
    try {
      const existingData = await this.readJSON(filePath, {});
      
      if (typeof existingData !== 'object' || Array.isArray(existingData)) {
        throw new Error(`File ${filePath} does not contain a JSON object`);
      }
      
      const mergedData = deep 
        ? this.deepMerge(existingData, newData)
        : { ...existingData, ...newData };
      
      await this.writeJSON(filePath, mergedData);
      
    } catch (error) {
      console.error(`❌ Failed to merge JSON file ${filePath}:`, error.message);
      throw error;
    }
  }

  /**
   * Deep merge two objects
   * @param {Object} target - Target object
   * @param {Object} source - Source object
   * @returns {Object} Merged object
   */
  static deepMerge(target, source) {
    const result = { ...target };
    
    for (const key in source) {
      if (source.hasOwnProperty(key)) {
        if (typeof source[key] === 'object' && source[key] !== null && !Array.isArray(source[key])) {
          result[key] = this.deepMerge(result[key] || {}, source[key]);
        } else {
          result[key] = source[key];
        }
      }
    }
    
    return result;
  }

  /**
   * Get file stats with error handling
   * @param {string} filePath - Path to file
   * @returns {Promise<Object|null>} File stats or null if not exists
   */
  static async getFileStats(filePath) {
    try {
      const fullPath = path.resolve(filePath);
      const stats = await fs.promises.stat(fullPath);
      
      return {
        size: stats.size,
        created: stats.birthtime,
        modified: stats.mtime,
        isFile: stats.isFile(),
        isDirectory: stats.isDirectory()
      };
      
    } catch (error) {
      if (error.code === 'ENOENT') {
        return null; // File doesn't exist
      }
      
      console.error(`❌ Failed to get file stats ${filePath}:`, error.message);
      throw error;
    }
  }

  /**
   * Ensure directory exists
   * @param {string} dirPath - Directory path
   * @returns {Promise<void>}
   */
  static async ensureDir(dirPath) {
    try {
      await fs.promises.mkdir(path.resolve(dirPath), { recursive: true });
    } catch (error) {
      console.error(`❌ Failed to create directory ${dirPath}:`, error.message);
      throw error;
    }
  }

  /**
   * Clean up old files in directory
   * @param {string} dirPath - Directory path
   * @param {number} maxAge - Max age in milliseconds
   * @param {string} pattern - File pattern (glob)
   * @returns {Promise<number>} Number of files deleted
   */
  static async cleanupOldFiles(dirPath, maxAge, pattern = '*') {
    try {
      const fullPath = path.resolve(dirPath);
      
      if (!fs.existsSync(fullPath)) {
        return 0;
      }
      
      const files = await fs.promises.readdir(fullPath);
      const now = Date.now();
      let deletedCount = 0;
      
      for (const file of files) {
        const filePath = path.join(fullPath, file);
        const stats = await fs.promises.stat(filePath);
        
        if (stats.isFile() && (now - stats.mtime.getTime()) > maxAge) {
          if (pattern === '*' || file.includes(pattern)) {
            await fs.promises.unlink(filePath);
            deletedCount++;
            console.log(`🗑️ Deleted old file: ${file}`);
          }
        }
      }
      
      return deletedCount;
      
    } catch (error) {
      console.error(`❌ Failed to cleanup old files in ${dirPath}:`, error.message);
      throw error;
    }
  }

  /**
   * Get standard file paths
   * @returns {Object} Object with standard file paths
   */
  static getStandardPaths() {
    const dataDir = path.resolve(FILE_PATHS.DATA_DIR);
    
    return {
      dataDir,
      moviesFile: path.join(dataDir, FILE_PATHS.MOVIES_FILE),
      updatesLog: path.join(dataDir, FILE_PATHS.UPDATES_LOG),
      configFile: path.join(dataDir, FILE_PATHS.CONFIG_FILE),
      notificationFile: path.join(dataDir, FILE_PATHS.NOTIFICATION_FILE),
      summaryFile: path.resolve(FILE_PATHS.SUMMARY_FILE)
    };
  }
}

export default FileOperations;
