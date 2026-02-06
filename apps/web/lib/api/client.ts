import axios, { AxiosInstance, AxiosError } from "axios";
import type { ApiError } from "./types";

/**
 * API Client for Kushim backend
 */
class ApiClient {
  private client: AxiosInstance;

  constructor() {
    const baseURL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";

    this.client = axios.create({
      baseURL,
      timeout: 30000,
      headers: {
        "Content-Type": "application/json",
      },
    });

    // Request interceptor
    this.client.interceptors.request.use(
      (config) => {
        // Add auth token if available
        const token = this.getAuthToken();
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Response interceptor
    this.client.interceptors.response.use(
      (response) => response,
      (error: any) => {
        // Log raw error for debugging
        console.error("[ApiClient] Raw API Error:", error);

        // Check if response exists and has data
        let errorMessage = "An error occurred";
        let statusCode = 500;

        if (error?.response) {
          statusCode = error.response.status;
          
          // Try to parse error message from response
          const responseData = error.response.data;
          
          if (typeof responseData === 'string') {
            // Response is HTML or plain text, not JSON
            try {
              const parsed = JSON.parse(responseData);
              errorMessage = parsed.message || errorMessage;
            } catch {
              // Not JSON, use status text
              errorMessage = error.response.statusText || errorMessage;
            }
          } else if (responseData && typeof responseData === 'object') {
            // Response is already an object
            errorMessage = responseData.message || errorMessage;
          }
        } else if (error?.message) {
          errorMessage = error.message;
        }

        // Handle specific status codes
        if (statusCode === 401) {
          errorMessage = "Please log in to continue";
        } else if (statusCode === 404) {
          errorMessage = "Resource not found";
        } else if (statusCode === 500) {
          errorMessage = "Server error, please try again later";
        }

        // Construct API error
        const apiError: ApiError = {
          message: errorMessage,
          statusCode,
          error: error?.response?.data?.error || error.code,
        };

        // Log constructed error
        console.error("[ApiClient] Processed ApiError:", JSON.stringify(apiError, null, 2));

        return Promise.reject(apiError);
      }
    );
  }

  /**
   * Get auth token from storage
   */
  private getAuthToken(): string | null {
    if (typeof window === "undefined") return null;
    return localStorage.getItem("auth_token");
  }

  /**
   * Set auth token in storage
   */
  public setAuthToken(token: string): void {
    if (typeof window === "undefined") return;
    localStorage.setItem("auth_token", token);
  }

  /**
   * Remove auth token from storage
   */
  public removeAuthToken(): void {
    if (typeof window === "undefined") return;
    localStorage.removeItem("auth_token");
  }

  /**
   * GET request
   */
  public async get<T>(url: string, params?: Record<string, any>): Promise<T> {
    const response = await this.client.get<T>(url, { params });
    return response.data;
  }

  /**
   * POST request
   */
  public async post<T>(url: string, data?: Record<string, any>): Promise<T> {
    const response = await this.client.post<T>(url, data);
    return response.data;
  }

  /**
   * PUT request
   */
  public async put<T>(url: string, data?: Record<string, any>): Promise<T> {
    const response = await this.client.put<T>(url, data);
    return response.data;
  }

  /**
   * DELETE request
   */
  public async delete<T>(url: string): Promise<T> {
    const response = await this.client.delete<T>(url);
    return response.data;
  }
}

// Export singleton instance
export const apiClient = new ApiClient();
