/**
 * LocalStorage utilities for managing app data
 */

const STORAGE_KEYS = {
  SMTP_CONFIG: 'salary_slip_smtp_config',
  EMAIL_HISTORY: 'salary_slip_email_history',
  APP_SETTINGS: 'salary_slip_settings'
};

/**
 * Save SMTP configuration to localStorage
 */
export function saveSMTPConfig(config) {
  try {
    // Encrypt password in real app - for demo, we'll store as-is with warning
    const configToSave = {
      ...config,
      savedAt: new Date().toISOString()
    };
    localStorage.setItem(STORAGE_KEYS.SMTP_CONFIG, JSON.stringify(configToSave));
    return true;
  } catch (error) {
    console.error('Failed to save SMTP config:', error);
    return false;
  }
}

/**
 * Load SMTP configuration from localStorage
 */
export function loadSMTPConfig() {
  try {
    const config = localStorage.getItem(STORAGE_KEYS.SMTP_CONFIG);
    return config ? JSON.parse(config) : null;
  } catch (error) {
    console.error('Failed to load SMTP config:', error);
    return null;
  }
}

/**
 * Clear SMTP configuration
 */
export function clearSMTPConfig() {
  localStorage.removeItem(STORAGE_KEYS.SMTP_CONFIG);
}

/**
 * Save email to history
 */
export function addToEmailHistory(emailData) {
  try {
    const history = getEmailHistory();
    history.unshift({
      ...emailData,
      sentAt: new Date().toISOString()
    });

    // Keep only last 100 records
    const trimmedHistory = history.slice(0, 100);

    localStorage.setItem(STORAGE_KEYS.EMAIL_HISTORY, JSON.stringify(trimmedHistory));
    return true;
  } catch (error) {
    console.error('Failed to save email history:', error);
    return false;
  }
}

/**
 * Get email history
 */
export function getEmailHistory() {
  try {
    const history = localStorage.getItem(STORAGE_KEYS.EMAIL_HISTORY);
    return history ? JSON.parse(history) : [];
  } catch (error) {
    console.error('Failed to load email history:', error);
    return [];
  }
}

/**
 * Clear email history
 */
export function clearEmailHistory() {
  localStorage.removeItem(STORAGE_KEYS.EMAIL_HISTORY);
}

/**
 * Save app settings
 */
export function saveSettings(key, settings) {
  try {
    const storageKey = key || STORAGE_KEYS.APP_SETTINGS;
    localStorage.setItem(storageKey, JSON.stringify(settings));
    return true;
  } catch (error) {
    console.error('Failed to save settings:', error);
    return false;
  }
}

/**
 * Load app settings
 */
export function loadSettings(key) {
  try {
    const storageKey = key || STORAGE_KEYS.APP_SETTINGS;
    const settings = localStorage.getItem(storageKey);
    return settings ? JSON.parse(settings) : null;
  } catch (error) {
    console.error('Failed to load settings:', error);
    return null;
  }
}

/**
 * Get default settings
 */
function getDefaultSettings() {
  return {
    emailSubjectTemplate: '工资条 - {month}',
    delayBetweenEmails: 1000, // 1 second
    generatePDF: true,
    confirmBeforeSending: true
  };
}

/**
 * Clear all app data
 */
export function clearAllData() {
  Object.values(STORAGE_KEYS).forEach(key => {
    localStorage.removeItem(key);
  });
}

/**
 * Get storage usage information
 */
export function getStorageInfo() {
  const info = {
    smtpConfig: !!localStorage.getItem(STORAGE_KEYS.SMTP_CONFIG),
    emailHistoryCount: getEmailHistory().length,
    settings: !!localStorage.getItem(STORAGE_KEYS.APP_SETTINGS),
    totalSize: 0
  };

  // Calculate approximate size
  Object.values(STORAGE_KEYS).forEach(key => {
    const item = localStorage.getItem(key);
    if (item) {
      info.totalSize += item.length;
    }
  });

  info.totalSizeKB = (info.totalSize / 1024).toFixed(2);

  return info;
}
