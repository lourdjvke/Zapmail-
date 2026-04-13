export async function fetchEmailsFromRTDB(config: {
  url: string;
  folder: string;
  subfolders: string[];
  explore: boolean;
  fieldName: string;
  nameFieldName?: string;
}): Promise<Array<{ email: string; name?: string }>> {
  if (!config.url) {
    throw new Error("RTDB URL is required");
  }

  let baseUrl = config.url.trim();
  if (baseUrl.endsWith('/')) {
    baseUrl = baseUrl.slice(0, -1);
  }
  
  if (!baseUrl.startsWith('http')) {
    baseUrl = `https://${baseUrl}`;
  }

  const basePath = (config.folder || '').trim().replace(/^\/+|\/+$/g, '');
  const subPath = (config.subfolders || []).map(s => s.trim().replace(/^\/+|\/+$/g, '')).filter(Boolean).join('/');
  const path = subPath ? `${basePath}/${subPath}` : basePath;
  
  const fetchUrl = `${baseUrl}/${path}.json`;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);

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

    let results: Array<{ email: string; name?: string }> = [];
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    const MAX_RESULTS = 5000;
    const MAX_DEPTH = 20;

    const processNode = (obj: any) => {
      if (results.length >= MAX_RESULTS) return;
      if (typeof obj !== 'object' || obj === null) return;

      const emailVal = obj[config.fieldName];
      const nameVal = config.nameFieldName ? obj[config.nameFieldName] : undefined;

      if (emailVal) {
        const name = typeof nameVal === 'string' ? nameVal.trim() : undefined;
        
        if (Array.isArray(emailVal)) {
          emailVal.forEach(e => {
            if (results.length < MAX_RESULTS && typeof e === 'string' && emailRegex.test(e.trim())) {
              results.push({ email: e.trim().toLowerCase() });
            }
          });
        } else if (typeof emailVal === 'string' && emailRegex.test(emailVal.trim())) {
          // Check for multiple emails in this node for "disciplined" logic
          let hasMultipleEmails = false;
          if (name) {
            let emailCount = 0;
            for (const k in obj) {
              const v = obj[k];
              if (typeof v === 'string' && emailRegex.test(v.trim())) {
                emailCount++;
                if (emailCount > 1) {
                  hasMultipleEmails = true;
                  break;
                }
              }
            }
          }

          results.push({ 
            email: emailVal.trim().toLowerCase(), 
            name: hasMultipleEmails ? undefined : name 
          });
        }
      }
    };

    if (config.explore) {
      const exploreData = (obj: any, depth: number = 0) => {
        if (results.length >= MAX_RESULTS || depth > MAX_DEPTH) return;
        if (typeof obj === 'object' && obj !== null) {
          processNode(obj);
          for (const key in obj) {
            exploreData(obj[key], depth + 1);
          }
        }
      };
      exploreData(data);
    } else {
      if (Array.isArray(data)) {
        data.forEach(processNode);
      } else if (typeof data === 'object' && data !== null) {
        for (const key in data) {
          processNode(data[key]);
        }
      }
    }
    
    // Deduplicate by email
    const seen = new Set();
    const uniqueResults = results.filter(item => {
      return seen.has(item.email) ? false : seen.add(item.email);
    });

    if (uniqueResults.length === 0) {
      throw new Error(`No valid emails found for field "${config.fieldName}".`);
    }

    return uniqueResults;
  } catch (error: any) {
    if (error.name === 'AbortError') {
      throw new Error("Connection timed out. The database might be too large or unreachable.");
    }
    throw new Error(error.message || "Failed to connect to RTDB.");
  }
}
