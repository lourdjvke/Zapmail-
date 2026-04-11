export async function fetchEmailsFromRTDB(config: {
  url: string;
  folder: string;
  subfolders: string[];
  explore: boolean;
  fieldName: string;
}): Promise<string[]> {
  if (!config.url) {
    throw new Error("RTDB URL is required");
  }

  let baseUrl = config.url.trim();
  // Remove trailing slash if present
  if (baseUrl.endsWith('/')) {
    baseUrl = baseUrl.slice(0, -1);
  }
  
  // Ensure it has https://
  if (!baseUrl.startsWith('http')) {
    baseUrl = `https://${baseUrl}`;
  }

  const basePath = (config.folder || '').trim().replace(/^\/+|\/+$/g, '');
  const subPath = (config.subfolders || []).map(s => s.trim().replace(/^\/+|\/+$/g, '')).filter(Boolean).join('/');
  const path = subPath ? `${basePath}/${subPath}` : basePath;
  
  // Construct REST API URL
  const fetchUrl = `${baseUrl}/${path}.json`;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 seconds timeout

    const response = await fetch(fetchUrl, { signal: controller.signal });
    clearTimeout(timeoutId);

    if (!response.ok) {
      if (response.status === 401 || response.status === 403) {
        throw new Error("Permission denied. The database requires authentication or rules prevent reading.");
      }
      throw new Error(`Failed to fetch data: ${response.statusText} (${response.status})`);
    }

    const data = await response.json();
    
    if (data === null || data === undefined) {
      throw new Error(`No data found at path: ${path}`);
    }

    let emails: string[] = [];
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    const isValidEmail = (val: any): val is string => typeof val === 'string' && emailRegex.test(val.trim());

    const addIfValid = (val: any) => {
      if (isValidEmail(val)) {
        emails.push(val.trim());
      } else if (typeof val === 'string') {
        // Try to extract email from string if it contains one
        const matches = val.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g);
        if (matches) {
          matches.forEach(m => emails.push(m));
        }
      }
    };

    if (config.explore) {
      // Recursive exploration
      const exploreData = (obj: any) => {
        if (typeof obj === 'object' && obj !== null) {
          // Check if the current object has the target field
          if (obj.hasOwnProperty(config.fieldName)) {
            const val = obj[config.fieldName];
            if (Array.isArray(val)) {
              val.forEach(addIfValid);
            } else {
              addIfValid(val);
            }
          }
          // Continue exploring all values
          Object.values(obj).forEach(exploreData);
        }
      };
      exploreData(data);
    } else {
      // Direct extraction
      if (Array.isArray(data)) {
        data.forEach(item => {
          if (item && typeof item === 'object' && item[config.fieldName]) {
            addIfValid(item[config.fieldName]);
          }
        });
      } else if (typeof data === 'object' && data !== null) {
        Object.values(data).forEach((item: any) => {
          if (item && typeof item === 'object' && item[config.fieldName]) {
            addIfValid(item[config.fieldName]);
          }
        });
      }
    }
    
    const uniqueEmails = [...new Set(emails)];
    if (uniqueEmails.length === 0) {
      throw new Error(`No valid emails found for field "${config.fieldName}".`);
    }

    return uniqueEmails;
  } catch (error: any) {
    if (error.name === 'AbortError') {
      throw new Error("Connection timed out. The database might be too large or unreachable.");
    }
    throw new Error(error.message || "Failed to connect to RTDB.");
  }
}
