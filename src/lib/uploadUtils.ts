export function getAllComponentsFromCustomization(customization) {
  const comps = [
    ...(customization.topComponents || []),
    ...(customization.bottomComponents || [])
  ];
  (customization.rows || []).forEach(row => {
    row.columns?.forEach(col => {
      if (Array.isArray(col)) comps.push(...col);
      else if (col) comps.push(col);
    });
  });
  return comps;
}

export function hasPendingUploads(customization) {
  const comps = getAllComponentsFromCustomization(customization);
  return comps.some(c => c?.content?._uploading === true);
}

export function waitForUploadsToFinish(getCustomizationFn, timeout = 45000) {
  return new Promise((resolve, reject) => {
    const start = Date.now();
    const iv = setInterval(() => {
      const customization = getCustomizationFn();
      if (!hasPendingUploads(customization)) {
        clearInterval(iv);
        resolve(true);
      } else if (Date.now() - start > timeout) {
        clearInterval(iv);
        reject(new Error("Timeout waiting for uploads to finish"));
      }
    }, 300);
  });
}
