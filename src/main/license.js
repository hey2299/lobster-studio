// License System - Community vs Professional edition
// Simple local activation with feature flags

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const LICENSE_PATH = path.join(__dirname, '.license.json');

const EDITIONS = {
  community: {
    name: '社区版',
    price: '免费',
    features: {
      maxScenesPerScript: 10,
      maxProjects: 5,
      maxCharacters: 10,
      imageGeneration: false,
      ttsGeneration: false,
      videoExport: false,
      multiPlatformPublish: false,
      vectorMemory: false,
      batchProcessing: false,
    },
  },
  professional: {
    name: '专业版',
    price: '¥199/年',
    features: {
      maxScenesPerScript: 100,
      maxProjects: 999,
      maxCharacters: 999,
      imageGeneration: true,
      ttsGeneration: true,
      videoExport: true,
      multiPlatformPublish: true,
      vectorMemory: true,
      batchProcessing: true,
    },
  },
  lifetime: {
    name: '永久版',
    price: '¥599',
    features: {
      maxScenesPerScript: 999,
      maxProjects: 9999,
      maxCharacters: 9999,
      imageGeneration: true,
      ttsGeneration: true,
      videoExport: true,
      multiPlatformPublish: true,
      vectorMemory: true,
      batchProcessing: true,
    },
  },
};

function getLicense() {
  try {
    if (fs.existsSync(LICENSE_PATH)) {
      const data = JSON.parse(fs.readFileSync(LICENSE_PATH, 'utf8'));
      if (data.licenseKey && verifyLicenseKey(data.licenseKey)) {
        const rawEdition = data.edition || 'professional';
        // Map aliases (enterprise → lifetime)
        const aliases = { enterprise: 'lifetime' };
        const edition = aliases[rawEdition] || rawEdition;
        return {
          activated: true,
          licenseKey: data.licenseKey,
          edition: rawEdition, // keep original for display
          activatedDate: data.activatedDate,
          features: EDITIONS[edition]?.features || EDITIONS.professional.features,
        };
      }
    }
  } catch {}
  
  // Default: community edition
  return {
    activated: false,
    licenseKey: '',
    edition: 'community',
    features: EDITIONS.community.features,
  };
}

function activateLicense(licenseKey, edition) {
  if (verifyLicenseKey(licenseKey)) {
    const data = {
      licenseKey,
      edition: edition || 'professional',
      activatedDate: Date.now(),
    };
    fs.writeFileSync(LICENSE_PATH, JSON.stringify(data, null, 2));
    return { success: true, edition: data.edition };
  }
  return { success: false, error: '无效的激活码' };
}

function deactivateLicense() {
  if (fs.existsSync(LICENSE_PATH)) {
    fs.unlinkSync(LICENSE_PATH);
  }
  return { success: true };
}

function verifyLicenseKey(key) {
  // Simple validation: key format is XXXXX-XXXXX-XXXXX-XXXXX
  // In production, this would verify against a server
  if (!key || typeof key !== 'string') return false;
  
  // Accept demo keys for testing
  const DEMO_KEYS = ['LOBSTER-PRO-2026-DEMO', 'LOBSTER-ENT-2026-DEMO', 'LOBSTER-LIFETIME-DEMO'];
  if (DEMO_KEYS.includes(key)) return true;
  
  // Format check: 4 groups of 5 alphanumeric chars
  const pattern = /^[A-Z0-9]{5}-[A-Z0-9]{5}-[A-Z0-9]{5}-[A-Z0-9]{5}$/;
  if (!pattern.test(key.toUpperCase())) return false;
  
  // Simple checksum on last group
  const groups = key.split('-');
  const last = groups[3];
  const check = groups.slice(0, 3).join('').split('').reduce((s, c) => s + c.charCodeAt(0), 0);
  const expected = String(check % 100000).padStart(5, '0');
  return last === expected;
}

function generateTrialKey() {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 7).toUpperCase();
  return `TRIAL-${timestamp}-${random}-7DAY`;
}

function getEditionInfo() {
  return Object.entries(EDITIONS).map(([id, ed]) => ({
    id,
    name: ed.name,
    price: ed.price,
    features: ed.features,
    isCurrent: getLicense().edition === id,
  }));
}

function checkFeature(featureName) {
  const license = getLicense();
  return license.features[featureName] === true;
}

module.exports = {
  getLicense, activateLicense, deactivateLicense, getEditionInfo, checkFeature, generateTrialKey,
};
