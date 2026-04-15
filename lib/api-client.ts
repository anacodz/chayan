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

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(path, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
  });

  if (!response.ok) {
    let data;
    try {
      data = await response.json();
    } catch (e) {
      data = null;
    }
    throw new ApiError(response.status, data?.message || "An unexpected error occurred", data);
  }

  return response.json() as Promise<T>;
}

export const apiClient = {
  interviews: {
    getInvite: (token: string) => 
      request<{ session: any }>(`/api/invites/${token}`),
    
    postConsent: (sessionId: string) =>
      request(`/api/interviews/${sessionId}/consent`, { method: "POST" }),
    
    postHeartbeat: (sessionId: string, secondsToAdd: number) =>
      request(`/api/interviews/${sessionId}/heartbeat`, {
        method: "POST",
        body: JSON.stringify({ secondsToAdd }),
      }),
    
    postComplete: (sessionId: string) =>
      request(`/api/interviews/${sessionId}/complete`, { method: "POST" }),
  },
  
  questions: {
    list: (questionSetId: string = "default") =>
      request<{ questions: any[] }>(`/api/questions?questionSetId=${questionSetId}`),
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
          if (xhr.status >= 200 && xhr.status < 300) {
            try {
              resolve(JSON.parse(xhr.responseText));
            } catch (e) {
              reject(new ApiError(xhr.status, "Invalid response from server"));
            }
          } else {
            let message = "Upload failed";
            try {
              const data = JSON.parse(xhr.responseText);
              message = data.message || message;
            } catch (e) {}
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
      }>(`/api/answers/${answerId}/status`),
  },
  
  reports: {
    summarize: (sessionId: string, answers: any[]) =>
      request("/api/summarize", {
        method: "POST",
        body: JSON.stringify({ sessionId, answers }),
      }),
  }
};
