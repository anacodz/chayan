/**
 * Centralized API client for Chayan.
 * Handles common tasks like error handling, CSRF, and data normalization.
 */

export class ApiError extends Error {
  constructor(public status: number, message: string, public data?: any) {
    super(message);
    this.name = "ApiError";
  }
}

/**
 * A resilient fetch wrapper that checks content type, handles auth errors,
 * and provides an optional fallback strategy to minimize client-side crashes.
 */
export async function safeFetch<T>(
  path: string, 
  options: RequestInit & { skipRedirect?: boolean } = {}, 
  fallback?: T
): Promise<T> {
  const { skipRedirect, ...fetchOptions } = options;
  try {
    const response = await fetch(path, {
      ...fetchOptions,
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
    });

    const contentType = response.headers.get("content-type");
    const isJson = contentType && contentType.includes("application/json");

    if (!response.ok) {
      // Handle Unauthorized or Forbidden
      if ((response.status === 401 || response.status === 403) && !skipRedirect) {
        if (typeof window !== "undefined" && !window.location.pathname.startsWith("/auth/signin")) {
          const signInUrl = `/auth/signin?callbackUrl=${encodeURIComponent(window.location.pathname)}`;
          window.location.href = signInUrl;
        }
      }
      
      let errorData;
      if (isJson) {
        errorData = await response.json();
      } else {
        const text = await response.text();
        errorData = { message: text.slice(0, 100) }; // Log only first 100 chars
      }
      throw new ApiError(response.status, errorData?.message || "An unexpected error occurred", errorData);
    }

    // Success response but not JSON (unexpected for API)
    if (!isJson) {
      throw new ApiError(response.status, "Expected JSON response but received different content type.");
    }

    return await response.json() as T;
  } catch (error) {
    console.error(`API Error on ${path}:`, error);
    
    // Backup Strategy: Return fallback if provided to succeed the task gracefully
    if (fallback !== undefined) {
      return fallback;
    }
    
    throw error;
  }
}

/**
 * Legacy request function for compatibility, now using safeFetch internally.
 */
async function request<T>(path: string, options: RequestInit & { skipRedirect?: boolean } = {}): Promise<T> {
  return safeFetch<T>(path, options);
}

export const apiClient = {
  interviews: {
    getInvite: (token: string) => 
      request<{ session: any }>(`/api/invites/${token}`, { skipRedirect: true }),
    
    postConsent: (sessionId: string) =>
      request(`/api/interviews/${sessionId}/consent`, { method: "POST", skipRedirect: true }),
    
    postHeartbeat: (sessionId: string, secondsToAdd: number) =>
      request(`/api/interviews/${sessionId}/heartbeat`, {
        method: "POST",
        body: JSON.stringify({ secondsToAdd }),
        skipRedirect: true
      }),
    
    postComplete: (sessionId: string) =>
      request(`/api/interviews/${sessionId}/complete`, { method: "POST", skipRedirect: true }),
  },
  
  questions: {
    list: (questionSetId: string = "default") =>
      request<{ questions: any[] }>(`/api/questions?questionSetId=${questionSetId}`, { skipRedirect: true }),
  },
  
  answers: {
    upload: async (formData: FormData, onProgress?: (pct: number) => void) => {
      return new Promise<{ answerId: string }>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open("POST", "/api/answers/upload");
        
        if (onProgress) {
          xhr.upload.onprogress = (e) => {
            if (e.lengthComputable) {
              const pct = Math.round((e.loaded / e.total) * 100);
              onProgress(pct);
            }
          };
        }

        xhr.onload = () => {
          const contentType = xhr.getResponseHeader("content-type");
          const isJson = contentType && contentType.includes("application/json");

          if (xhr.status >= 200 && xhr.status < 300) {
            if (isJson) {
              try {
                resolve(JSON.parse(xhr.responseText));
              } catch (e) {
                reject(new ApiError(xhr.status, "Invalid JSON response from server"));
              }
            } else {
              reject(new ApiError(xhr.status, "Expected JSON response but received different content type."));
            }
          } else {
            // Don't redirect candidates to sign-in on upload failure
            
            let message = "Upload failed";
            if (isJson) {
              try {
                const data = JSON.parse(xhr.responseText);
                message = data.message || message;
              } catch (e) {}
            }
            reject(new ApiError(xhr.status, message));
          }
        };

        xhr.onerror = () => reject(new Error("Network error during upload"));
        xhr.send(formData);
      });
    },
    
    getStatus: (answerId: string) =>
      request<{ 
        status: string; 
        evaluation?: any; 
        transcript?: string 
      }>(`/api/answers/${answerId}/status`, { skipRedirect: true }),
  },
  
  reports: {
    summarize: (sessionId: string, answers: any[]) =>
      request("/api/summarize", {
        method: "POST",
        body: JSON.stringify({ sessionId, answers }),
      }),
  }
};
